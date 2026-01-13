import { Component } from '@angular/core';
import { NgModule } from '../../../shared/ng-zorro.module';
import { Subject, takeUntil } from 'rxjs';
import { AccountDto } from '../../../class/AD/account.class';
import { PaginationResult } from '../../../class/common/pagination-result.class';
import { OrganizeService } from '../../../@master-data/services/organize.service';
import { GlobalService } from '../../../services/common/global.service';
import { RightService } from '../../services/right.service';
import { AccountService } from '../../services/account.service';
import { TreeUtils } from '../../../services/utilities/tree.ultis';
import { AccountGroupService } from '../../services/account-group.service';
import { RightDto } from '../../../class/AD/right.class';
import { AccountGroupDto } from '../../../class/AD/account-group.class';
import { AccountAccountGroupDto } from '../../../class/AD/account-account-group.class';
import { AccountAccountGroupService } from '../../services/account-account-group.service';
import { AccountRightDto } from '../../../class/AD/account-right.class';
import { TitleService } from '../../../@master-data/services/title.service';

@Component({
  selector: 'app-account',
  imports: [NgModule],
  templateUrl: './account.html',
  styleUrl: './account.scss'
})
export class Account {
  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;

  data: PaginationResult = new PaginationResult();
  dto: AccountDto = new AccountDto();
  filter: AccountDto = new AccountDto();

  dataAccountGroup: PaginationResult = new PaginationResult();
  dtoAccountGroup: AccountGroupDto = new AccountGroupDto();
  filterAccountGroup: AccountGroupDto = new AccountGroupDto();

  searchOrg: string = '';
  OrgTree: any[] = [];
  displayedOrgTree: any[] = [];

  searchRight = '';
  accountRights: any[] = [];
  displayedRightTree: any[] = [];

  lstTitle: any[] = [];

  constructor(private global: GlobalService,
    private service: AccountService,
    private accountGroup: AccountGroupService,
    private accountAccountGroup: AccountAccountGroupService,
    private org: OrganizeService,
    private right: RightService,
    private _title: TitleService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Tài khoản',
        path: 'system-manager/account',
      },
    ]);
  }

  ngOnInit(): void {
    this.getOrgs();
    this.getTitle();
  }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.data = res
        }
      })
  }

  getTitle() {
    this._title.getAll().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.lstTitle = res
        }
      })
  }

  searchAccountGroup() {
    this.accountGroup.search(this.filterAccountGroup).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.dataAccountGroup = res
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
    this.filterAccountGroup.orgId = e.keys.length > 0 ? e.keys[0] : '';
    if (this.filter.orgId && this.filterAccountGroup.orgId) {
      this.search();
      this.searchAccountGroup();
    } else {
      this.data = new PaginationResult();
      this.dataAccountGroup = new PaginationResult();
    }
  }

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.userName).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.dto = res
            this.loadRights(true);
            this.visible = true;
          }
        })
    }
    else {
      this.loadRights();
      this.visible = true;
      this.dto = new AccountDto();
      this.dto.orgId = this.filter.orgId;
    }
  }

  close() {
    this.visible = false;
    this.dto = new AccountDto();
  }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res.status) return;
          this.search();
          this.dto = new AccountDto();
          this.dto.orgId = this.filter.orgId;
          this.visible = false;
        }
      })
  }

  reset() {
    this.filter = new AccountDto();
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

  private loadRights(withCheck = false) {
    this.right.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.accountRights = TreeUtils.buildNzRightTree(res);
        if (withCheck) this.setCheckedRights(this.accountRights, this.dto.rights ?? []);
        this.displayedRightTree = [...this.accountRights];
      });
  }

  private setCheckedRights(nodes: any[], rights: string[]) {
    const rightIds = new Set(rights);
    nodes.forEach(node => {
      node.checked = rightIds.has(node.id);
      node.children?.length && this.setCheckedRights(node.children, rights);
    });
  }

  checkAccountGroup(id: any) {
    var find = this.dto.accountGroups.find(x => x.id == id)
    return find ? true : false
  }

  onChangeAccountGroup(e: any, id: any) {
    var payload = new AccountAccountGroupDto();
    payload.userName = this.dto.userName
    payload.groupId = id;

    var action = e ? this.accountAccountGroup.insert(payload) : this.accountAccountGroup.delete(payload)
    action.subscribe({
      next: (res) => {
        this.open(this.dto, true);
      }
    })
  }

  onChangeRight(e: any) {
    var payload = new AccountRightDto();
    payload.userName = this.dto.userName;
    payload.rightId = e.node.key;
    payload.isAdded = e.node.isChecked;
    payload.isRemoved = !e.node.isChecked;

    this.service.updateAccountRight(payload).subscribe({
      next: (res) => {

      }
    })
  }

}
