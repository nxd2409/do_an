import { Component } from '@angular/core';
import { GlobalService } from '../../../services/common/global.service';

@Component({
  selector: 'app-document-system',
  templateUrl: './document-system.html',
  styleUrl: './document-system.scss'
})
export class DocumentSystem {
  constructor(private global: GlobalService) {
    this.global.setBreadcrumb([
      {
        name: 'Tài liệu hỗ trợ vận hành hệ thống',
        path: 'system-manager/document-system',
      },
    ]);
  }
}
