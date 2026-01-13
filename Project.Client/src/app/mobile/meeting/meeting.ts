//#region IMPORTS
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
} from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, Subject, Subscription, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import Swal from 'sweetalert2';
import OvenPlayer from 'ovenplayer';

import { NgZorroModule } from '../../shared/ng-zorro.module';
import { EnvironmentService } from '../../services/common/environment.service';
import { SignalRService } from '../../services/common/signalR.service';
import { GlobalService } from '../../services/common/global.service';
import { MeetingService } from '../../services/meeting.service';
import { FileService } from '../../services/common/file.service';
import { LocalStorageUtils } from '../../services/utilities/local-storage.ultis';
import { PlatformUtils } from '../../services/utilities/platform.utils';
import { RoomControl } from '../../shared/interfaces/room-control.interface';
import { MeetingPersonal, MeetingVote } from '../../shared/class/meeting.class';
import { SignalRAction } from '../../shared/statics/signalR-action.static';
import { MeetingStatus } from '../../shared/statics/meeting-status.static';
import {
  DocumentType,
  FileType,
} from '../../shared/statics/document-type.static';
import {
  MeetingVoteAnswer,
  MeetingVoteStatus,
} from '../../shared/statics/meeting-vote-status.static';
import { MeetingDto } from '../../shared/class/meeting.class';
import { PersonalType } from '../../shared/statics/personal-type.static';

declare var flvjs: any;
//#endregion

@Component({
  selector: 'app-meeting-web',
  imports: [NgZorroModule],
  templateUrl: './meeting.html',
  styleUrl: './meeting.scss',
})
export class Meeting implements OnInit, OnDestroy {
  //#region VIEW CHILDREN
  @ViewChild('excalidrawIframe')
  excalidrawIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('jitsiIframe') jitsiIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('audioNoify') audioNoify!: ElementRef<HTMLAudioElement>;
  @ViewChild('qrCode', { read: ElementRef }) qrCodeEl!: ElementRef;
  //#endregion

  //#region PROPERTIES
  private readonly destroy$ = new Subject<void>();
  private clockInterval: any;
  private messageListener?: (event: MessageEvent) => void;
  private hideTimeout: any;
  private sub!: Subscription;
  individualControlStates: Map<
    string,
    { isAudioMuted: boolean; isVideoMuted: boolean }
  > = new Map();
  isTablet = false;

  commonChatGroup = {
    userName: '',
    fullName: 'Trao đổi chung',
    isOnline: true,
    isCommonGroup: true,
  };

  // Meeting Data
  meetingInfo: MeetingDto = new MeetingDto();
  currentAccountInMeeting: MeetingPersonal = new MeetingPersonal();
  accountInfo: any;
  meetingId = '';
  currentTime = '';
  qrMeeting = window.location.href;

  // Meeting Participants
  listPersonalMeeting: any[] = [];
  listPersonalOnline: any[] = [];
  chuTri: MeetingPersonal | null = new MeetingPersonal();
  thuKy: MeetingPersonal | null = new MeetingPersonal();

  // Meeting Vote
  isVotingProcessing = false;
  listMeetingVote: any[] = [];
  bieuQuyetCreate = new MeetingVote();
  meetingVoteCalculate = {
    sumMeetingPersonalVote: 0,
    sumMeetingVote: 0,
    sumMeetingNotVote: 0,
    sumMeetingVoteDone: 0,
  };
  displayTime = '';
  private totalSeconds!: number;
  private isAnsweringVote = false;

  // Documents
  typeDocumentSelected = 0;
  documentAfterMeeting: any[] = [];
  documentCommon: any[] = [];
  listBienBan: any[] = [];
  documentPeronal: any[] = [];
  videoUrl: SafeUrl | null = null;
  videoKey = 0;
  tabsViewFile: any[] = [];
  tabsViewFileDetailVote: any[] = [];
  selectedIndexViewFile = 0;
  selectedIndexDetailVote = 0;
  idTabActive: any;
  isVisibleListDocument = false;
  isVisibleListReport = false;

  // UI States
  isMobileChatSidebarOpen = false;
  selectedIndex = 0;
  isVisibleControlAccount = false;
  isVisibleCreateVote = false;
  isVisibleQR = false;
  isVisibleVoteProcess = false;
  isVisibleVoteDetail = false;
  isClosedCaptions = false;
  isVisibleControlDevice = false;

  // Constants
  meetingStatus = MeetingStatus;
  documentType = DocumentType;
  meetingVoteStatus = MeetingVoteStatus;
  meetingVoteAnswer = MeetingVoteAnswer;
  personalType = PersonalType;
  fileType = FileType;

  // Room Layout
  selectedRoom: any = null;
  roomItems: any[] = [];
  roomCanvasWidth = 800;
  roomCanvasHeight = 600;
  isLoadingRoomLayout = false;

  // Jitsi
  jitsiServerUrl!: SafeResourceUrl;
  jitsiReady = false;
  jitsiScriptLoaded = false;
  isAudioMuted = true;
  isVideoMuted = true;

  isAudioMutedAll = true;
  isVideoMutedAll = true;

  isScreenSharing = false;
  isTileView = false;
  participantsCount = 0;
  recordingStatus?: boolean;
  recordingLink?: string;

  // Excalidraw
  excalidrawUrl!: SafeResourceUrl;
  excalidrawReady = false;
  excalidrawList: any[] = [];
  isVisibleExcalidrawList = false;
  currentExcalidrawId: string | null = null;

  // Live Stream
  private readonly STREAM_KEYS = {
    tv: 'ce478f41a74f4843adc2902cbb70b3df_1',
    cam: 'ce478f41a74f4843adc2902cbb70b3df_100',
  };
  private readonly STREAM_CONFIG = {
    maxAttempts: 5,
    baseDelay: 3000,
    initDelay: 500,
  };
  private streamPlayer: any;
  private isStreamErrorShown = false;
  selectedStreamSource: 'tv' | 'cam' = 'tv';
  private get streamWebrtcUrl(): string {
    return `wss://stream.xbot.vn/webrtc-stream/${this.STREAM_KEYS[this.selectedStreamSource]}_webrtc`;
  }

  // Room Control
  aqi = 25;
  co2Level = 600;
  controls: RoomControl = {
    mainLight: true,
    decorativeLight: false,
    brightness: 75,
    acTemperature: 24,
    projectorPower: true,
    projectorBrightness: 80,
    projectorInput: 'HDMI 1',
    speakerPower: true,
    volume: 60,
    microphonePower: true,
    airPurifier: true,
    airPurifierSpeed: 60,
    screen1Power: true,
    screen2Power: true,
    screen3Power: true,
    screenBrightness: 85,
  };

  // Chat
  selectedUserChat: any | null = null;
  messageInputChat = '';
  searchUserChat = '';
  messages: any[] = [];
  //#endregion

  // Tab Management
  isVisibleTabMenu = false;
  tabsConfig: any[] = [];
  //#endregion

