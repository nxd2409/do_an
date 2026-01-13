import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgModule } from '../../../shared/ng-zorro.module';
import { AccountGroupDto } from '../../../class/AD/account-group.class';
import { Subject, takeUntil } from 'rxjs';
import { PaginationResult } from '../../../class/common/pagination-result.class';
import { GlobalService } from '../../../services/common/global.service';
import { AccountGroupService } from '../../services/account-group.service';
import { OrganizeService } from '../../../@master-data/services/organize.service';
import { TreeUtils } from '../../../services/utilities/tree.ultis';
import { RightService } from '../../services/right.service';
import { AccountGroupRightDto } from '../../../class/AD/account-group-right.class';
import { NzTreeComponent } from 'ng-zorro-antd/tree';

@Component({
  selector: 'app-account-group',
  imports: [NgModule],
  standalone: true,
  templateUrl: './account-group.html',
  styleUrl: './account-group.scss'
})
export class AccountGroup implements OnInit, OnDestroy {
  @ViewChild('treeComRight') treeComRight!: NzTreeComponent;
  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;
  data: PaginationResult = new PaginationResult();
  dto: AccountGroupDto = new AccountGroupDto();
  filter: AccountGroupDto = new AccountGroupDto();

  searchOrg: string = '';
  OrgTree: any[] = [];
  displayedOrgTree: any[] = [];

  searchRight = '';
  accountGroupRights: any[] = [];
  displayedRightTree: any[] = [];

  constructor(private global: GlobalService,
    private service: AccountGroupService,
    private org: OrganizeService,
    private right: RightService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Nhóm tài khoản',
        path: 'system-manager/account-group',
      },
    ]);
  }

  ngOnInit(): void {
    this.getOrgs();
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

  getOrgs() {
    this.org.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.OrgTree = this.displayedOrgTree = TreeUtils.buildNzOrgTree(res);
      }
    });
  }

  trackById(index: number, item: any): any {
    return item.id || item.code;
  }

  onNodeClick(e: any) {
    this.visible = false;
    this.filter.orgId = e.keys.length > 0 ? e.keys[0] : '';
    if (this.filter.orgId) {
      this.search();
    } else {
      this.data = new PaginationResult();
    }
  }

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.id).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.dto = res
            this.loadRights(true);
            this.visible = true;
          }
        })
    }
    else {
      this.visible = true;
      this.dto = new AccountGroupDto();
      this.dto.orgId = this.filter.orgId;
      this.loadRights();
    }
  }

  close() {
    this.visible = false;
    this.dto = new AccountGroupDto();
  }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.dto.accountGroupRights = this.getCheckedRights();
    this.service[action](this.dto).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res.status) return;
          this.search();
          this.dto = new AccountGroupDto();
          this.dto.orgId = this.filter.orgId;
          this.visible = false;
        }
      })
  }

  reset() {
    this.filter = new AccountGroupDto();
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

  private getCheckedRights(): any[] {
    if (!this.treeComRight) return [];
    const checked: any[] = [];
    const collect = (node: any) => {
      if (node.isChecked) checked.push(node.origin);
      node.children?.forEach(collect);
    };
    this.treeComRight.getTreeNodes().forEach(collect);
    return checked.map(o => ({ id: '', groupId: this.dto.id, rightId: o.id }));
  }

  private loadRights(withCheck = false) {
    this.right.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.accountGroupRights = TreeUtils.buildNzRightTree(res);
        if (withCheck) this.setCheckedRights(this.accountGroupRights, this.dto.accountGroupRights ?? []);
        this.displayedRightTree = [...this.accountGroupRights];
      });
  }

  private setCheckedRights(nodes: any[], rights: AccountGroupRightDto[]) {
    const rightIds = new Set(rights.map(r => r.rightId));
    nodes.forEach(node => {
      node.checked = rightIds.has(node.id);
      node.children?.length && this.setCheckedRights(node.children, rights);
    });
  }
}
