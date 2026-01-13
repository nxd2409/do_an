import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './services/common/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit, OnInit {

  constructor(private _loading: LoadingService) { }

  ngOnInit(): void {
    console.warn = () => { };

    const originalConsoleError = console.error;
    console.error = (err?: any, ...optionalParams: any[]) => {
      this._loading.reset();
      originalConsoleError.call(console, err, ...optionalParams);
    };
  }

  ngAfterViewInit(): void {
    const loader = document.getElementById('loading');
    if (loader) {
      loader.style.display = 'none';
    }
  }
}
