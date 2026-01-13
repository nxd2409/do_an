import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { SettingIntroductionRegisterFaceIdComponent } from '../setting-introduction-register-face-id/setting-introduction-register-face-id.component';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { UntilDestroyService } from '../../../shared/services/until-destroy.service';
import { FaceIdService } from '../../services/faceId.service';
import { NgZorroModule } from '../../../shared/ng-zorro.module';

@Component({
  selector: 'app-setting-register-face-id',
  templateUrl: './setting-register-face-id.component.html',
  styleUrl: './setting-register-face-id.component.scss',
  imports: [
    WebcamModule,
    CommonModule,
    NzIconModule,
    SettingIntroductionRegisterFaceIdComponent,
    NgClass,
    NgZorroModule
  ],
  providers: [UntilDestroyService]
})
export class SettingRegisterFaceIdComponent {
  @Output() onCancelRegisterFace = new EventEmitter<boolean>(false);
  @Input() userId: string = '';
  @Input() dataUserDetail!: any;

  cameraPermission: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
  capturedImages: string[] = [];
  currentStep = 0;
  imageSelect: string = '';

  instructionsData: {index: number, label: string}[] = [
    {index: 1, label: "Nhìn thẳng vào camera"},
    {index: 2, label: "Nhìn trái 45 độ so với camera"},
    {index: 3, label: "Nhìn phải 45 độ so với camera"},
    {index: 4, label: "Nhìn trên 45 độ so với camera"},
    {index: 5, label: "Nhìn dưới 45 độ so với camera"},
    {index: 6, label: "Đã hoàn thành! Nhấn Cập nhật để tiếp tục"},
  ]
  typePictureResponse: string[] = ['Frontal','Left', 'Right', 'Up', 'Down'];
  imageFileBase64ToRegister: File[] = [];
  faceIdImagesBase64: string[] = [];

  stepFaceId: number = 1;
  isLoading: boolean = false;
  countdown: number = 3;
  showCountdown: boolean = false;
  private countdownInterval: any;

  private trigger: Subject<void> = new Subject<void>();
  webcamImage: WebcamImage | null = null;
  showErrMsg: string = '';

  constructor(
    private faceIdService: FaceIdService,
    private untilDestroyService: UntilDestroyService
  ){}
  
  async ngOnInit() {
    await this.checkCameraPermission();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  async onSubmit(): Promise<void>{
    let imageBase64List: string[] = await this.convertFilesToBase64(this.imageFileBase64ToRegister);
    if (this.imageFileBase64ToRegister.length === 5) {
      let dataRequest: {userId: string, imageBase64List: string[], userName: String} = {
        userId: String(localStorage.getItem("UserId")) || '',
        userName: this.dataUserDetail.userName,
        imageBase64List: imageBase64List
      }

      this.isLoading = true;
      this.faceIdService.updateFace({...dataRequest})
      .pipe(takeUntil(this.untilDestroyService), finalize(() => this.isLoading = false))
      .subscribe((res) => {
        this.onCancelRegisterFace.emit(true);
      })
    }
  }

  onClickCancelRegister(): void{
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.onCancelRegisterFace.emit(true);
  }

  public getStepFaceId(stepFaceId: number): void{
    this.stepFaceId = stepFaceId;
    if (stepFaceId === 2) {
      this.startAutoCapture();
    }
  }

  private startAutoCapture(): void {
    setTimeout(() => {
      this.autoCaptureWithCountdown();
    }, 500);
  }

  private autoCaptureWithCountdown(): void {
    if (this.currentStep >= 5 || this.isLoading) return;

    this.countdown = 3;
    this.showCountdown = true;

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.showCountdown = false;
        this.captureImage();
      }
    }, 1000);
  }

  public get triggerObservable() {
    return this.trigger.asObservable();
  }

  public captureImage(): void {
    this.trigger.next();
  }

  onRemoveImage(index: number): void{
    this.capturedImages.splice(index, 1);
    this.currentStep--;
  }

  public handleImage(webcamImage: WebcamImage): void {
    if (this.currentStep < 5) {
      const file: File|null = this.base64ToFile(webcamImage.imageAsBase64, 'face.jpg');

      let dataRequest: {file: File|null, anti_spoofing: boolean, threshold_spoofing: number, collection_name: string} = {
        file: file,
        anti_spoofing: true,
        threshold_spoofing: 0.5,
        collection_name: "D2S"
      }

      if(dataRequest?.file){
        this.isLoading = true;
        this.faceIdService.onCheckValidateRegisterImageFaceId(dataRequest)
        .pipe(takeUntil(this.untilDestroyService), finalize(() => {
          this.isLoading = false;
          if (this.currentStep < 5) {
            this.autoCaptureWithCountdown();
          }
        }))
        .subscribe((res: any) => {
          this.onCheckTypePictureResponse(res, webcamImage, file);
        });
      }
    }
  }

  private async convertFilesToBase64(files: File[]): Promise<string[]> {
    const promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const base64 = e.target.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    return Promise.all(promises);
  }

  private base64ToFile(base64: string, filename: string): File | null {
    try {
      if (!base64 || base64.trim() === '') {
        return null;
      }

      const arr = base64.split(',');
      let mime = 'image/jpeg';
      let bstr, n, u8arr;

      if (arr.length === 2) {
        mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        bstr = atob(arr[1]);
      } else {
        bstr = atob(base64);
      }

      n = bstr.length;
      u8arr = new Uint8Array(n);

      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }

      return new File([u8arr], filename, { type: mime });
    } catch (err) {
      return null;
    }
  }

  async checkCameraPermission(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        const result = await (navigator as any).permissions.query({ name: 'camera' });
        this.updatePermission(result.state);

        result.onchange = () => {
          this.updatePermission(result.state);
        };
      } catch (err) {
        this.cameraPermission = 'unsupported';
      }
    } else {
      this.cameraPermission = 'unsupported';
    }
  }

  async askForCameraPermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.updatePermission('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      this.updatePermission('denied');
      alert("Bạn đã từ chối quyền camera. Vui lòng cấp lại trong phần Cài đặt trình duyệt.");
    }
  }

  private updatePermission(state: string) {
    switch (state) {
      case 'granted':
        this.cameraPermission = 'granted';
        break;
      case 'denied':
        this.cameraPermission = 'denied';
        break;
      case 'prompt':
        this.cameraPermission = 'prompt';
        break;
      default:
        this.cameraPermission = 'unsupported';
    }
  }

  private onCheckTypePictureResponse(response: any, webcamData: WebcamImage, file: File|null): void{
    if(response?.data?.[0]?.side_profile == this.typePictureResponse[this.currentStep]){
      this.currentStep++;
      this.showErrMsg = ''
      this.capturedImages.push(webcamData.imageAsDataUrl);
      if(file){
        this.imageFileBase64ToRegister.push(file);
      }
    }else{
      this.showErrMsg = 'Ảnh không hợp lệ, vui lòng chụp lại'
    }
  }
}