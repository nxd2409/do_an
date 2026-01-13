import { Component } from '@angular/core';
import { GlobalService } from '../../services/common/global.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  constructor(private global: GlobalService) {}
}
