import { Component } from '@angular/core';
import { GlobalService } from '../../../services/common/global.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {
  constructor(private global: GlobalService) {
    this.global.setBreadcrumb([
      {
        name: 'Thông tin cá nhân',
        path: 'system-manager/profile',
      },
    ]);
  }
}