  constructor(
    private http: HttpClient,
    public global: GlobalService,
    private message: NzMessageService,
    private env: EnvironmentService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private signalR: SignalRService,
    private _service: MeetingService,
    private _file: FileService
  ) {
    this.isTablet = this.env.getEnv('isTablet');
    this.meetingId = this.route.snapshot.paramMap.get('meetingId') ?? '';
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
    this.signalR.startConnection(this.accountInfo.userName, () =>
      this.intoTheMeeting()
    );
    this.listenToNotifications();
    this.setupMessageListener();
  }

  //#region LIFECYCLE HOOKS
  ngOnInit(): void {
    if (!PlatformUtils.isMobile() || this.isTablet) {
      this.router.navigate([`/meeting/${this.meetingId}`]);
      return;
    }
    

    this._service
      .getInfoMeeting(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res) {
            this.router.navigate(['not-found-meeting']);
            return;
          }

          this.meetingInfo = res;

          if (res.roomId) this.loadRoomWithLayout(res.roomId);

          if (res?.status === this.meetingStatus.DangHop) {
            const scriptUrl = encodeURIComponent(this.env.getEnv('jitsiScriptUrl'));
            this.jitsiServerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
              `jitsi/jitsi.html?scriptUrl=${scriptUrl}&t=${Date.now()}`
            );

            setTimeout(() => {
              this.selectedIndex = -1;
              setTimeout(() => {
                this.selectedIndex = 1
                this.refreshTabsConfig();
              });
            });
          }
        },
      });

    this.startClock();
    this.excalidrawUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `excalidraw/excalidraw.html?room=${this.meetingId}&t=${Date.now()}`
    );
    this.initTabsConfig();
  }

  ngOnDestroy(): void {
    if (this.sub && !this.sub.closed) {
      this.sub.unsubscribe();
      this.sub = null as any;
    }

    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = undefined;
    }

    this.cleanupStream();
    this.videoUrl = null;
    this.filePreview = null;

    if (this.jitsiReady) {
      this.sendJitsiCommand('HANG_UP');
      this.jitsiReady = false;
      this.jitsiScriptLoaded = false;
    }

    this.excalidrawReady = false;
    this.currentExcalidrawId = null;

    this.messages = [];
    this.listPersonalMeeting = [];
    this.listPersonalOnline = [];
    this.listMeetingVote = [];
    this.documentCommon = [];
    this.documentPeronal = [];
    this.documentAfterMeeting = [];
    this.listBienBan = [];
    this.excalidrawList = [];
    this.tabsViewFile = [];
    this.tabsViewFileDetailVote = [];
    this.roomItems = [];
    this.tabsConfig = [];

    this.individualControlStates.clear();

    this.isVisibleControlAccount = false;
    this.isVisibleCreateVote = false;
    this.isVisibleQR = false;
    this.isVisibleVoteProcess = false;
    this.isVisibleVoteDetail = false;
    this.isClosedCaptions = false;
    this.isVisibleControlDevice = false;
    this.isVisibleExcalidrawList = false;
    this.isVisibleListDocument = false;
    this.isVisibleListReport = false;
    this.isVisibleTabMenu = false;
    this.isMobileChatSidebarOpen = false;

    this.selectedUserChat = null;
    this.selectedRoom = null;
    this.currentSelectedFile = { icon: '', voiceToText: '' };

    document.body.style.overflow = '';

    this.exitTheMeeting();
    this.signalR.stop();

    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:beforeunload', ['$event'])
  destroyBrowser($event: any): void {
    this.exitTheMeeting();
    document.body.style.overflow = '';
  }
  //#endregion

  //#region INITIALIZATION
  private setupMessageListener() {
    this.messageListener = (event: MessageEvent) => {
      const { type, count, muted, on, enabled, link, data } = event.data;

      const handlers: { [key: string]: () => void } = {
        JITSI_SCRIPT_LOADED: () => {
          this.jitsiScriptLoaded = true;
          this.initJitsi();
        },
        JITSI_SCRIPT_ERROR: () =>
          this.message.error(
            'Không thể kết nối đến hệ thống phòng họp trực tuyến. Vui lòng liên hệ quản trị viên hệ thống!'
          ),
        JITSI_READY: () => (this.jitsiReady = true),
        JITSI_ERROR: () => this.message.error('Lỗi kết nối phòng họp'),
        PARTICIPANT_COUNT_CHANGED: () => (this.participantsCount = count),
        AUDIO_MUTE_CHANGED: () => {
          this.isAudioMuted = muted;
          this.syncStateToServer('audio', muted);
        },
        VIDEO_MUTE_CHANGED: () => {
          this.isVideoMuted = muted;
          this.syncStateToServer('video', muted);
        },
        SCREEN_SHARE_CHANGED: () => (this.isScreenSharing = on),
        TILE_VIEW_CHANGED: () => (this.isTileView = enabled),
        RECORDING_STATUS_CHANGED: () => (this.recordingStatus = on),
        RECORDING_LINK_AVAILABLE: () => {
          this.recordingLink = link;
          this.message.success('File ghi hình đã sẵn sàng');
        },
        RECORDING_STOPPED: () => this.message.warning('Ghi hình đã kết thúc'),
        SCENE_DATA: () => this.handleExcalidrawSave(data),
      };

      handlers[type]?.();
    };

    window.addEventListener('message', this.messageListener);
  }

  private startClock() {
    this.updateTime();
    this.clockInterval = setInterval(() => this.updateTime(), 1000);
  }

  private updateTime() {
    const now = new Date();
    this.currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }
  //#endregion

  //#region MEETING PROCESS

  endMeeting() {
    const isHost = this.currentAccountInMeeting.isChuTri || this.currentAccountInMeeting.isThuKy;
    const isGuest = this.currentAccountInMeeting.type === this.personalType.NguoiThamDu;

    Swal.fire({
      title: isHost ? 'Kết thúc cuộc họp' : 'Rời khỏi cuộc họp',
      text: isHost
        ? 'Bạn có chắc chắn muốn kết thúc cuộc họp này? Tất cả thành viên sẽ bị ngắt kết nối.'
        : 'Cuộc họp vẫn đang diễn ra, bạn có chắc chắn muốn rời cuộc họp?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
      confirmButtonColor: "#1890ff",
      cancelButtonColor: "#EA4335",
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (isHost) {
        // Chủ trì/Thư ký - Kết thúc cuộc họp
        this._service.endMeeting({ meetingId: this.meetingId })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.message.success('Đã kết thúc cuộc họp');
              this.router.navigate(['/home']);
            },
            error: () => {
              this.message.error('Không thể kết thúc cuộc họp');
            }
          });
      } else {
        this.exitTheMeeting();
        if (isGuest) {
          LocalStorageUtils.clear();
          this.message.info('Bạn đã rời khỏi cuộc họp');
          this.router.navigate(['/login']);
        } else {
          this.message.info('Bạn đã rời khỏi cuộc họp');
          this.router.navigate(['/home']);
        }
      }
    });
  }

  startMeeting() {
    this._service
      .startMeeting({ meetingId: this.meetingId })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  startRecording() {
    this.sendJitsiCommand('START_RECORDING');
    this.recordingStatus = true;
    this._service
      .startRecording({ meetingId: this.meetingId })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  stopRecording() {
    this.sendJitsiCommand('STOP_RECORDING');
    this.recordingStatus = false;
    this._service
      .endRecording({ meetingId: this.meetingId })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  raiseHand() {
    this._service
      .raiseHand({
        username: this.accountInfo.userName,
        meetingId: this.meetingId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  intoTheMeeting() {
    this._service
      .intoTheMeeting(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  exitTheMeeting() {
    this._service
      .exitTheMeeting(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getPersonalMeeting() {
    this._service
      .getPersonalMeeting(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.listPersonalMeeting = res.sort((a: any, b: any) => {
            const rank = (x: any) => (x.isChuTri ? 1 : x.isThuKy ? 2 : 3);
            return rank(a) - rank(b);
          });

          this.chuTri = res.find((x: any) => x.isChuTri) || null;
          this.thuKy = res.find((x: any) => x.isThuKy) || null;
          this.currentAccountInMeeting = res.find(
            (x: any) => x.userName === this.accountInfo.userName
          );

          if (!this.currentAccountInMeeting) {
            this.message.error('Bạn không có trong danh sách cuộc họp');
            this.router.navigate(['/m/home']);
            return;
          }

          this.initTabsConfig();

          this.meetingVoteCalculate.sumMeetingPersonalVote = res.filter(
            (x: any) => x.isParticipateInVoting
          )?.length;

          this.getListFilesCommon();
          this.getListFilesPersonal();
          this.getOnlineUsers();
          this.getMeetingVote();

          if (!this.selectedUserChat) {
            setTimeout(() => this.selectUser(this.commonChatGroup), 1000);
          }
        },
      });
  }

  getOnlineUsers() {
    this.listPersonalOnline = [];
    this._service
      .getOnlineUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.listPersonalMeeting.forEach((i) => {
            i.isOnline = res.includes(i.userName);
            if (i.isOnline) this.listPersonalOnline.push(i);
          });

          if (this.selectedUserChat) {
            this.selectedUserChat = this.listPersonalMeeting.find(
              (x) => x.userName === this.selectedUserChat.userName
            );
          }
        },
      });
  }

  filePreview: SafeResourceUrl | null = null;
  idTab: any;

  viewRecording(file: any, mode: string) {
    this.currentSelectedFile = file;
    if (
      this.currentSelectedFile.icon == 'img/multimedia.png' ||
      this.currentSelectedFile.icon == 'img/audio.png'
    ) {
      this.videoUrl = null;
      setTimeout(() => {
        const url = `${this.env.getEnv('apiBaseUrl')}/File/StreamVideo/${file.id}?t=${Date.now()}`;
        this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }, 100);
    } else {
      const idTab = this.generateShortId();
      this.idTab = idTab;
      this.filePreview = this.sanitizer.bypassSecurityTrustResourceUrl(
        `only-office/only-office-viewer.html?id=${idTab}&t=${Date.now()}`
      )

      this.observeIframeAndPostMessage(idTab, {
        file: file,
        mode,
        idTab,
        account: this.accountInfo,
        environment: this.env.getEnv('apiBaseUrl'),
        onlyOfficeUrl: this.env.getEnv('onlyOfficeServerUrl'),
      });
    }
  }
  toggleMobileChatSidebar() {
    this.isMobileChatSidebarOpen = !this.isMobileChatSidebarOpen;
  }
  //#endregion

  //#region MEETING VOTE
  closeControlAccount() {
    this.isVisibleControlAccount = false;
  }
  openControlAccount() {
    this.isVisibleControlAccount = true;
  }
  closeCreateVote() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined as any;
    }
    this.isVisibleCreateVote = false;
    this.bieuQuyetCreate = new MeetingVote();
  }
  openCreateVote() {
    this.isVisibleCreateVote = true;
  }

  closeQR() {
    this.isVisibleQR = false;
  }

  createVote() {
    this.bieuQuyetCreate.meetingId = this.meetingId;
    this._service
      .createMeetingVote(this.bieuQuyetCreate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.closeCreateVote(),
      });
  }

  getMeetingVote() {
    this._service
      .getMeetingVote(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.listMeetingVote = res;

        const voteProcessing = res.find(
          (x: any) => x.status === this.meetingVoteStatus.DangBieuQuyet
        );
        this.isVotingProcessing = !!voteProcessing;

        this.meetingVoteCalculate.sumMeetingNotVote = res.filter(
          (x: any) => x.status === this.meetingVoteStatus.ChuaBatDau
        ).length;
        this.meetingVoteCalculate.sumMeetingVoteDone = res.filter(
          (x: any) => x.status === this.meetingVoteStatus.KetThuc
        ).length;

        this.calculateVoteStatistics();

        if (voteProcessing) {
          if (this.currentAccountInMeeting.isParticipateInVoting) {
            const hasAnswered = voteProcessing.results.some(
              (x: any) => x.username === this.currentAccountInMeeting.userName
            );
            this.bieuQuyetCreate = voteProcessing;
            if (!hasAnswered && !this.isVisibleVoteProcess) {
              setTimeout(() => this.openVoteProcess(voteProcessing.id), 200);
            }
          }
          this.startCountdown(voteProcessing);
        }
      });
  }

  private calculateVoteStatistics() {
    if (this.listMeetingVote.length === 0) return;

    this.listMeetingVote.forEach((vote: any) => {
      vote.sumPersonalVote = this.meetingVoteCalculate.sumMeetingPersonalVote;
      vote.sumResults = vote.results.length;
      vote.sumResultsPercentage =
        (vote.sumResults / vote.sumPersonalVote) * 100;

      const countByAnswer = (answer: number) =>
        vote.results.filter((x: any) => x.answer === answer).length;

      vote.tanThanh = countByAnswer(this.meetingVoteAnswer.TanThanh);
      vote.tanThanhPercentage = (vote.tanThanh / vote.sumResults) * 100;

      vote.khongTanThanh = countByAnswer(this.meetingVoteAnswer.KhongTanThanh);
      vote.khongTanThanhPercentage =
        (vote.khongTanThanh / vote.sumResults) * 100;

      vote.khongBieuQuyet = countByAnswer(
        this.meetingVoteAnswer.KhongBieuQuyet
      );
      vote.khongBieuQuyetPercentage =
        (vote.khongBieuQuyet / vote.sumResults) * 100;
    });
  }

  uploadFileMeetingVote(e: any) {
    const files = (e.target as HTMLInputElement).files;
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    this._file.upload(formData).subscribe({
      next: (res: any) => {
        this.bieuQuyetCreate.files = [
          ...this.bieuQuyetCreate.files,
          ...res.data,
        ];
      },
    });
  }

  deleteFileMeetingVoteCreate(file: any) {
    // TODO: Implement delete logic
  }

  downloadQrCode() {
    const element = this.qrCodeEl.nativeElement;
    const canvas = element.querySelector('canvas');
    const img = element.querySelector('img');

    const source = canvas ? canvas.toDataURL('image/png') : img?.src;
    if (!source) return;

    const link = document.createElement('a');
    link.href = source;
    link.download = 'meeting-qr.png';
    link.click();
  }

  startVoting(data: any) {
    if (this.isVotingProcessing) {
      this.message.warning(
        'Đang có biểu quyết diễn ra. Vui lòng chờ biểu quyết kết thúc!'
      );
      return;
    }
    this._service.startVoting(data).pipe(takeUntil(this.destroy$)).subscribe();
  }

  endVoting(data: any) {
    this._service.endVoting(data).pipe(takeUntil(this.destroy$)).subscribe();
  }

  detailVote(data: any) {
    this._service
      .getDetailVote(data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          res.files.forEach((i: any) => this.viewFileVote(i, 'view'));
          this.prepareVoteDetail(res);
          this.isVisibleVoteDetail = true;
        },
      });
  }

  private prepareVoteDetail(vote: any) {
    this.bieuQuyetCreate = vote;
    this.bieuQuyetCreate.sumPersonalVote =
      this.meetingVoteCalculate.sumMeetingPersonalVote;
    this.bieuQuyetCreate.sumResults = vote.results.length;
    this.bieuQuyetCreate.sumResultsPercentage =
      (this.bieuQuyetCreate.sumResults / this.bieuQuyetCreate.sumPersonalVote) *
      100;

    const countByAnswer = (answer: number) =>
      vote.results.filter((x: any) => x.answer === answer).length;

    this.bieuQuyetCreate.tanThanh = countByAnswer(
      this.meetingVoteAnswer.TanThanh
    );
    this.bieuQuyetCreate.tanThanhPercentage =
      (this.bieuQuyetCreate.tanThanh / this.bieuQuyetCreate.sumResults) * 100;

    this.bieuQuyetCreate.khongTanThanh = countByAnswer(
      this.meetingVoteAnswer.KhongTanThanh
    );
    this.bieuQuyetCreate.khongTanThanhPercentage =
      (this.bieuQuyetCreate.khongTanThanh / this.bieuQuyetCreate.sumResults) *
      100;

    this.bieuQuyetCreate.khongBieuQuyet = countByAnswer(
      this.meetingVoteAnswer.KhongBieuQuyet
    );
    this.bieuQuyetCreate.khongBieuQuyetPercentage =
      (this.bieuQuyetCreate.khongBieuQuyet / this.bieuQuyetCreate.sumResults) *
      100;
  }

  viewFileVote(data: any, mode: string) {
    if (!data) return;

    const existingIndex = this.tabsViewFileDetailVote.findIndex(
      (t) => t.id === data.id
    );
    if (existingIndex !== -1) {
      const tab = this.tabsViewFileDetailVote[existingIndex];
      if (tab.mode === mode) {
        this.selectedIndexDetailVote = existingIndex;
        this.idTabActive = tab.idTab;
        return;
      }
      this.tabsViewFileDetailVote.splice(existingIndex, 1);
    }

    const idTab = this.generateShortId();
    this.idTabActive = idTab;

    const newTab = {
      ...data,
      idTab,
      mode,
      filePreview: this.sanitizer.bypassSecurityTrustResourceUrl(
        `only-office/only-office-viewer.html?t=${idTab}`
      ),
    };

    this.tabsViewFileDetailVote.push(newTab);
    this.selectedIndexDetailVote = this.tabsViewFileDetailVote.length - 1;

    this.observeIframeAndPostMessage(idTab, {
      file: data,
      mode,
      idTab,
      account: this.accountInfo,
      environment: this.env.getEnv('apiBaseUrl'),
      onlyOfficeUrl: this.env.getEnv('onlyOfficeServerUrl'),
    });
  }

  closeVoteDetail() {
    this.bieuQuyetCreate = new MeetingVote();
    this.isVisibleVoteDetail = false;
    this.tabsViewFileDetailVote = [];
  }

  openVoteProcess(voteId: any) {
    if (this.isAnsweringVote) {
      return;
    }

    this.isAnsweringVote = false;

    this._service
      .getDetailVote(voteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const hasAnswered = res.results?.some(
            (x: any) => x.username === this.currentAccountInMeeting.userName
          );

          if (hasAnswered) {
            return;
          }

          res.files.forEach((i: any) => this.viewFileVote(i, 'view'));
          this.bieuQuyetCreate = res;
          this.isVisibleVoteProcess = true;
          this.startCountdown(res);
        },
      });
  }

  answerVoteProcess(status: number) {
    if (this.isAnsweringVote) {
      return;
    }

    const hasAnswered = this.bieuQuyetCreate.results?.some(
      (x: any) => x.username === this.currentAccountInMeeting.userName
    );

    if (hasAnswered) {
      return;
    }

    this.isAnsweringVote = true;

    this._service
      .answerVote({
        voteId: this.bieuQuyetCreate.id,
        userName: this.currentAccountInMeeting.userName,
        answer: status,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isVisibleVoteProcess = false;
          this.tabsViewFileDetailVote = [];
          this.isAnsweringVote = false;
        },
        error: () => {
          this.isAnsweringVote = false;
        },
      });
  }

  startCountdown(data: any) {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined as any;
    }
    const minutes = data.time;
    const now = Date.now();
    let startTime = data.updateDate ? new Date(data.updateDate).getTime() : now;
    if (startTime > now) startTime = now;

    const endTime = startTime + minutes * 60 * 1000;
    this.calculateRemainingTime(endTime);

    this.sub = interval(1000).subscribe(() =>
      this.calculateRemainingTime(endTime)
    );
  }

  private calculateRemainingTime(endTime: number) {
    const diff = Math.floor((endTime - Date.now()) / 1000);

    if (diff <= 0) {
      this.totalSeconds = 0;
      this.updateDisplay();

      if (
        this.isVisibleVoteProcess &&
        this.currentAccountInMeeting?.isParticipateInVoting &&
        this.bieuQuyetCreate?.id &&
        !this.isAnsweringVote
      ) {
        const hasAnswered = this.bieuQuyetCreate.results?.some(
          (x: any) => x.username === this.currentAccountInMeeting.userName
        );

        if (!hasAnswered) {
          this.answerVoteProcess(this.meetingVoteAnswer.KhongBieuQuyet);
          this.message.warning(
            'Hết thời gian biểu quyết. Hệ thống tự động ghi nhận "Không biểu quyết"'
          );
        }
      }

      this.endVoting(this.bieuQuyetCreate);

      if (this.sub) {
        this.sub.unsubscribe();
        this.sub = undefined as any;
      }

      this.bieuQuyetCreate = new MeetingVote();
      return;
    }

    this.totalSeconds = diff;
    this.updateDisplay();
  }

  updateDisplay() {
    const mins = Math.floor(this.totalSeconds / 60);
    const secs = this.totalSeconds % 60;
    this.displayTime = `${String(mins).padStart(2, '0')}:${String(
      secs
    ).padStart(2, '0')}`;
  }

  closeTabViewFileVote(e: any) {
    this.tabsViewFileDetailVote.splice(e.index, 1);
    if (this.selectedIndexDetailVote >= this.tabsViewFileDetailVote.length) {
      this.selectedIndexDetailVote = this.tabsViewFileDetailVote.length - 1;
    }
  }

  onTabViewFileChangeVote(e: any) {
    const tab = this.tabsViewFileDetailVote[e];
    if (tab) this.idTabActive = tab.idTab;
  }
  //#endregion

  //#region DOCUMENTS
  modalListFileCancel() {
    this.isVisibleListDocument = false;
  }

  modalListFileOpen() {
    this.isVisibleListDocument = true;
  }

  getListFilesCommon() {
    this._service
      .getListFilesCommon(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.documentCommon = res.filter(
            (x: any) => x.type === this.fileType.TaiLieu
          );
          this.documentAfterMeeting = res.filter(
            (x: any) => x.type === this.fileType.TaiLieuSauHop
          );
          const orderType: any = {
            [this.fileType.BienBan]: 1,
            [this.fileType.GhiAm]: 2,
            [this.fileType.GhiHinh]: 3,
          };

          this.listBienBan = res
            .filter(
              (x: any) =>
                x.type === this.fileType.BienBan ||
                x.type === this.fileType.GhiAm ||
                x.type === this.fileType.GhiHinh
            )
            .sort((a: any, b: any) => {
              const typeCompare = orderType[a.type] - orderType[b.type];
              if (typeCompare !== 0) return typeCompare;

              return (a.orderNumber ?? 0) - (b.orderNumber ?? 0);
            });
        },
      });
  }

  getListFilesPersonal() {
    this._file
      .getByRefrence(this.currentAccountInMeeting.refrenceFileId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => (this.documentPeronal = res),
      });
  }

  moveToSharedDocument(file: any) {
    this._service
      .moveToSharedDocument(this.meetingId, file.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  downloadDocument(file: any) {
    this._file.download(file.id);
  }

  exportPersonal() {
    this._service.exportPersonal(this.meetingId);
  }

  uploadDocument(e: any) {
    const files = (e.target as HTMLInputElement).files;
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    const refrenceId =
      this.typeDocumentSelected === this.fileType.TaiLieu ||
        this.typeDocumentSelected == this.fileType.TaiLieuSauHop
        ? this.meetingInfo.refrenceFileId
        : this.currentAccountInMeeting.refrenceFileId;

    formData.append('refrenceFileId', refrenceId);
    formData.append('meetingId', this.meetingInfo.id);
    formData.append('type', this.typeDocumentSelected.toString());

    this._file.uploadAndSaveInMeeting(formData).subscribe({
      next: (res: any) => {
        if (this.typeDocumentSelected === this.fileType.TaiLieu) {
          this.documentCommon = [...this.documentCommon, ...res.data];
        }

        if (this.typeDocumentSelected === this.fileType.TaiLieuCaNhan) {
          this.documentPeronal = [...this.documentPeronal, ...res.data];
        }

        if (this.typeDocumentSelected === this.fileType.TaiLieuSauHop) {
          this.documentAfterMeeting = [
            ...this.documentAfterMeeting,
            ...res.data,
          ];
        }
      },
    });
  }

  viewFileDocument(data: any, mode: string) {
    if (!data) return;

    const existingIndex = this.tabsViewFile.findIndex((t) => t.id === data.id);
    if (existingIndex !== -1) {
      const tab = this.tabsViewFile[existingIndex];
      if (tab.mode === mode) {
        this.selectedIndexViewFile = existingIndex;
        this.idTabActive = tab.idTab;
        return;
      }
      this.tabsViewFile.splice(existingIndex, 1);
    }

    const idTab = this.generateShortId();
    this.idTabActive = idTab;

    const newTab = {
      ...data,
      idTab,
      mode,
      filePreview: this.sanitizer.bypassSecurityTrustResourceUrl(
        `only-office/only-office-viewer.html?t=${idTab}`
      ),
    };

    this.tabsViewFile.push(newTab);
    this.selectedIndexViewFile = this.tabsViewFile.length - 1;

    this.observeIframeAndPostMessage(idTab, {
      file: data,
      mode,
      idTab,
      account: this.accountInfo,
      environment: this.env.getEnv('apiBaseUrl'),
      onlyOfficeUrl: this.env.getEnv('onlyOfficeServerUrl'),
    });
  }

  closeTabViewFileDocument(e: any) {
    this.tabsViewFile.splice(e.index, 1);
    if (this.selectedIndexViewFile >= this.tabsViewFile.length) {
      this.selectedIndexViewFile = this.tabsViewFile.length - 1;
    }
  }

  onTabViewFileChangeDocument(e: any) {
    const tab = this.tabsViewFile[e];
    if (tab) this.idTabActive = tab.idTab;
  }

  currentSelectedFile: any = {
    icon: '',
    voiceToText: '',
  };

  saveVoiceToText() {
    this._service
      .saveVoiceToText(this.currentSelectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { },
      });
  }

  exportSummaryMeeting() {
    this._service
      .exportSummaryMeeting(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.getListFilesCommon();
        },
      });
  }

  //#endregion

  //#region BIÊN BẢN HOP
  modalListReportOpen() {
    this.isVisibleListReport = true;
  }
  modalListReportCancel() {
    this.isVisibleListReport = false;
  }
  //#endregion

  //#region JITSI
  onJitsiIframeLoad() { }

  private initJitsi() {
    if (!this.jitsiScriptLoaded) return;

    const config = {
      domain: this.env.getEnv('jitsiServerUrl').replace('https://', ''),
      roomName: `${this.meetingId}HostServer${this.env.getEnv('jitsiHostServer')}`,
      displayName: this.accountInfo?.fullName || 'Người dùng',
      email: this.accountInfo?.email || '',
    };

    this.jitsiIframe?.nativeElement.contentWindow?.postMessage(
      {
        type: 'INIT_JITSI',
        data: config,
        serverCallback: this.env.getEnv('apiBaseUrl').replace('/api', ''),
      },
      '*'
    );
  }

  toggleAudioForUser(userName: string) {
    const state = this.individualControlStates.get(userName) || {
      isAudioMuted: false,
      isVideoMuted: false,
    };
    state.isAudioMuted = !state.isAudioMuted;
    this.individualControlStates.set(userName, state);

    this._service
      .controlParticipant({
        meetingId: this.meetingId,
        username: userName,
        action: 'audio',
        value: state.isAudioMuted,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  toggleVideoForUser(userName: string) {
    const state = this.individualControlStates.get(userName) || {
      isAudioMuted: false,
      isVideoMuted: false,
    };
    state.isVideoMuted = !state.isVideoMuted;
    this.individualControlStates.set(userName, state);

    this._service
      .controlParticipant({
        meetingId: this.meetingId,
        username: userName,
        action: 'video',
        value: state.isVideoMuted,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  toggleAllMedia(type: 'audio' | 'video', mute: boolean) {
    if (type === 'audio') {
      this.isAudioMutedAll = mute;
    } else if (type === 'video') {
      this.isVideoMutedAll = mute;
    }

    this._service
      .toggleAllMedia({
        meetingId: this.meetingId,
        action: type,
        value: mute,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  kickUserFromMeeting(user: any) {
    this._service
      .kickParticipant({
        meetingId: this.meetingId,
        username: user.userName,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getUserControlState(userName: string): {
    isAudioMuted: boolean;
    isVideoMuted: boolean;
  } {
    return (
      this.individualControlStates.get(userName) || {
        isAudioMuted: false,
        isVideoMuted: false,
      }
    );
  }

  toggleAudio() {
    this.sendJitsiCommand('TOGGLE_AUDIO');
  }
  toggleVideo() {
    this.sendJitsiCommand('TOGGLE_VIDEO');
  }
  toggleScreenShare() {
    this.sendJitsiCommand('TOGGLE_SCREEN_SHARE');
  }
  toggleChat() {
    this.sendJitsiCommand('TOGGLE_CHAT');
  }
  toggleTileView() {
    this.sendJitsiCommand('TOGGLE_TILE_VIEW');
  }
  muteEveryone() {
    this.sendJitsiCommand('MUTE_EVERYONE');
  }

  private syncStateToServer(type: 'audio' | 'video', muted: boolean) {
    this._service
      .syncParticipantState({
        meetingId: this.meetingId,
        username: this.accountInfo.userName,
        action: type,
        value: muted,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private sendJitsiCommand(command: string, data?: any) {
    if (!this.jitsiReady) {
      this.message.warning(
        'Không thể kết nối đến hệ thống phòng họp trực tuyến. Vui lòng liên hệ quản trị viên hệ thống!'
      );
      return;
    }

    this.jitsiIframe?.nativeElement.contentWindow?.postMessage(
      {
        type: command,
        data: data || this.meetingInfo,
        serverCallback: this.env.getEnv('apiBaseUrl').replace('/api', ''),
      },
      '*'
    );
  }
  //#endregion

  //#region EXCALIDRAW
  onExcalidrawIframeLoad() {
    this.excalidrawReady = true;
  }

  onClickSaveExcalidraw() {
    if (!this.excalidrawReady) {
      return;
    }
    this.excalidrawIframe?.nativeElement.contentWindow?.postMessage(
      { type: 'GET_SCENE_DATA' },
      '*'
    );
  }

  onClickLoadDataExcalidraw() {
    this.message.info('Chức năng đang phát triển');
  }

  onClickNewExcalidraw() {
    this.excalidrawUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'excalidraw/excalidraw.html?' + Date.now()
    );
    this.message.success('Đã tạo bảng trắng mới');
  }

  private handleExcalidrawSave(data: any) {
    if (!data || !data.elements || data.elements.length === 0) {
      return;
    }

    Swal.fire({
      title: 'Lưu bảng trắng',
      input: 'text',
      inputLabel: 'Nhập tên cho bảng trắng',
      inputPlaceholder: 'Ví dụ: Bảng trắng cuộc họp ngày 20/11/2025',
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#1890ff',
      cancelButtonColor: '#d33',
      inputValidator: (value) => {
        if (!value) {
          return 'Vui lòng nhập tên bảng trắng!';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.saveExcalidrawData(result.value, data);
      }
    });
  }
  private saveExcalidrawData(name: string, sceneData: any) {
    const payload = {
      id: this.currentExcalidrawId || undefined,
      meetingId: this.meetingId,
      name: name,
      data: JSON.stringify(sceneData),
      createBy: this.accountInfo.userName,
      createDate: new Date(),
    };

    this._service
      .saveExcalidraw(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.currentExcalidrawId = res.id;
          this.loadExcalidrawList();
        },
        error: () => { },
      });
  }

  loadExcalidrawList() {
    this._service
      .getExcalidrawList(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.excalidrawList = res || [];
        },
        error: (err) => {
          this.excalidrawList = [];
        },
      });
  }

  // Mở danh sách bảng trắng
  openExcalidrawList() {
    this.loadExcalidrawList();
    this.isVisibleExcalidrawList = true;
  }

  // Load bảng trắng đã lưu
  loadSavedExcalidraw(item: any) {
    this._service
      .getExcalidrawDetail(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.currentExcalidrawId = res.id;
          const sceneData = JSON.parse(res.data);
          this.loadExcalidrawData(sceneData);
          this.isVisibleExcalidrawList = false;
          this.message.success(`Đã tải bảng trắng: ${res.name}`);
        },
        error: () => { },
      });
  }

  // Xóa bảng trắng
  deleteExcalidrawItem(item: any, event: Event) {
    event.stopPropagation();

    Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa bảng trắng "${item.fileName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#f5222d',
      cancelButtonColor: '#d9d9d9',
    }).then((result) => {
      if (result.isConfirmed) {
        this._service
          .deleteExcalidraw(item.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadExcalidrawList();

              if (this.currentExcalidrawId === item.id) {
                this.onClickNewExcalidraw();
              }
            },
            error: () => { },
          });
      }
    });
  }

  closeExcalidrawList() {
    this.isVisibleExcalidrawList = false;
  }

  private loadExcalidrawData(data: any, retryCount = 0) {
    const MAX_RETRY = 10; // Tối đa 5 giây

    if (!this.excalidrawReady) {
      if (retryCount >= MAX_RETRY) {
        this.message.error('Không thể tải bảng trắng. Vui lòng thử lại!');
        return;
      }
      setTimeout(() => this.loadExcalidrawData(data, retryCount + 1), 500);
      return;
    }

    this.excalidrawIframe?.nativeElement.contentWindow?.postMessage(
      {
        type: 'LOAD_SCENE_DATA',
        data: data,
      },
      '*'
    );
  }
  //#endregion

  //#region LIVE STREAM
  onStreamTabActivated(): void {
    setTimeout(() => this.initStreamPlayer(), this.STREAM_CONFIG.initDelay);
  }

  selectStreamSource(source: 'tv' | 'cam'): void {
    if (this.selectedStreamSource === source) return;
    this.selectedStreamSource = source;
    this.restartStream();
  }

  retryStream(): void {
    this.message.info('Đang kết nối lại...');
    this.restartStream();
  }

  private restartStream(): void {
    this.cleanupStream();
    setTimeout(() => this.initStreamPlayer(), this.STREAM_CONFIG.initDelay);
  }

  private initStreamPlayer(): void {
    if (typeof OvenPlayer === 'undefined') {
      this.message.error('Không thể tải thư viện player');
      return;
    }

    try {
      this.streamPlayer = OvenPlayer.create('streamVideo', {
        sources: [{ type: 'webrtc', file: this.streamWebrtcUrl }],
        autoStart: false,
        controls: true,
        mute: false,
      });

      this.streamPlayer.on('ready', () => {
        this.isStreamErrorShown = false;
        this.streamPlayer.play();
      });

      this.streamPlayer.on('error', () => this.handleStreamError());
      this.streamPlayer.on('stateChanged', (data: any) => {
        if (data.newstate === 'error') this.handleStreamError();
      });
    } catch {
      this.message.error('Không thể khởi tạo stream');
    }
  }

  private handleStreamError(): void {
    if (this.isStreamErrorShown) return;
    this.isStreamErrorShown = true;
    this.message.error(
      'Mất kết nối. Vui lòng nhấn "Kết nối lại" để thử lại hoặc chuyển sang chế độ xem khác.'
    );
  }

  private removeStreamPlayer(): void {
    if (this.streamPlayer) {
      try {
        this.streamPlayer.remove();
      } catch { }
      this.streamPlayer = null;
    }
  }

  private cleanupStream(): void {
    this.removeStreamPlayer();
  }
  //#endregion

  //#region ROOM CONTROL
  openRoomControlDevice(): void {
    this.isVisibleControlDevice = true;
  }
  closeRoomControlDevice(): void {
    this.isVisibleControlDevice = false;
  }
  toggleAC(power: boolean): void {
  }
  duplicateScreen(): void {
  }
  extendScreen(): void {
  }
  selectProjectorInput(input: string): void {
    this.controls.projectorInput = input;
  }
  formatTemperature(value: number): string {
    return `${value}°C`;
  }
  formatPercentage(value: number): string {
    return `${value}%`;
  }
  formatAirPurifierSpeed(value: number): string {
    return `Mức ${Math.ceil(value / 20)}/5`;
  }
  //#endregion

  //#region SIGNALR
  private listenToNotifications() {
    this.signalR.onNotification((data: any) => {
      if (data.meetingId !== this.meetingId) return;

      const actions: { [key: string]: () => void } = {
        [SignalRAction.RaiseHand]: () => {
          this.message.info(data.message);
          this.audioNoify.nativeElement.play();
        },
        [SignalRAction.StartMeeting]: () => {
          this.message.success(data.message);
          this.ngOnInit();
        },
        [SignalRAction.EndMeeting]: () => {
          this.sendJitsiCommand('HANG_UP');
          setTimeout(() => {
            this.message.info(data.message);
            this.router.navigate(['/m/home']);
          }, 500);
        },
        [SignalRAction.StartRecord]: () => {
          this.message.info(data.message);
          this.recordingStatus = true;
        },
        [SignalRAction.EndRecord]: () => {
          this.message.info(data.message);
          this.recordingStatus = false;
        },
        [SignalRAction.UploadFile]: () => {
          this.getListFilesCommon();
        },
        [SignalRAction.IntoTheMeeting]: () => this.getPersonalMeeting(),

        [SignalRAction.ExitTheMeeting]: () => this.getPersonalMeeting(),

        [SignalRAction.SendMessage]: () => {
          if (!this.selectedUserChat) {
            return;
          }

          const isCurrentUser =
            data.username === this.currentAccountInMeeting.userName;
          const isCommonGroup = this.selectedUserChat.isCommonGroup;

          const isPrivateMessageRelevant =
            !isCommonGroup &&
            (data.username === this.selectedUserChat.userName || isCurrentUser);

          if (isCommonGroup || isPrivateMessageRelevant) {
            this.getListMessage();
          }
        },

        [SignalRAction.CreateMeetingVote]: () => this.getMeetingVote(),
        [SignalRAction.StartVoting]: () => {
          this.message.info(data.message);
          this.getMeetingVote();

          if (
            this.currentAccountInMeeting?.isParticipateInVoting &&
            !this.isVisibleVoteProcess
          ) {
            setTimeout(() => { }, 200);
          }
        },

        [SignalRAction.EndVoting]: () => {
          this.message.info(data.message);

          if (this.sub && !this.sub.closed) {
            this.sub.unsubscribe();
            this.sub = undefined as any;
          }

          if (
            this.isVisibleVoteProcess &&
            !this.isAnsweringVote &&
            this.currentAccountInMeeting?.isParticipateInVoting
          ) {
            const hasAnswered = this.bieuQuyetCreate.results?.some(
              (x: any) => x.username === this.currentAccountInMeeting.userName
            );

            if (!hasAnswered) {
              this.isAnsweringVote = true;

              this._service
                .answerVote({
                  voteId: this.bieuQuyetCreate.id,
                  userName: this.currentAccountInMeeting.userName,
                  answer: this.meetingVoteAnswer.KhongBieuQuyet,
                })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    this.isAnsweringVote = false;
                    this.isVisibleVoteProcess = false;
                    this.tabsViewFileDetailVote = [];
                    setTimeout(() => this.getMeetingVote(), 500);
                  },
                  error: () => {
                    this.isAnsweringVote = false;
                    this.isVisibleVoteProcess = false;
                    this.tabsViewFileDetailVote = [];
                  },
                });
              return;
            }
          }

          this.isVisibleVoteProcess = false;
          this.tabsViewFileDetailVote = [];
          this.bieuQuyetCreate = new MeetingVote();
          setTimeout(() => this.getMeetingVote(), 500);
        },

        [SignalRAction.KickParticipant]: () => {
          if (data.username === this.currentAccountInMeeting.userName) {
            this.message.warning('Bạn đã bị mời ra khỏi cuộc họp');
            this.router.navigate(['/m/home']);
          }
        },

        [SignalRAction.SyncParticipantState]: () => {
          const state = this.individualControlStates.get(data.username) || {
            isAudioMuted: false,
            isVideoMuted: false,
          };

          if (data.controlType === 'audio') {
            state.isAudioMuted = data.value;
          } else if (data.controlType === 'video') {
            state.isVideoMuted = data.value;
          }

          this.individualControlStates.set(data.username, state);
        },

        [SignalRAction.ControlParticipant]: () => {
          if (data.username === this.currentAccountInMeeting.userName) {
            if (data.controlAction === 'audio') {
              this.isAudioMuted = data.value;
              this.sendJitsiCommand(data.value ? 'MUTE_AUDIO' : 'UNMUTE_AUDIO');
            } else if (data.controlAction === 'video') {
              this.isVideoMuted = data.value;
              this.sendJitsiCommand(data.value ? 'MUTE_VIDEO' : 'UNMUTE_VIDEO');
            }
          }
        },

        [SignalRAction.ToggleAllMedia]: () => {
          if (data.mediaType === 'audio') {
            this.isAudioMuted = data.value;
            this.isAudioMutedAll = data.value;
            this.sendJitsiCommand(data.value ? 'MUTE_AUDIO' : 'UNMUTE_AUDIO');
            this.message.warning(
              `Chủ trì đã ${data.value ? 'tắt' : 'bật'} micro của tất cả`
            );
          } else if (data.mediaType === 'video') {
            this.isVideoMuted = data.value;
            this.isVideoMutedAll = data.value;
            this.sendJitsiCommand(data.value ? 'MUTE_VIDEO' : 'UNMUTE_VIDEO');
            this.message.warning(
              `Chủ trì đã ${data.value ? 'tắt' : 'bật'} camera của tất cả`
            );
          }
        },
      };

      actions[data.action]?.();
    });
  }
  //#endregion

  //#region CHAT
  selectUser(user: any): void {
    this.selectedUserChat = user;
    this.getListMessage();
  }

  getListMessage() {
    this._service
      .getListMessage({
        meetingId: this.meetingId,
        senderUserId: this.currentAccountInMeeting.userName,
        receiverUserId: this.selectedUserChat?.isCommonGroup
          ? ''
          : this.selectedUserChat?.userName,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.messages = res.data;
          setTimeout(() => this.scrollToBottom(), 100);
        },
      });
  }

  sendMessage(): void {
    if (!this.messageInputChat.trim() || !this.selectedUserChat) return;

    const newMessage: any = {
      meetingId: this.meetingId,
      senderUserId: this.currentAccountInMeeting.userName,
      receiverUserId: this.selectedUserChat?.isCommonGroup
        ? ''
        : this.selectedUserChat?.userName,
      messageText: this.messageInputChat,
    };

    this._service
      .sendMessage(newMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    this.messages.push(newMessage);
    this.messageInputChat = '';
    setTimeout(() => this.scrollToBottom(), 100);
  }

  getCurrentTime(): string {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  scrollToBottom(): void {
    const el = document.querySelector('.chat-messages');
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }
  //#endregion

  //#region UTILITIES

  backToHome() {
    this.router.navigate(['/m/home']);
  }

  copyCurrentLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => this.message.success('Đã sao chép liên kết cuộc họp!'))
      .catch(() => this.message.error('Không thể sao chép liên kết cuộc họp!'));
  }

  generateShortId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  observeIframeAndPostMessage(idTab: string, message: any) {
    const iframe = document.getElementById(idTab) as HTMLIFrameElement;
    if (iframe) {
      iframe.onload = () => iframe.contentWindow?.postMessage(message, '*');
      return;
    }

    const observer = new MutationObserver(() => {
      const iframe = document.getElementById(idTab) as HTMLIFrameElement;
      if (iframe) {
        iframe.onload = () => iframe.contentWindow?.postMessage(message, '*');
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  onTabChildInfoChange(index: any) {
    if (index === 1) {
      setTimeout(() => this.streamRtspCamera(), 200);
    }
  }

  streamRtspCamera() {
    if (!flvjs.isSupported()) return;

    const config = {
      enableStashBuffer: false,
      autoCleanupSourceBuffer: true,
      stashInitialSize: 128,
      seekType: 'range',
      lazyLoad: true,
      lazyLoadMaxDuration: 3,
      lazyLoadRecoverDuration: 2,
    };

    const streamRtsp = document.getElementById('streamRtsp');
    const flvPlayer = flvjs.createPlayer(
      {
        type: 'flv',
        url: 'wss://sso.d2s.com.vn:6655/live/P1',
        isLive: true,
        hasAudio: false,
      },
      config
    );

    flvPlayer.attachMediaElement(streamRtsp);
    flvPlayer.load();
    flvPlayer.play();
  }
  //#endregion

  //#region ROOM LAYOUT
  loadRoomWithLayout(roomCode: string) {
    this.isLoadingRoomLayout = true;

    this._service
      .getRoomDetail(roomCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
            assignedPerson: null,
          }));

          this.loadMeetingLayout();
        },
        error: () => (this.isLoadingRoomLayout = false),
      });
  }

  loadMeetingLayout() {
    this._service
      .getMeetingLayout(this.meetingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (layouts) => {
          if (!layouts || layouts.length === 0) {
            this.isLoadingRoomLayout = false;
            return;
          }

          if (
            !this.listPersonalMeeting ||
            this.listPersonalMeeting.length === 0
          ) {
            setTimeout(() => this.applyLayoutToChairs(layouts), 500);
          } else {
            this.applyLayoutToChairs(layouts);
          }

          this.isLoadingRoomLayout = false;
        },
      });
  }

  private applyLayoutToChairs(layouts: any[]) {
    layouts.forEach((layout: any) => {
      const chair = this.roomItems.find(
        (item) => item.id === layout.roomItemId
      );
      const person = this.listPersonalMeeting.find(
        (p: any) => p.userName === layout.userId || p.id === layout.userId
      );

      if (chair && person) {
        chair.assignedPerson = { ...person };
      }
    });
  }

  trackByItemId(index: number, item: any): string {
    return item.id || `index-${index}`;
  }

  getAssignedCount(): number {
    return this.roomItems.filter(
      (item) => item.type === 'chair' && item.assignedPerson
    ).length;
  }

  getChairCount(): number {
    return this.roomItems.filter((item) => item.type === 'chair').length;
  }

  getPersonTooltip(person: any): string {
    const role = person.isChuTri
      ? ' (Chủ trì)'
      : person.isThuKy
        ? ' (Thư ký)'
        : '';
    const title = person.title?.name ? ` - ${person.title.name}` : '';
    return `${person.fullName}${role}${title}`;
  }
  //#endregion

  //#region TAB MANAGEMENT
  private initTabsConfig() {
    const status = this.meetingInfo?.status;
    const isChuTriOrThuKy = this.currentAccountInMeeting?.isChuTri || this.currentAccountInMeeting?.isThuKy;

    this.tabsConfig = [
      {
        key: 'info',
        icon: 'bi-info-circle',
        label: 'Thông tin cuộc họp',
        description: 'Xem chi tiết thông tin',
        visible: true,
        originalIndex: 0
      },
      {
        key: 'online',
        icon: 'bi-film',
        label: 'Trực tuyến',
        description: 'Tham gia cuộc họp video',
        visible: status === this.meetingStatus.DangHop,
        originalIndex: 1
      },
      {
        key: 'document',
        icon: 'bi-file-earmark',
        label: 'Tài liệu',
        description: 'Xem tài liệu cuộc họp',
        visible: true,
        originalIndex: 2
      },
      {
        key: 'vote',
        icon: 'bi-clipboard-data',
        label: 'Biểu quyết',
        description: 'Tham gia bỏ phiếu',
        visible: true,
        originalIndex: 3
      },
      {
        key: 'whiteboard',
        icon: 'bi-border-all',
        label: 'Bảng trắng',
        description: 'Cộng tác trên bảng trắng',
        visible: status !== this.meetingStatus.ChuaBatDau,
        originalIndex: 4
      },
      {
        key: 'chat',
        icon: 'bi-people',
        label: 'Trao đổi',
        description: 'Trò chuyện với thành viên',
        visible: status !== this.meetingStatus.ChuaBatDau,
        originalIndex: 5
      },
      {
        key: 'minutes',
        icon: 'bi-file-earmark-check',
        label: 'Biên bản họp',
        description: 'Soạn thảo biên bản',
        visible: isChuTriOrThuKy && status === this.meetingStatus.KetThuc,
        originalIndex: 6
      },
      {
        key: 'stream',
        icon: 'bi-easel',
        label: 'Cầu truyền hình',
        description: 'Phát sóng trực tiếp',
        visible: true,
        originalIndex: 7
      }
    ];

    this.updateTabIndexes();
  }

  getTabDescription(key: string): string {
    const tab = this.tabsConfig.find(t => t.key === key);
    return tab?.description || '';
  }

  private updateTabIndexes() {
    const visibleTabs = this.tabsConfig.filter(tab => tab.visible);
    visibleTabs.forEach((tab, index) => {
      tab.actualIndex = index;
    });
  }

  getVisibleTabs() {
    return this.tabsConfig.filter(tab => tab.visible);
  }

  openTabMenu() {
    this.updateTabIndexes();
    this.isVisibleTabMenu = true;
    document.body.style.overflow = 'hidden';
  }

  closeTabMenu() {
    this.isVisibleTabMenu = false;
    document.body.style.overflow = '';
  }

  switchTab(tab: any) {
    if (tab.actualIndex !== undefined) {
      this.selectedIndex = tab.actualIndex;
    }
    this.closeTabMenu();
  }

  refreshTabsConfig() {
    this.initTabsConfig();
  }

  startY = 0;
  currentY = 0;
  swipeThreshold = 120;

  onTouchStart(e: TouchEvent): void {
    this.startY = e.touches[0].clientY;
  }

  onTouchMove(e: TouchEvent): void {
    this.currentY = e.touches[0].clientY;
  }

  onTouchEnd(): void {
    const deltaY = this.currentY - this.startY;
    if (deltaY > this.swipeThreshold) {
      this.closeTabMenu();
    }
    this.startY = 0;
    this.currentY = 0;
  }
  //#endregion
}
