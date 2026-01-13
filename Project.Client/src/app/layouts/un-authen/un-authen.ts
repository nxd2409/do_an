import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NgZorroModule } from '../../shared/ng-zorro.module';

@Component({
  selector: 'app-un-authen',
  imports: [NgZorroModule, NzResultModule],
  standalone: true,
  templateUrl: './un-authen.html',
  styleUrl: './un-authen.scss'
})
export class UnAuthen {
constructor(private router: Router) { }

  backToLogin(): void {
    this.router.navigate(['login']);
  }
}
