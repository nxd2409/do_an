import { Component} from '@angular/core';
import { NgZorroModule } from '../../shared/ng-zorro.module';

@Component({
  selector: 'app-main-layout',
  imports: [NgZorroModule],
  standalone: true,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout  {
  
}