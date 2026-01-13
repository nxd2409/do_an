import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { NgModule } from '../../shared/ng-zorro.module';
import { AuthService } from '../services/auth.service';
import { LocalStorageUtils } from '../../services/utilities/local-storage.ultis';
import { Subject, takeUntil } from 'rxjs';
import { PlatformUtils } from '../../services/utilities/platform.utils';
import { FaceRecognitionService } from '../services/face-recognition.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [NgModule],
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
    ) { }

    ngOnInit(): void {
        this.meetingId = this.route.snapshot.paramMap.get('meetingId') ?? '';
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
            console.error('Không thể truy cập webcam:', err);
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
            console.error('Lỗi khi capture video frame:', err);
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
                    console.error('Lỗi đăng nhập:', err);
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
                    console.error('Lỗi đăng nhập bằng khuôn mặt:', err);
                    this.isLoggingIn = false;
                    this.detectFaceLoop();
                }
            });
    }

    private handleLoginSuccess(data: any): void {
        this.stopFaceRecognition();

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