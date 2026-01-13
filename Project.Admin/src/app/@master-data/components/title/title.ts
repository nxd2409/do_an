import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PaginationResult } from '../../../class/common/pagination-result.class';
import { TitleDto } from '../../../class/MD/title.class';
import { GlobalService } from '../../../services/common/global.service';
import { TitleService } from '../../services/title.service';
import { NgModule } from '../../../shared/ng-zorro.module';

@Component({
  selector: 'app-title',
  imports: [NgModule],
  templateUrl: './title.html'
})
export class Title implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;
  data: PaginationResult = new PaginationResult();
  dto: TitleDto = new TitleDto();
  filter: TitleDto = new TitleDto();

  constructor(private global: GlobalService, private service: TitleService) {
    this.global.setBreadcrumb([
      {
        name: 'Chức danh',
        path: 'master-data/title',
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

  trackById(index: number, item: any): any {
    return item.id || item.code;
  }

  open(data: any, isEdit: boolean) {
    debugger
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.code)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.dto = res
            this.visible = true;
          }
        })
    }
    else {
      this.visible = true;
      this.dto = new TitleDto();
    }
  }

  close() {
    this.visible = false;
    this.dto = new TitleDto();
  }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.search();
          if (!this.isEdit) this.dto = new TitleDto();
        }
      })
  }

  reset() {
    this.filter = new TitleDto();
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
}

