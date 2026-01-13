import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NgModule } from '../../shared/ng-zorro.module';

@Component({
  selector: 'app-un-authen',
  imports: [NgModule, NzResultModule],
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
