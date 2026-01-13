import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GlobalService } from '../../services/common/global.service';
import { NgZorroModule } from '../../shared/ng-zorro.module';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DeepSeekService } from '../../services/chatbot-ai/deep-seek.service';
import { MainLayoutService } from '../../services/common/main-layout.service';
import { LocalStorageUtils } from '../../services/utilities/local-storage.ultis';
import { Subject, takeUntil } from 'rxjs';
import { StringUtils } from '../../services/utilities/string.ultis';
import { NzCalendarMode } from 'ng-zorro-antd/calendar';
import { PlatformUtils } from '../../services/utilities/platform.utils';
import { NzMessageService } from 'ng-zorro-antd/message';
import { MeetingService } from '../../services/meeting.service';
import { EnvironmentService } from '../../services/common/environment.service';
import { FileService } from '../../services/common/file.service';
import { TreeUtils } from '../../services/utilities/tree.ultis';
import { PaginationResult } from '../../shared/class/pagination-result.class';
import { MeetingDto, MeetingVote } from '../../shared/class/meeting.class';
import { MeetingStatus } from '../../shared/statics/meeting-status.static';
import { AccountDto } from '../../../../../Project.Admin/src/app/class/AD/account.class';
import { TitleService } from '../../services/title.service';
import { AccountService } from '../../services/account.service';
import { SettingRegisterFaceIdComponent } from '../../faceId/components/setting-register-face-id/setting-register-face-id.component';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Html5Qrcode } from 'html5-qrcode';

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
  selector: 'app-mobile-home',
  imports: [NgZorroModule, SettingRegisterFaceIdComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  @ViewChild('fileInputAddBieuQuyet')
  fileInputAddBieuQuyet!: ElementRef<HTMLInputElement>;

  private readonly destroy$ = new Subject<void>();
  private html5QrCode: Html5Qrcode | null = null;

  // UI State
  isVisibleAI = false;
  isVisibleChangePass = false;
  isVisibleCreateMeeting = false;
  isVisibleProfile = false;
  isVisibleCalendar = false;
  isApplication = false;
  isTablet = false;
  isVisibleQRScanner = false;

  // Authentication
  accountInfo: any;
  modelChangePass: ChangePasswordModel = {
    userName: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  // AI Chatbot
  chatAi: ChatMessage[] = [];
  inputChatbot = '';

  // Meeting
  linkMeeting: string = '';
  nameMeeting: string = '';
  meeting: MeetingDto = new MeetingDto();
  filter: MeetingDto = new MeetingDto();
  dto: AccountDto = new AccountDto();
  filterAccount: AccountDto = new AccountDto();
  listMeeting: PaginationResult = new PaginationResult();
  meetingStatus = MeetingStatus;

  // Calendar
  date = new Date();
  mode: NzCalendarMode = 'month';

  // Room & Canvas
  listRoom: any[] = [];
  selectedRoom: any = null;
  roomItems: any[] = [];
  roomCanvasWidth: number = 800;
  roomCanvasHeight: number = 600;
  draggedPerson: any = null;
  dragOverChair: any = null;
  highlightedChairs: Set<string> = new Set();
  fromChairId: string | null = null;
  availablePersons: any[] = [];

  // Organization Tree
  listOfMapData: any[] = [];
  mapOfExpandedData: { [id: string]: any[] } = {};

  keyword: string = '';

  // vote
  isEditVote = false;
  listMeetingVote: any[] = [];
  bieuQuyetCreate: MeetingVote = new MeetingVote();
  voteIndex = -1;
  currentUploadIndex: number | null = null;

  // profile
  lstTitle: any[] = [];
  userName: string = '';

  meetingDates: string[] = [];

  isShowModalRegisterFaceId: boolean = false;


  constructor(
    public global: GlobalService,
    private service: MainLayoutService,
    private notification: NzNotificationService,
    private router: Router,
    private deepSeek: DeepSeekService,
    private message: NzMessageService,
    private _service: MeetingService,
    private env: EnvironmentService,
    private _file: FileService,
    private _title: TitleService,
    private _accountService: AccountService
  ) {
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
    this.isApplication = this.env.getEnv('isApplication');
    this.isTablet = this.env.getEnv('isTablet');
  }

  ngOnInit(): void {
    if (!PlatformUtils.isMobile() || this.isTablet) {
      this.router.navigate([`home`]);
      return;
    }
    this.nameMeeting = `Cuộc họp ngày ${this.date.toLocaleDateString('vi-VN')}`;
    this.setTodayAsFilter();
    this.searchMeeting();
    this.loadRoomList();
    this.getTitle();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.html5QrCode) {
      this.html5QrCode.stop().catch((err: unknown) => {
        console.error('Error stopping QR scanner on destroy:', err);
      });
      this.html5QrCode = null;
    }

    this.clearAllHighlights();
    this.draggedPerson = null;
    this.dragOverChair = null;
    this.fromChairId = null;

    if (this.fileInputAddBieuQuyet?.nativeElement) {
      this.fileInputAddBieuQuyet.nativeElement.value = '';
    }
  }

  // ==================== QR CODE SCANNER METHODS ====================

  async openQRScanner() {
    if (this.isApplication) {
      await this.scanWithMLKit();
    } else {
      this.isVisibleQRScanner = true;
      setTimeout(() => this.scanWithHtml5QrCode(), 300);
    }
  }

  private async scanWithMLKit() {
    try {
      const granted = await this.checkCameraPermission();
      if (!granted) {
        this.message.error('Vui lòng cấp quyền camera để quét QR code');
        return;
      }

      const result = await BarcodeScanner.scan({
        formats: [],
      });

      if (result.barcodes.length > 0) {
        const qrCode = result.barcodes[0].rawValue;
        this.handleQRCodeResult(qrCode);
      }
    } catch (error) {
      console.error('MLKit scan error:', error);
      this.message.error('Không thể quét QR code');
    }
  }

  private async checkCameraPermission(): Promise<boolean> {
    const { camera } = await BarcodeScanner.checkPermissions();
    if (camera === 'granted') return true;

    const { camera: newPermission } = await BarcodeScanner.requestPermissions();
    return newPermission === 'granted';
  }

  private scanWithHtml5QrCode() {
    this.html5QrCode = new Html5Qrcode('qr-reader');

    this.html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText: string) => {
        this.handleQRCodeResult(decodedText);
      },
      (_error: unknown) => {
        // Ignore continuous scanning errors
      }
    ).catch((err: unknown) => {
      console.error('Cannot start scanning:', err);
      this.message.error('Không thể khởi động camera');
      this.closeQRScanner();
    });
  }

  closeQRScanner() {
    if (this.html5QrCode) {
      this.html5QrCode.stop().then(() => {
        this.html5QrCode = null;
        this.isVisibleQRScanner = false;
      }).catch((err: unknown) => {
        console.error('Error stopping scanner:', err);
        this.isVisibleQRScanner = false;
      });
    } else {
      this.isVisibleQRScanner = false;
    }
  }

  private handleQRCodeResult(qrCode: string) {
    var url = this.env.getEnv('apiBaseUrl').replaceAll('/api', '');
    var meetingId = qrCode.replaceAll(url + '/meeting/', '').replaceAll(url + '/m/meeting/', '')
    this.router.navigate([`/m/meeting/${meetingId}`])
  }

  // ==================== MEETING METHODS ====================

  searchMeeting() {
    this._service.searchMeeting(this.filter).subscribe({
      next: (res) => {
        this.listMeeting = res;
        this.meetingDates = res.dates || [];
      },
    });
  }

  hasEvent(date: Date): boolean {
    const dateStr = this.formatDateToYYYYMMDD(date);
    return this.meetingDates.includes(dateStr);
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openMeetingDetail(data: any) {
    this.router.navigate([`/meeting/${data.id}`]);
  }

  onStartMeeting() {
    if (!this.nameMeeting) {
      this.message.warning('Vui lòng nhập tên để bắt đầu cuộc họp');
      return;
    }
    this._service
      .startQuickMeeting(this.nameMeeting)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.router.navigate([`/meeting/${res}`]);
        },
      });
  }

  onOpenMeetingByCode() {
    if (!this.linkMeeting) {
      this.message.warning('Vui lòng nhập link cuộc họp!');
      return;
    }
    this.router.navigate([`/m/meeting/${this.linkMeeting}`])
  }

  createMeetingOpen() {
    this.isVisibleCreateMeeting = true;
    this.meeting.expectedStartTime = new Date(
      new Date().getTime() + 30 * 60 * 1000
    );
    this.buildTreeOrgAndUser();
    this.loadRoomList();
  }

  createMeetingClose() {
    this.meeting = new MeetingDto();
    this.selectedRoom = null;
    this.roomItems = [];
    this.roomCanvasWidth = 800;
    this.roomCanvasHeight = 600;
    this.isVisibleCreateMeeting = false;
    this.listMeetingVote = [];
  }

  createMeeting() {
    const checkChuTri = this.meeting.personal.filter((x: any) => x.isChuTri);
    if (checkChuTri.length === 0) {
      this.message.error('Vui lòng chọn người chủ trì cuộc họp!');
      return;
    }
    const now = new Date();
    const expected = new Date(this.meeting.expectedStartTime);
    if (!expected) {
      this.message.error('Vui lòng chọn thời gian bắt đầu cuộc họp!');
      return;
    }

    if (expected < now) {
      this.message.error(
        'Thời gian bắt đầu không được nhỏ hơn thời gian hiện tại!'
      );
      return;
    }
    this.meeting.roomLayouts = this.roomItems
      .filter((item) => item.type === 'chair' && item.assignedPerson)
      .map((item) => ({
        roomItemId: item.id,
        userId: item.assignedPerson.id,
        isActive: true,
      }));
    this.meeting.votes = this.listMeetingVote;
    this._service.createMeeting(this.meeting).subscribe({
      next: (res) => {
        this.createMeetingClose();
        this.searchMeeting();
      },
    });
  }

  pageIndexChange(e: any) {
    // this.filter.currentPage = e;
    // this.searchMeeting();
  }

  pageSizeChange(e: any) {
    // this.filter.pageSize = e;
    // this.searchMeeting();
  }

  // ==================== FILE METHODS ====================

  upload(e: any) {
    const input = e.target as HTMLInputElement;
    const files = input.files;

    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    this._file.upload(formData).subscribe({
      next: (res: any) => {
        this.meeting.files = [...this.meeting.files, ...res.data];
      },
    });
  }

  deleteFile(f: any) {
    this.meeting.files = this.meeting.files.filter((x: any) => x.id !== f.id);
  }

  // ==================== ORGANIZATION TREE METHODS ====================

  buildTreeOrgAndUser() {
    this._service.buildTreeOrgAndUser().subscribe({
      next: (res) => {
        this.listOfMapData = TreeUtils.buildNzOrgTree(res);
        this.listOfMapData.forEach((item) => {
          this.mapOfExpandedData[item.key] = this.convertTreeToList(item);
        });
      },
    });
  }

  collapse(array: any[], data: any, $event: boolean): void {
    if (!$event) {
      if (data.children) {
        data.children.forEach((d: any) => {
          const target = array.find((a) => a.id === d.id);
          if (target) {
            target.expand = false;
            this.collapse(array, target, false);
          }
        });
      }
    }
  }

  convertTreeToList(root: any): any[] {
    const stack: any[] = [];
    const array: any[] = [];
    const hashMap: { [id: string]: boolean } = {};
    stack.push({ ...root, level: 0, expand: true });

    while (stack.length !== 0) {
      const node = stack.pop()!;
      this.visitNode(node, hashMap, array);
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push({
            ...node.children[i],
            level: node.level! + 1,
            expand: true,
            parent: node,
          });
        }
      }
    }

    return array;
  }

  visitNode(node: any, hashMap: { [id: string]: boolean }, array: any[]): void {
    if (!hashMap[node.id]) {
      hashMap[node.id] = true;
      array.push(node);
    }
  }

  onChangeCheckbox(item: any, key: string) {
    const allItems = Object.values(this.mapOfExpandedData).flatMap(
      (arr) => arr
    );
    const isOrg = item.typeBuildTree === 'ORG';
    const isUser = item.typeBuildTree === 'USER';

    const updateChildren = (callback: (i: any) => void) => {
      allItems.forEach((i) => {
        if (i.pId === item.id && i.typeBuildTree === 'USER') callback(i);
      });
    };

    if (isOrg && key === 'isThanhVien') {
      updateChildren((i) => {
        i.isThanhVien = item.isThanhVien;
        if (!item.isThanhVien) {
          Object.assign(i, {
            isChuTri: false,
            isThuKy: false,
            isParticipateInVoting: false,
          });
        }
      });
      if (!item.isThanhVien) item.isParticipateInVoting = false;
    }

    if (isOrg && key === 'isParticipateInVoting') {
      updateChildren((i) => {
        i.isParticipateInVoting = item.isParticipateInVoting && i.isThanhVien;
      });
    }

    if (isUser && key === 'isThanhVien' && !item.isThanhVien) {
      Object.assign(item, {
        isParticipateInVoting: false,
        isChuTri: false,
        isThuKy: false,
      });
    }

    if (isUser && key === 'isChuTri' && item.isChuTri) {
      Object.assign(item, { isThanhVien: true, isThuKy: false });
      allItems.forEach((i) => {
        if (i.id !== item.id) i.isChuTri = false;
      });
    }

    if (isUser && key === 'isThuKy' && item.isThuKy) {
      Object.assign(item, { isThanhVien: true, isChuTri: false });
    }

    this.meeting.personal = allItems.filter(
      (i) => i.isThanhVien && i.typeBuildTree !== 'ORG'
    );

    this.meeting.personal.sort((a: any, b: any) => {
      const rank = (x: any) => (x.isChuTri ? 1 : x.isThuKy ? 2 : 3);
      return rank(a) - rank(b);
    });

    this.syncAvailablePersons();
  }

  deletePersonal(data: any) {
    this.meeting.personal = this.meeting.personal.filter(
      (x: any) => x.id !== data.id
    );
    Object.values(this.mapOfExpandedData)
      .flatMap((arr) => arr)
      .forEach((i) => {
        if (i.typeBuildTree === 'ORG') {
          i.isThanhVien = false;
          i.isParticipateInVoting = false;
        }
        if (i.id === data.id) {
          i.isThanhVien = false;
          i.isChuTri = false;
          i.isThuKy = false;
          i.isParticipateInVoting = false;
        }
      });
    this.syncAvailablePersons();
  }
  search() {
    const keyword = this.keyword?.trim().toLowerCase();

    if (!keyword) {
      this.mapOfExpandedData = {};

      this.listOfMapData.forEach((root) => {
        const nodes = this.convertTreeToList(root);
        nodes.forEach((n) => (n.expand = true));
        this.mapOfExpandedData[root.key] = nodes;
      });

      return;
    }

    this.mapOfExpandedData = {};

    this.listOfMapData.forEach((root) => {
      const allNodes = this.convertTreeToList(root);

      const idMap = new Map(allNodes.map((n) => [n.id, n]));
      const filtered = new Set<any>();

      allNodes.forEach((node) => {
        const match =
          node.fullName?.toLowerCase().includes(keyword) ||
          node.name?.toLowerCase().includes(keyword) ||
          node.nameKhongDau?.toLowerCase().includes(keyword);

        if (!match) return;

        if (node.typeBuildTree === 'USER') {
          filtered.add(node);

          let p = node.parent ? idMap.get(node.parent.id) : null;
          while (p) {
            filtered.add(p);
            p.expand = true;
            p = p.parent ? idMap.get(p.parent.id) : null;
          }
          return;
        } else {
          filtered.add(node);

          const keepChildren = (n: any) => {
            if (!n.children) return;
            n.children.forEach((c: any) => {
              filtered.add(c);
              keepChildren(c);
            });
          };
          keepChildren(node);

          let p = node.parent ? idMap.get(node.parent.id) : null;
          while (p) {
            filtered.add(p);
            p.expand = true;
            p = p.parent ? idMap.get(p.parent.id) : null;
          }
        }
      });

      const result = allNodes.filter((n) => filtered.has(n));

      result.forEach((n) => (n.expand = true));

      this.mapOfExpandedData[root.key] = result;
    });
  }

  clearVisible(nodes: any[]) {
    nodes.forEach((node) => {
      node.visible = true;
      node.expand = false;
      const children = this.mapOfExpandedData[node.key] || [];
      this.clearVisible(children);
    });
  }

  removeAccents(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
  // ==================== AI CHATBOT METHODS ====================

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

    this.deepSeek
      .sendMessage(this.inputChatbot)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chunk) => {
          const formattedText = StringUtils.removeEmoji(chunk)
            .replace(/["[\],]/g, '')
            .replace(/\\n/g, '<br>');
          aiMessage.content += formattedText;
        },
      });

    this.inputChatbot = '';
  }

  // ==================== PASSWORD CHANGE METHODS ====================

  changePassOpen(): void {
    this.resetModelChangePass();
    this.isVisibleChangePass = true;
  }

  changePassOk(): void {
    const { currentPassword, newPassword, confirmNewPassword } =
      this.modelChangePass;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      this.notification.error('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      this.notification.error(
        'Lỗi',
        'Mật khẩu xác nhận không giống với mật khẩu mới!'
      );
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
      confirmNewPassword: '',
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

  // ==================== NAVIGATION METHODS ====================

  navigateToAdmin() {
    const newWindow = window.open(
      this.env.getEnv('adminUrl'),
      '_blank',
      'noopener,noreferrer'
    );
    if (newWindow) newWindow.opener = null;
  }

  navigateRoute(route: string): void {
    this.router.navigate([route]);
  }

  logOut(): void {
    LocalStorageUtils.clear();
    this.navigateRoute('login');
  }

  // ==================== CALENDAR METHODS ====================

  panelChange(change: { date: Date; mode: string }): void {

  }
  setTodayAsFilter() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    this.filter.expectedStartTime = `${year}-${month}-${day}`;
    this.date = today;
  }

  onDateSelect(selectedDate: Date) {
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    this.filter.expectedStartTime = `${year}-${month}-${day}`;
    this.searchMeeting();
    this.isVisibleCalendar = false;
  }

  // ==================== ROOM & CANVAS METHODS ====================

  loadRoomList() {
    this._service.getRoomList().subscribe({
      next: (res) => {
        this.listRoom = res.data || res;
      },
    });
  }

  onRoomChange(roomCode: string) {
    if (!roomCode) {
      this.selectedRoom = null;
      this.roomItems = [];
      this.roomCanvasWidth = 800;
      this.roomCanvasHeight = 600;
      this.availablePersons = [];
      return;
    }

    this._service.getRoomDetail(roomCode).subscribe({
      next: (res) => {
        this.selectedRoom = res;

        this.roomCanvasWidth = Number(res.width) || 800;
        this.roomCanvasHeight = Number(res.height) || 600;

        this.roomItems = (res.items || []).map((item: any) => ({
          id: item.id,
          type: item.type,
          style: item.style,
          x: parseFloat(item.x) || 0,
          y: parseFloat(item.y) || 0,
          width: parseFloat(item.width) || 0,
          height: parseFloat(item.height) || 0,
          rotation: parseFloat(item.rotation) || 0,
        }));

        this.syncAvailablePersons();
      },
      error: (err) => {
        this.message.error('Không thể tải thông tin phòng họp!');
      },
    });
  }

  private initAvailablePersons() {
    const assignedIds = this.roomItems
      .filter((item) => item.type === 'chair' && item.assignedPerson)
      .map((item) => item.assignedPerson.id);

    this.availablePersons = this.meeting.personal.filter(
      (p: any) => !assignedIds.includes(p.id)
    );
  }

  getItemIconType(item: any): string {
    return item.type === 'table' ? 'table' : 'user';
  }

  trackByItemId(index: number, item: any): string {
    return item.id || `index-${index}`;
  }
  // ==================== DRAG & DROP METHODS ====================

  onDragStart(event: DragEvent, person: any) {
    this.draggedPerson = person;
    this.fromChairId = null;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', person.id);
    (event.target as HTMLElement).style.opacity = '0.5';
  }

  onChairPersonDragStart(event: DragEvent, chair: any) {
    if (!chair.assignedPerson) return;

    this.draggedPerson = chair.assignedPerson;
    this.fromChairId = chair.id;

    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', chair.assignedPerson.id);

    const element = event.currentTarget as HTMLElement;
    element.style.opacity = '0.5';
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).style.opacity = '1';
    this.clearAllHighlights();
  }

  onCanvasDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    if (!this.draggedPerson) return;

    const nearbyChairs = this.findNearbyChairs(
      event.clientX,
      event.clientY,
      60
    );

    this.clearAllHighlights();

    nearbyChairs.forEach((chair) => {
      const element = document.querySelector(`[data-item-id="${chair.id}"]`);
      if (element) {
        element.classList.add('drag-nearby');
        this.highlightedChairs.add(chair.id);
      }
    });
  }

  onCanvasDrop(event: DragEvent) {
    event.preventDefault();
    this.clearAllHighlights();
    this.draggedPerson = null;
    this.dragOverChair = null;
    this.fromChairId = null;
  }

  onCanvasDragLeave(event: DragEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX >= rect.right ||
      event.clientY < rect.top ||
      event.clientY >= rect.bottom
    ) {
      this.clearAllHighlights();
    }
  }

  onItemDragOver(event: DragEvent, item: any) {
    if (item.type !== 'chair') return;
    if (!this.draggedPerson) return;

    if (item.assignedPerson && item.id !== this.fromChairId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'move';

    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drag-nearby');
    element.classList.add('drag-over');

    this.dragOverChair = item;
  }

  onItemDrop(event: DragEvent, item: any) {
    if (item.type !== 'chair') return;

    event.preventDefault();
    event.stopPropagation();

    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drag-over');
    this.clearAllHighlights();

    if (!this.draggedPerson) {
      this.message.warning('Không có người được chọn!');
      return;
    }

    if (this.fromChairId) {
      const fromChair = this.roomItems.find((c) => c.id === this.fromChairId);

      if (item.id === this.fromChairId) {
        this.draggedPerson = null;
        this.fromChairId = null;
        return;
      }

      if (item.assignedPerson) {
        this.message.warning('Ghế này đã có người ngồi!');
        this.draggedPerson = null;
        this.fromChairId = null;
        return;
      }

      if (fromChair) {
        fromChair.assignedPerson = null;
      }
      item.assignedPerson = { ...this.draggedPerson };

      this.message.success(
        `Đã chuyển ${this.draggedPerson.fullName} sang ghế mới`
      );
    } else {
      if (item.assignedPerson) {
        this.message.warning('Ghế này đã có người ngồi!');
        this.draggedPerson = null;
        return;
      }

      item.assignedPerson = { ...this.draggedPerson };

      this.syncAvailablePersons();

      this.message.success(`Đã xếp ${this.draggedPerson.fullName} vào ghế`);
    }

    this.draggedPerson = null;
    this.fromChairId = null;
    this.dragOverChair = null;
  }

  onChairDragLeave(event: DragEvent, item: any) {
    if (item.type !== 'chair') return;

    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drag-over');

    if (this.dragOverChair === item) {
      this.dragOverChair = null;
    }
  }

  removePersonFromChair(event: Event, chair: any) {
    event.stopPropagation();

    if (!chair.assignedPerson) return;

    const personName = chair.assignedPerson.fullName || 'người này';

    chair.assignedPerson = null;

    this.syncAvailablePersons();

    this.message.info(`Đã gỡ ${personName} khỏi ghế`);
  }

  private syncAvailablePersons() {
    const assignedIds = this.roomItems
      .filter((item) => item.type === 'chair' && item.assignedPerson)
      .map((item) => item.assignedPerson.id);

    this.availablePersons = this.meeting.personal.filter(
      (p: any) => !assignedIds.includes(p.id)
    );
  }

  private findNearbyChairs(mouseX: number, mouseY: number, radius: number) {
    return this.roomItems.filter((item) => {
      if (item.type !== 'chair') return false;

      if (item.assignedPerson && item.id !== this.fromChairId) return false;

      const element = document.querySelector(`[data-item-id="${item.id}"]`);
      if (!element) return false;

      const rect = element.getBoundingClientRect();
      const chairCenterX = rect.left + rect.width / 2;
      const chairCenterY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(mouseX - chairCenterX, 2) + Math.pow(mouseY - chairCenterY, 2)
      );

      return distance <= radius;
    });
  }

  private clearAllHighlights() {
    this.highlightedChairs.forEach((chairId) => {
      const element = document.querySelector(`[data-item-id="${chairId}"]`);
      element?.classList.remove('drag-nearby');
    });
    this.highlightedChairs.clear();

    document.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
  }

  // ==================== Vote ====================

  addVote() {
    const lastRecord = this.listMeetingVote[this.listMeetingVote.length - 1];

    if (lastRecord && (!lastRecord.name || lastRecord.name.trim() === '')) {
      this.message.warning(
        'Vui lòng hoàn thành tiêu đề của bản ghi trước khi thêm mới'
      );
      return;
    }

    this.listMeetingVote = [
      ...this.listMeetingVote,
      { ...this.bieuQuyetCreate, files: [...this.bieuQuyetCreate.files] },
    ];
  }
  deleteFileMeetingVoteCreate(index: any, file: any) {
    this.listMeetingVote[index].files = this.listMeetingVote[
      index
    ].files.filter((f: any) => f !== file);
  }

  deleteVote(index: number) {
    this.listMeetingVote = this.listMeetingVote.filter((_, i) => i !== index);
  }

  onClickUploadFile(index: number) {
    this.currentUploadIndex = index;
    this.fileInputAddBieuQuyet.nativeElement.click();
  }

  uploadFileMeetingVote(e: any) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length || this.currentUploadIndex === null) return;

    const formData = new FormData();
    if (files?.length) {
      Array.from(files).forEach((file) => formData.append('files', file));
    }

    this._file.upload(formData).subscribe({
      next: (res: any) => {
        this.listMeetingVote[this.currentUploadIndex!].files.push(...res.data);
        this.currentUploadIndex = null;
        input.value = '';
      },
    });
  }

  downloadDocument(file: any) {
    this._file.download(file.id);
  }

  modalProfileOpen() {
    this._accountService
      .detail(this.accountInfo.userName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.dto = res;
          this.isVisibleProfile = true;
        },
      });
  }

  getTitle() {
    this._title
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.lstTitle = res;
        },
      });
  }

  updateProfile() {
    this._accountService
      .update(this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res.status) return;
          if (this.accountInfo) {
            this.accountInfo = { ...this.accountInfo, ...this.dto };
            LocalStorageUtils.setItem('accountInfo', this.accountInfo);
          }
          this.dto = new AccountDto();
          this.dto.orgId = this.filterAccount.orgId;
          this.isVisibleProfile = false;
        },
      });
  }

  openDrawerCalendar() {
    this.isVisibleCalendar = true;
  }

}