import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonComponent } from "ng-zorro-antd/button";
import { NgZorroModule } from '../../../shared/ng-zorro.module';

@Component({
  selector: 'app-setting-introduction-register-face-id',
  imports: [
    CommonModule,
    NzIconModule,
    NgZorroModule
],
  templateUrl: './setting-introduction-register-face-id.component.html',
  styleUrl: './setting-introduction-register-face-id.component.scss',
})
export class SettingIntroductionRegisterFaceIdComponent {
  @Output() onClickNextStep = new EventEmitter<number>;
  @Output() onCancelRegisterFace = new EventEmitter<boolean>(false);
  
  onClickCancelRegister(): void{
    this.onCancelRegisterFace.emit(true);
  }

  onStartExecuteFaceId(): void{
    this.onClickNextStep.emit(2);
  }
}
