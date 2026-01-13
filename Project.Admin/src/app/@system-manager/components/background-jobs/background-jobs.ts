import { Component } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { EnvironmentService } from '../../../services/common/environment.service';

@Component({
  selector: 'app-background-jobs',
  imports: [],
  templateUrl: './background-jobs.html',
  styleUrl: './background-jobs.scss'
})
export class BackgroundJobs {
  hangfireUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer,
    private env: EnvironmentService
  ) { }

  ngOnInit(): void {
    this.hangfireUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.env.getEnv('hangfireUrl'));
  }
}
