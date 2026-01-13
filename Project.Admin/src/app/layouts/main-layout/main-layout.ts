import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { GlobalService } from '../../services/common/global.service';
import { MainLayoutService } from '../../services/common/main-layout.service';
import { DeepSeekService } from '../../services/chatbot-ai/deep-seek.service';
import { LocalStorageUtils } from '../../services/utilities/local-storage.ultis';
import { StringUtils } from '../../services/utilities/string.ultis';
import { TreeUtils } from '../../services/utilities/tree.ultis';
import { NgModule } from '../../shared/ng-zorro.module';

interface ChangePasswordModel {
  userName: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ChatMessage {
  role: 'User' | 'DeepSeek';
  content: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [NgModule],
  standalone: true,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit, OnDestroy {
  isCollapsed : boolean = window.innerWidth <= 768;
  isVisibleAI = false;
  isVisibleChangePass = false;
  breadcrumbs: any[] = [];
  chatAi: ChatMessage[] = [];
  inputChatbot = '';
  searchMenu = '';
  menuTree: any[] = [];
  displayedMenuTree: any[] = [];
  accountInfo: any;

  modelChangePass: ChangePasswordModel = {
    userName: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };

  private lastCheckedToken = 0;
  private readonly CHECK_INTERVAL = 60 * 1000;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private global: GlobalService,
    private service: MainLayoutService,
    private notification: NzNotificationService,
    private router: Router,
    private deepSeek: DeepSeekService
  ) {
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
  }

  ngOnInit(): void {
    this.initBreadcrumbs();
    this.getAllMenu();
    this.initEventListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('fullscreenchange', this.handleFullscreen);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // ===== INITIALIZATION =====
  private initBreadcrumbs(): void {
    this.breadcrumbs = this.global.breadcrumb || [];
    this.global.breadcrumbSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((value : any) => this.breadcrumbs = value);
  }

  private initEventListeners(): void {
    document.addEventListener('fullscreenchange', this.handleFullscreen);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // ===== MENU MANAGEMENT =====
  getAllMenu(): void {
    this.service.getMenuByUser(this.accountInfo.userName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.menuTree = this.displayedMenuTree = TreeUtils.buildNzMenuTree(res);
        }
      });
  }

  onOpenChange(changedMenu: any): void {
    if (changedMenu.level !== 1) return;
    
    this.menuTree.forEach(menu => {
      if (menu !== changedMenu && menu.level === 1) {
        menu.open = false;
      }
    });
    changedMenu.open = !changedMenu.open;
  }

  onSearchChangeMenu(): void {
    const keyword = this.searchMenu?.trim().toLowerCase();
    this.displayedMenuTree = keyword 
      ? this.filterMenuTree(this.menuTree, keyword)
      : this.menuTree;
  }

  private filterMenuTree(menuTree: any[], keyword: string): any[] {
    return menuTree.reduce((result: any[], node) => {
      const childrenMatched = node.children 
        ? this.filterMenuTree(node.children, keyword) 
        : [];
      const nameMatched = node.name.toLowerCase().includes(keyword);

      if (nameMatched || childrenMatched.length > 0) {
        result.push({
          ...node,
          children: childrenMatched.length > 0 ? childrenMatched : node.children || null,
          open: childrenMatched.length > 0 || node.open
        });
      }
      return result;
    }, []);
  }

  // ===== AI CHATBOT =====
  openAI(): void {
    this.isVisibleAI = true;
  }

  closeAI(): void {
    this.isVisibleAI = false;
  }

  resetAI(): void {
    this.chatAi = [];
  }

  onAskChatbot(): void {
    if (!this.inputChatbot.trim()) return;

    this.chatAi.push({ role: 'User', content: this.inputChatbot });
    const aiMessage: ChatMessage = { role: 'DeepSeek', content: '' };
    this.chatAi.push(aiMessage);

    this.deepSeek.sendMessage(this.inputChatbot)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chunk) => {
          const formattedText = StringUtils.removeEmoji(chunk)
            .replace(/["[\],]/g, '')
            .replace(/\\n/g, '<br>');
          aiMessage.content += formattedText;
        },
        error: (err) => console.error('API error:', err)
      });

    this.inputChatbot = '';
  }

  // ===== PASSWORD MANAGEMENT =====
  changePassOpen(): void {
    this.resetModelChangePass();
    this.isVisibleChangePass = true;
  }

  changePassOk(): void {
    const { currentPassword, newPassword, confirmNewPassword } = this.modelChangePass;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      this.notification.error('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      this.notification.error('Lỗi', 'Mật khẩu xác nhận không giống với mật khẩu mới!');
      return;
    }

    this.startLogoutCountdown();
  }

  changePassCancel(): void {
    this.resetModelChangePass();
    this.isVisibleChangePass = false;
  }

  private resetModelChangePass(): void {
    this.modelChangePass = {
      userName: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    };
  }

  private startLogoutCountdown(): void {
    let countdown = 5;
    const notiKey = 'countdown';
    
    const updateNotification = () => {
      this.notification.success(
        'Đổi mật khẩu thành công!',
        `Hệ thống sẽ khởi động lại sau ${countdown}s!`,
        { nzKey: notiKey, nzDuration: 0 }
      );
    };

    updateNotification();

    const timer = setInterval(() => {
      countdown--;
      updateNotification();

      if (countdown === 0) {
        clearInterval(timer);
        this.notification.remove(notiKey);
        this.logOut();
      }
    }, 1000);
  }

  // ===== NAVIGATION & AUTH =====
  navigateRoute(route: string): void {
    this.router.navigate([route]);
  }

  logOut(): void {
    LocalStorageUtils.clear();
    this.navigateRoute('login');
  }

  // ===== TOKEN VALIDATION =====
  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:click')
  onUserInteraction(): void {
    const now = Date.now();
    if (now - this.lastCheckedToken > this.CHECK_INTERVAL) {
      this.checkToken();
      this.lastCheckedToken = now;
    }
  }

  private handleFullscreen = (): void => {
    this.isCollapsed = !!document.fullscreenElement;
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.checkToken();
    }
  };

  private checkToken(): void {
    const token = localStorage.getItem('accessToken');
    if (!token || this.isTokenExpired(token)) {
      LocalStorageUtils.clear();
      this.router.navigate(['/un-authen']);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() > payload.exp * 1000;
    } catch {
      return true;
    }
  }
}