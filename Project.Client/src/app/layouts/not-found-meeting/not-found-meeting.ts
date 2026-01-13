import { Component } from '@angular/core';
import { NgZorroModule } from '../../shared/ng-zorro.module';
import { NzResultModule } from 'ng-zorro-antd/result';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found-meeting',
  imports: [NgZorroModule, NzResultModule],
  templateUrl: './not-found-meeting.html',
  styleUrl: './not-found-meeting.scss'
})
export class NotFoundMeeting {
constructor(private router: Router) { }

  backToHome(): void {
    this.router.navigate(['/']);
  }
}
