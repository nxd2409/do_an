import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class WebSpeechService {
  private recognition: any;
  public transcription$ = new Subject<string>();
  public finalResult$ = new Subject<string>();
  public isRecognizing = false;
  private isSupported = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'vi-VN';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
    };

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          this.finalResult$.next(transcript);
        } else {
          this.transcription$.next(transcript);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      
    };

    this.recognition.onend = () => {
      if (this.isRecognizing) {
        try {
          this.recognition.start();
        } catch (error) {
          console.error('Error restarting recognition:', error);
        }
      }
    };

    this.isSupported = true;
  }

  async initialize(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Trình duyệt không hỗ trợ Speech Recognition. Vui lòng sử dụng Chrome hoặc Edge.');
    }
  }

  async startRecognition(): Promise<void> {
    if (!this.isSupported || !this.recognition) {
      throw new Error('Speech Recognition không khả dụng');
    }

    if (this.isRecognizing) {
      return;
    }

    try {
      this.recognition.start();
      this.isRecognizing = true;
    } catch (error) {
      throw error;
    }
  }

  async stopRecognition(): Promise<void> {
    if (!this.isRecognizing || !this.recognition) {
      return;
    }

    try {
      this.isRecognizing = false;
      this.recognition.stop();
    } catch (error) {
    }
  }

  destroy(): void {
    this.stopRecognition();
  }

  isAvailable(): boolean {
    return this.isSupported;
  }
}