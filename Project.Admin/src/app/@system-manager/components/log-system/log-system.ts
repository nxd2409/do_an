import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { LogService } from '../../services/log.service';
import { NgModule } from '../../../shared/ng-zorro.module';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

export interface ParsedLog {
  timestamp: string;
  level: string;
  logger: string;
  machine: string;
  processId: string;
  threadId: string;
  message: string;
  properties?: string;
  rawLine: string;
}

@Component({
  selector: 'app-log-system',
  imports: [NgModule],
  templateUrl: './log-system.html',
  styleUrl: './log-system.scss'
})
export class LogSystem implements OnInit {

  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;

  isFullscreen: boolean = false;
  logs: ParsedLog[] = [];
  dateSelected: any;

  constructor(private service: LogService) { }

  ngOnInit(): void {
    this.getLogToday();
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });
  }

  getLogToday() {
    this.service.search().subscribe({
      next: (res: any) => {
        this.logs = res.map((line: string) => this.parseLog(line));
        console.log(this.logs)
      },
      error: (error) => {
        console.error('Error loading logs:', error);
      }
    });
  }

  scrollToTop() {
    if (this.viewport) {
      this.viewport.scrollToIndex(0);
    }
  }

  scrollToBottom() {
    if (this.viewport) {
      this.viewport.scrollToIndex(this.logs.length - 1);
    }
  }

  toggleFullscreen() {
    const elem = document.documentElement;

    if (!this.isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }

  onChangeDate(e: any) {
    // TODO: Implement date change logic
    console.log('Date changed:', e);
  }

  parseLog(line: string): ParsedLog {
    // Format: 2024-01-15 10:30:25.123 | [INFO] | Logger | Machine | PID:1234 | TID:5678 | Message | Properties
    const parts = line.split(' | ');

    if (parts.length >= 6) {
      const timestamp = parts[0]?.trim() || '';
      const level = parts[1]?.replace(/[\[\]]/g, '').trim() || 'UNKNOWN';
      const logger = parts[2]?.trim() || '';
      const machine = parts[3]?.trim() || '';
      const processId = parts[4]?.replace('PID:', '').trim() || '';
      const threadId = parts[5]?.replace('TID:', '').trim() || '';
      const message = parts[6]?.trim() || '';
      const properties = parts.length > 7 ? parts.slice(7).join(' | ').trim() : '';

      return {
        timestamp,
        level,
        logger,
        machine,
        processId,
        threadId,
        message,
        properties,
        rawLine: line
      };
    }

    // Fallback cho những dòng không match format
    return {
      timestamp: '',
      level: 'TXT',
      logger: '',
      machine: '',
      processId: '',
      threadId: '',
      message: line,
      properties: '',
      rawLine: line
    };
  }

  getLevelClass(level: string): string {
    switch (level.toUpperCase()) {
      case 'INFO':
      case 'INFORMATION':
        return 'INF';
      case 'ERROR':
        return 'ERR';
      case 'WARNING':
      case 'WARN':
        return 'WRN';
      case 'DEBUG':
        return 'DBG';
      case 'TRACE':
        return 'TRC';
      case 'FATAL':
        return 'FAT';
      default:
        return 'TXT';
    }
  }

  formatTimestamp(timestamp: string): string {
    return timestamp ? `[${timestamp}]` : '';
  }
}