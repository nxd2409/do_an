import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NgZorroModule } from '../../shared/ng-zorro.module';

@Component({
  selector: 'app-maintain-server',
  imports: [NgZorroModule, NzResultModule],
  standalone: true,
  templateUrl: './maintain-server.html',
  styleUrl: './maintain-server.scss'
})
export class MaintainServer {
  constructor(private router: Router) { }

  backToHome(): void {
    this.router.navigate(['/']);
  }
}
