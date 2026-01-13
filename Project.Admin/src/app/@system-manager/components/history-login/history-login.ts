import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { HistoryLoginDto } from '../../../class/AD/history-login.class';
import { PaginationResult } from '../../../class/common/pagination-result.class';
import { GlobalService } from '../../../services/common/global.service';
import { HistoryLoginService } from '../../services/history-login.service';
import { NgModule } from '../../../shared/ng-zorro.module';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-history-login',
  imports: [NgModule],
  standalone: true,
  templateUrl: './history-login.html',
})
export class HistoryLogin implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  checked: boolean = false;
  indeterminate: boolean = false;
  setOfCheckedId = new Set<any>();

  data: PaginationResult = new PaginationResult();
  dto: HistoryLoginDto = new HistoryLoginDto();
  filter: HistoryLoginDto = new HistoryLoginDto();

  constructor(
    private global: GlobalService,
    private service: HistoryLoginService,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Lịch sử đăng nhập',
        path: 'system-manager/history-login',
      },
    ]);
  }

  ngOnInit(): void {
    this.search();
  }

  search() {
    this.service.search(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.data = res
        }
      })
  }

  refreshCheckedStatus(): void {
    this.checked = this.data.data.every((i: any) => this.setOfCheckedId.has(i.id));
    this.indeterminate = this.data.data.some((i: any) => this.setOfCheckedId.has(i.id)) && !this.checked;
  }

  updateCheckedSet(id: any, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onItemChecked(id: any, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }


  onAllChecked(checked: boolean): void {
    this.data.data
      .forEach((i: any) => this.updateCheckedSet(i.id, checked));
    this.refreshCheckedStatus();
  }

  trackById(index: number, item: any): any {
    return item.id || item.code;
  }

  reset() {
    this.filter = new HistoryLoginDto();
    this.search();
  }

  pageIndexChange(e: any) {
    this.filter.currentPage = e;
    this.search();
  }

  pageSizeChange(e: any) {
    this.filter.pageSize = e;
    this.search();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }

  delHistory() {
    var lstCheckedIds = [...this.setOfCheckedId]
    if (lstCheckedIds.length == 0) {
      this.message.error('Vui lòng chọn ít nhất 1 bản ghi!');
      return;
    }
    this.service.delete(lstCheckedIds).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.indeterminate = false;
        this.checked = false;
        this.search();
      }
    })
  }
}

