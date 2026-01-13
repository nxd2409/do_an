import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgModule } from '../../shared/ng-zorro.module';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-not-found',
  imports: [NgModule, NzResultModule],
  standalone: true,
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export class NotFound {
  constructor(private router: Router) { }

  backToHome(): void {
    this.router.navigate(['/']);
  }
}
