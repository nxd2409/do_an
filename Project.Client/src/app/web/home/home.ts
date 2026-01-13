import { AccountDto } from './../../../../../Project.Admin/src/app/class/AD/account.class';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NzCalendarMode } from 'ng-zorro-antd/calendar';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { NgZorroModule } from '../../shared/ng-zorro.module';
import { PaginationResult } from '../../shared/class/pagination-result.class';
import { MeetingDto, MeetingVote } from '../../shared/class/meeting.class';
import { MeetingStatus } from '../../shared/statics/meeting-status.static';

import { GlobalService } from '../../services/common/global.service';
import { MainLayoutService } from '../../services/common/main-layout.service';
import { EnvironmentService } from '../../services/common/environment.service';
import { FileService } from '../../services/common/file.service';
import { MeetingService } from '../../services/meeting.service';
import { DeepSeekService } from '../../services/chatbot-ai/deep-seek.service';

import { LocalStorageUtils } from '../../services/utilities/local-storage.ultis';
import { StringUtils } from '../../services/utilities/string.ultis';
import { PlatformUtils } from '../../services/utilities/platform.utils';
import { TreeUtils } from '../../services/utilities/tree.ultis';
import { TitleService } from '../../services/title.service';
import { AccountService } from '../../services/account.service';
import Swal from 'sweetalert2';
import { MANAGE_MEETING } from '../../shared/constants/rights/meeting.constant';

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
  selector: 'app-web-home',
  imports: [NgZorroModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  @ViewChild('fileInputAddBieuQuyet')
  fileInputAddBieuQuyet!: ElementRef<HTMLInputElement>;

  private readonly destroy$ = new Subject<void>();

  // UI State
  isVisibleAI = false;
  isVisibleChangePass = false;
  isVisibleCreateMeeting = false;
  isVisibleProfile = false;
  isTablet = false;

  // Authentication

  isChangingPassword = false;
  passwordVisibleCurrent = false;
  passwordVisibleNew = false;
  passwordVisibleConfirm = false;
  passwordValidationMessage = '';
  passwordValidationType: 'success' | 'info' | 'warning' | 'error' = 'info';

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
  MANAGE_MEETING = MANAGE_MEETING
  linkMeeting: string = '';
  nameMeeting: string = '';
  meeting: MeetingDto = new MeetingDto();
  filter: MeetingDto = new MeetingDto();
  dto: AccountDto = new AccountDto();
  filterAccount: AccountDto = new AccountDto();
  listMeeting: PaginationResult = new PaginationResult();
  meetingStatus = MeetingStatus;
  isEditMode = false;
  isOngoingMeeting = false;
  originalMeetingData: any = null;

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

  //FaceId
  isShowModalRegisterFaceId: boolean = false;

  meetingDates: string[] = [];

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
    this.isTablet = this.env.getEnv('isTablet');
  }

  ngOnInit(): void {
    if (PlatformUtils.isMobile() && !this.isTablet) {
      this.router.navigate([`/m/home`]);
      return;
    }
    this.nameMeeting = `Cuộc họp ngày ${this.date.toLocaleDateString('vi-VN')}`;
    this.setTodayAsFilter();
    this.searchMeeting();
    this.loadRoomList();
    this.getTitle();
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

  onOpenMeetingByLink() {
    if (!this.linkMeeting) {
      this.message.warning('Vui lòng nhập link cuộc họp!');
      return;
    }
    window.location.href = this.linkMeeting;
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

    this.isEditMode = false;
    this.isOngoingMeeting = false;
    this.originalMeetingData = null;
  }

  createMeeting() {
    const checkChuTri = this.meeting.personal.filter((x) => x.isChuTri);
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

    if (!this.isEditMode && expected < now) {
      this.message.error(
        'Thời gian bắt đầu không được nhỏ hơn thời gian hiện tại!'
      );
      return;
    }

    // ✅ KHÔNG GỬI ID - Để backend xử lý logic xóa/thêm
    this.meeting.roomLayouts = this.roomItems
      .filter((item) => item.type === 'chair' && item.assignedPerson)
      .map((item) => ({
        // ❌ KHÔNG GỬI id
        roomItemId: item.id,
        userId: item.assignedPerson.userName,
        meetingId: this.meeting.id,
        isActive: true,
      }));

    this.meeting.expectedStartTime = this.global.formatDateTime(this.meeting.expectedStartTime)
    this.meeting.votes = this.listMeetingVote;

    const apiCall = this.isEditMode
      ? this._service.updateMeeting(this.meeting)
      : this._service.createMeeting(this.meeting);

    apiCall.subscribe({
      next: (res) => {
        console.log(res);
        if (res.status) {
          this.createMeetingClose();
          this.searchMeeting();
        }
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

  /**
 * Xóa cuộc họp (chỉ áp dụng cho cuộc họp Sắp diễn ra)
 */
  deleteMeeting(data: any, event: Event) {
    event.stopPropagation();

    if (data.status !== this.meetingStatus.ChuaBatDau) {
      this.message.warning('Chỉ có thể xóa cuộc họp chưa bắt đầu!');
      return;
    }

    Swal.fire({
      title: 'Xác nhận xóa cuộc họp',
      html: `
      Bạn có chắc chắn muốn xóa cuộc họp:<br/>
      <strong>${data.name}</strong><br/>
      <span style="color: #666; font-size: 14px;">
        ${new Date(data.expectedStartTime).toLocaleString('vi-VN')}
      </span>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
      confirmButtonColor: "#1890ff",
      cancelButtonColor: "#EA4335",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmDeleteMeeting(data.id);
      }
    });
  }

  private confirmDeleteMeeting(meetingId: string) {
    this._service.deleteMeeting(meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.searchMeeting();
        },
      });
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
            // <-- kiểm tra
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
    if (this.isEditMode && this.isOngoingMeeting) {
      const isOriginalMember = this.originalMeetingData.personal.some(
        (p: any) => p.userName === item.userName
      );

      if (isOriginalMember) {
        if (key === 'isThanhVien' && !item.isThanhVien) {
          this.message.warning('Không thể gỡ thành viên đang tham gia cuộc họp!');
          item.isThanhVien = true;
          return;
        }

        if (key === 'isChuTri' || key === 'isThuKy') {
          this.message.warning('Không thể thay đổi vai trò của thành viên đang tham gia!');
          const original = this.originalMeetingData.personal.find(
            (p: any) => p.userName === item.userName
          );
          item.isChuTri = original.isChuTri;
          item.isThuKy = original.isThuKy;
          return;
        }
      }
    }

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
        if (this.isEditMode && this.isOngoingMeeting) {
          const isOriginal = this.originalMeetingData.personal.some((p: any) => p.userName === i.userName);
          if (isOriginal && !item.isThanhVien) {
            return;
          }
        }
        i.isThanhVien = item.isThanhVien;
        if (!item.isThanhVien) {
          Object.assign(i, {
            isChuTri: false,
            isThuKy: false,
            isParticipateInVoting: false,
          });

          this.removePersonFromRoomItems(i);
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

      this.removePersonFromRoomItems(item);
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

    this.meeting.personal.sort((a, b) => {
      const rank = (x: any) => (x.isChuTri ? 1 : x.isThuKy ? 2 : 3);
      return rank(a) - rank(b);
    });

    this.syncAvailablePersons();
  }

  private removePersonFromRoomItems(person: any) {
    this.roomItems.forEach((chair) => {
      if (chair.assignedPerson && chair.assignedPerson.userName === person.userName) {
        chair.assignedPerson = null;
      }
    });
  }

  editMeeting(data: any, event: Event) {
    event.stopPropagation();

    this.isEditMode = true;
    this.isOngoingMeeting = data.status === this.meetingStatus.DangHop;

    forkJoin({
      meeting: this._service.getMeetingDetail(data.id),
      tree: this._service.buildTreeOrgAndUser(),
      rooms: this._service.getRoomList()
    }).subscribe({
      next: (result) => {
        this.meeting = result.meeting;
        this.originalMeetingData = JSON.parse(JSON.stringify(result.meeting));

        this.listOfMapData = TreeUtils.buildNzOrgTree(result.tree);
        this.listOfMapData.forEach((item) => {
          this.mapOfExpandedData[item.key] = this.convertTreeToList(item);
        });

        this.listRoom = result.rooms.data || result.rooms;

        this.markSelectedMembers();
        this.syncAvailablePersons();

        if (this.meeting.roomId) {
          this.loadRoomAndAssignSeats(this.meeting.roomId);
        }

        this.listMeetingVote = this.meeting.votes || [];

        this.isVisibleCreateMeeting = true;

      },
    });
  }


  private loadRoomAndAssignSeats(roomCode: string) {
    this._service.getRoomDetail(roomCode).subscribe({
      next: (roomRes) => {
        this.selectedRoom = roomRes;
        this.roomCanvasWidth = Number(roomRes.width) || 800;
        this.roomCanvasHeight = Number(roomRes.height) || 600;

        // ✅ Load room items
        this.roomItems = (roomRes.items || []).map((item: any) => ({
          id: item.id,
          type: item.type,
          style: item.style,
          x: parseFloat(item.x) || 0,
          y: parseFloat(item.y) || 0,
          width: parseFloat(item.width) || 0,
          height: parseFloat(item.height) || 0,
          rotation: parseFloat(item.rotation) || 0,
          assignedPerson: null // ← Khởi tạo null
        }));

        if (this.meeting.roomLayouts && this.meeting.roomLayouts.length > 0) {
          this.applyLayoutToChairs(this.meeting.roomLayouts);
        }

        this.syncAvailablePersons();
      },
    });
  }


  private applyLayoutToChairs(layouts: any[]) {
    layouts.forEach((layout: any) => {
      const chair = this.roomItems.find(item => item.id === layout.roomItemId);

      const person = this.meeting.personal.find((p: any) =>
        p.userName === layout.userId || p.id === layout.userId
      );

      if (chair && person) {
        chair.assignedPerson = { ...person };
      }
    });
  }


  private markSelectedMembers() {
    if (!this.meeting.personal || this.meeting.personal.length === 0) {
      return;
    }

    const allItems = Object.values(this.mapOfExpandedData).flatMap(arr => arr);

    this.meeting.personal.forEach((person: any) => {
      const item = allItems.find((i: any) =>
        i.userName === person.userName && i.typeBuildTree === 'USER'
      );

      if (item) {
        item.isThanhVien = true;
        item.isChuTri = person.isChuTri || false;
        item.isThuKy = person.isThuKy || false;
        item.isParticipateInVoting = person.isParticipateInVoting || false;
      }
    });
  }

  isOriginalMember(item: any): boolean {
    if (!this.isEditMode || !this.isOngoingMeeting || !this.originalMeetingData) {
      return false;
    }

    return this.originalMeetingData.personal.some(
      (p: any) => p.userName === item.userName
    );
  }
  deletePersonal(data: any) {
    // ===== VALIDATION =====
    if (this.isEditMode && this.isOngoingMeeting) {
      const isOriginalMember = this.originalMeetingData.personal.some(
        (p: any) => p.userName === data.userName
      );

      if (isOriginalMember) {
        this.message.warning('Không thể gỡ thành viên đang tham gia cuộc họp!');
        return;
      }
    }

    this.meeting.personal = this.meeting.personal.filter(
      (x) => x.userName !== data.userName
    );

    const allItems = Object.values(this.mapOfExpandedData).flatMap(arr => arr);

    allItems.forEach((i) => {
      if (i.userName === data.userName && i.typeBuildTree === 'USER') {
        i.isThanhVien = false;
        i.isChuTri = false;
        i.isThuKy = false;
        i.isParticipateInVoting = false;
      }
    });

    this.roomItems.forEach((chair) => {
      if (chair.assignedPerson && chair.assignedPerson.userName === data.userName) {
        chair.assignedPerson = null;
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
    this.date = today; // chọn ngày hôm nay trên calendar
  }

  onDateSelect(selectedDate: Date) {
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0'); // tháng 0-11 nên +1
    const day = selectedDate.getDate().toString().padStart(2, '0');
    this.filter.expectedStartTime = `${year}-${month}-${day}`;
    this.searchMeeting();
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

    // ✅ Nếu đang EDIT và đã có layout, KHÔNG load lại
    if (this.isEditMode && this.meeting.roomLayouts && this.meeting.roomLayouts.length > 0) {
      return;
    }

    // ✅ CHỈ load room khi CREATE hoặc EDIT nhưng chưa có layout
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
          assignedPerson: null
        }));

        this.syncAvailablePersons();
      },
      error: (err) => {
        this.message.error('Không thể tải thông tin phòng họp!');
      }
    });
  }

  private initAvailablePersons() {
    const assignedIds = this.roomItems
      .filter((item) => item.type === 'chair' && item.assignedPerson)
      .map((item) => item.assignedPerson.id);

    this.availablePersons = this.meeting.personal.filter(
      (p) => !assignedIds.includes(p.id)
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
    this.fromChairId = chair.id; // Lưu ID ghế nguồn

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
        fromChair.assignedPerson = null; // Xóa khỏi ghế cũ
      }
      item.assignedPerson = { ...this.draggedPerson }; // Thêm vào ghế mới

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

  //ĐỒNG BỘ DANH SÁCH SIDEBAR
  private syncAvailablePersons() {
    const assignedUserNames = this.roomItems
      .filter((item) => item.type === 'chair' && item.assignedPerson)
      .map((item) => item.assignedPerson.userName);

    this.availablePersons = this.meeting.personal.filter(
      (p) => !assignedUserNames.includes(p.userName)
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
    // Lấy bản ghi cuối cùng trong list
    const lastRecord = this.listMeetingVote[this.listMeetingVote.length - 1];

    // Nếu có bản ghi và bản ghi cuối cùng chưa nhập tiêu đề
    if (lastRecord && (!lastRecord.name || lastRecord.name.trim() === '')) {
      // Có thể thông báo người dùng
      this.message.warning(
        'Vui lòng hoàn thành tiêu đề của bản ghi trước khi thêm mới'
      );
      return; // dừng không thêm
    }

    // Thêm bản ghi mới
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

  //func profile
  modalProfileOpen() {
    // const userInfo = localStorage.getItem('UserInfo');
    // if (!userInfo) return;

    // const parsed = JSON.parse(userInfo);
    // this.userName = parsed.userName;
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
  //#region  ĐỔI MẬT KHẨU
  changePasswordSubmit(): void {
    this.passwordValidationMessage = '';

    if (!this.modelChangePass.currentPassword?.trim()) {
      this.showValidationError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (!this.modelChangePass.newPassword?.trim()) {
      this.showValidationError('Vui lòng nhập mật khẩu mới!');
      return;
    }

    if (!this.modelChangePass.confirmNewPassword?.trim()) {
      this.showValidationError('Vui lòng nhập xác nhận mật khẩu!');
      return;
    }

    if (this.modelChangePass.newPassword.length < 6) {
      this.showValidationError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (this.modelChangePass.newPassword !== this.modelChangePass.confirmNewPassword) {
      this.showValidationError('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    if (this.modelChangePass.currentPassword === this.modelChangePass.newPassword) {
      this.showValidationError('Mật khẩu mới không được trùng với mật khẩu cũ!');
      return;
    }

    this.isChangingPassword = true;
    this.modelChangePass.userName = this.accountInfo.userName;

    this._accountService
      .changePassword(this.modelChangePass)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isChangingPassword = false;

          if (res.status) {
            this.resetChangePasswordForm();
            this.startLogoutCountdown();
          } else {
            this.showValidationError(
              res.messageObject?.messageDetail || 'Đổi mật khẩu thất bại!'
            );
          }
        },
      });
  }

  cancelChangePassword(): void {
    this.resetChangePasswordForm();
  }

  private resetChangePasswordForm(): void {
    this.modelChangePass = {
      userName: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    };
    this.passwordValidationMessage = '';
    this.passwordVisibleCurrent = false;
    this.passwordVisibleNew = false;
    this.passwordVisibleConfirm = false;
  }

  private showValidationError(message: string): void {
    this.passwordValidationMessage = message;
    this.passwordValidationType = 'error';
  }
  //#endregion
}
