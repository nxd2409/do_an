import { Component, ElementRef, inject, OnInit, ViewChild, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NgZorroModule } from '../../shared/ng-zorro.module';
import { AuthService } from '../services/auth.service';
import { FaceRecognitionService } from '../services/face-recognition.service';
import { LocalStorageUtils } from '../../services/utilities/local-storage.ultis';
import { PlatformUtils } from '../../services/utilities/platform.utils';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [NgZorroModule, NzCarouselModule, NzTimelineModule, CommonModule],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class Login implements OnInit, OnDestroy {
    @ViewChild('loginFaceVideo', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

    private readonly destroy$ = new Subject<void>();
    private stream: MediaStream | null = null;
    private isFaceDetecting = false;
    private isLoggingIn = false;

    meetingId: string = '';
    visibleType: number = 0;
    isPasswordVisible = false;
    isMobileTablet = false;
    isViewLogin = false;
    effect = 'scrollx';

    guestName = '';

    introduce = [
        {
            title: 'Tham gia dễ dàng, không cần cài đặt',
            subTitle: 'Chỉ cần một đường link hoặc mã mời - bạn có thể bắt đầu cuộc họp mọi lúc, mọi nơi. Không cần cài phần mềm phức tạp, ai cũng có thể sử dụng ngay từ lần đầu tiên.',
        },
        {
            title: 'Chia sẻ nội dung mượt mà',
            subTitle: 'Trình chiếu slide, chia sẻ màn hình, hay cùng nhau vẽ trên bảng trắng - tất cả đều dễ dàng. Họp online không chỉ là nói chuyện, mà còn là cùng nhau làm việc hiệu quả',
        },
        {
            title: 'Làm việc mọi lúc, mọi nơi',
            subTitle: 'Dù bạn đang dùng máy tính, tablet hay điện thoại - chỉ cần internet là có thể kết nối. Họp từ xa chưa bao giờ tiện lợi đến thế, phù hợp với mọi phong cách làm việc hiện đại.',
        },
        {
            title: 'An toàn và kiểm soát linh hoạt',
            subTitle: 'Bạn kiểm soát được ai vào phòng họp, ai được trình bày hay bật micro. Dữ liệu được mã hóa và bảo mật, giúp cuộc họp luôn an toàn và riêng tư.',
        },
    ];

    private readonly fb = inject(NonNullableFormBuilder);
    validateForm = this.fb.group({
        username: this.fb.control('', [Validators.required]),
        password: this.fb.control('', [Validators.required])
    });

    constructor(
        private readonly service: AuthService,
        private readonly faceService: FaceRecognitionService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.meetingId = this.route.snapshot.paramMap.get('meetingId') ?? '';
        this.checkScreenWidth();
        
        // Nếu có meetingId thì tự động hiện form login
        if (this.meetingId) {
            this.addBlurEffect();
            setTimeout(() => {
                this.isViewLogin = true;
            }, 200)
            
        }
    }

    onClickLogin() {
        this.addBlurEffect();
            setTimeout(() => {
                this.isViewLogin = true;
            }, 200)
    }

    @HostListener('window:resize')
    onResize(): void {
        this.checkScreenWidth();
    }

    checkScreenWidth(): void {
        if (typeof window !== 'undefined') {
        this.isMobileTablet = window.innerWidth <= 1024;

        if (this.isMobileTablet) {
            this.addBlurEffect();
            setTimeout(() => {
                this.isViewLogin = true;
            }, 200)
        }
    }
    }

    handleScreenClick(event: MouseEvent): void {
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer && !loginContainer.contains(event.target as Node)) {
            this.addBlurEffect();
            setTimeout(() => {
                this.isViewLogin = true;
            }, 200)
        }
    }

    private addBlurEffect(): void {
        setTimeout(() => {
            const landingContent = document.querySelector('.landing-content');
            if (landingContent) {
                landingContent.classList.add('blur-mode');
            }
        }, 50);
    }

    private removeBlurEffect(): void {
        const landingContent = document.querySelector('.landing-content');
        if (landingContent) {
            landingContent.classList.remove('blur-mode');
        }
    }

    togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }

    async changeTypeLogin(type: number): Promise<void> {
        this.visibleType = type;

        if (type === 1) {
            await this.startFaceRecognition();
        } else {
            this.stopFaceRecognition();
        }
    }

    backToLogin(): void {
        this.visibleType = 0;
    }

    joinAsGuest(): void {
        if (!this.guestName.trim()) return;

        if (this.isLoggingIn) return;

        this.isLoggingIn = true;
        this.service.joinAsGuest({
            name: this.guestName,
            meetingId: this.meetingId
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    if (res.status) {
                        this.handleLoginSuccess(res.data);
                    } else {
                        this.isLoggingIn = false;
                    }
                },
                error: (err) => {
                    this.isLoggingIn = false;
                }
            });
    }

    private async startFaceRecognition(): Promise<void> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            });

            if (this.stream && this.videoElement?.nativeElement) {
                this.videoElement.nativeElement.srcObject = this.stream;
                this.isFaceDetecting = true;
                this.detectFaceLoop();
            }
        } catch (err) {
            this.stopFaceRecognition();
        }
    }

    private stopFaceRecognition(): void {
        this.isFaceDetecting = false;

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement?.nativeElement) {
            this.videoElement.nativeElement.srcObject = null;
        }
    }

    private detectFaceLoop(): void {
        if (!this.isFaceDetecting || this.isLoggingIn) return;

        const video = this.videoElement?.nativeElement;
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
            setTimeout(() => this.detectFaceLoop(), 100);
            return;
        }

        const imageBlob = this.captureVideoFrame(video);
        if (!imageBlob) {
            setTimeout(() => this.detectFaceLoop(), 100);
            return;
        }

        this.faceService.searchFace(imageBlob)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (userId) => {
                    if (userId && !this.isLoggingIn) {
                        this.loginByFace(userId);
                    } else {
                        this.detectFaceLoop();
                    }
                },
                error: () => {
                    this.detectFaceLoop();
                }
            });
    }

    private captureVideoFrame(video: HTMLVideoElement): Blob | null {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.drawImage(video, 0, 0);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const byteString = atob(dataUrl.split(',')[1]);
            const byteArray = new Uint8Array(byteString.length);

            for (let i = 0; i < byteString.length; i++) {
                byteArray[i] = byteString.charCodeAt(i);
            }

            return new Blob([byteArray], { type: 'image/jpeg' });
        } catch (err) {
            return null;
        }
    }

    loginByAccount(): void {
        if (this.validateForm.invalid) {
            this.markFormAsDirty();
            return;
        }

        if (this.isLoggingIn) return;

        this.isLoggingIn = true;
        this.service.loginAccount(this.validateForm.value)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    if (res.status) {
                        this.handleLoginSuccess(res.data);
                    } else {
                        this.isLoggingIn = false;
                    }
                },
                error: (err) => {
                    this.isLoggingIn = false;
                }
            });
    }

    loginByFace(faceId: string): void {
        if (this.isLoggingIn) return;

        this.isLoggingIn = true;
        this.service.loginFace(faceId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res: any) => {
                    if (res.status) {
                        this.handleLoginSuccess(res.data);
                    } else {
                        this.isLoggingIn = false;
                        this.detectFaceLoop();
                    }
                },
                error: (err) => {
                    this.isLoggingIn = false;
                    this.detectFaceLoop();
                }
            });
    }

    private handleLoginSuccess(data: any): void {
        this.stopFaceRecognition();
          this.service
            .getRightOfUser({ userName: data.accountInfo.userName })
            .subscribe({
              next: (rights) => {
                LocalStorageUtils.setItem('userRights', rights)
                this.router.navigate(['/']);
              },
              error: (error) => {
              },
            });
        localStorage.setItem('accessToken', data.accessToken);
        LocalStorageUtils.setItem('accountInfo', data.accountInfo);
        const base = PlatformUtils.isMobile() ? '/m' : '';
        const targetRoute = this.meetingId
            ? `${base}/meeting/${this.meetingId}`
            : `${base}/home`;

        this.router.navigate([targetRoute]);
    }

    private markFormAsDirty(): void {
        Object.values(this.validateForm.controls).forEach(control => {
            if (control.invalid) {
                control.markAsDirty();
                control.updateValueAndValidity({ onlySelf: true });
            }
        });
    }

    ngOnDestroy(): void {
        this.stopFaceRecognition();
        this.destroy$.next();
        this.destroy$.complete();
    }
}