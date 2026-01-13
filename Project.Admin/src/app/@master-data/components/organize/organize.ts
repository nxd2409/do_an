import { Component, OnInit, ViewChild } from '@angular/core';
import { NzTreeComponent } from 'ng-zorro-antd/tree';
import { Subject, takeUntil } from 'rxjs';
import { OrganizeDto } from '../../../class/MD/organize.class';
import { GlobalService } from '../../../services/common/global.service';
import { TreeUtils } from '../../../services/utilities/tree.ultis';
import { OrganizeService } from '../../services/organize.service';
import { NgModule } from '../../../shared/ng-zorro.module';

@Component({
  selector: 'app-organize',
  imports: [NgModule],
  standalone: true,
  templateUrl: './organize.html',
  styleUrl: './organize.scss'
})
export class Organize implements OnInit {

  @ViewChild('treeCom', { static: false }) treeCom!: NzTreeComponent
  private destroy$ = new Subject<void>();

  visible: boolean = false;
  isEdit: boolean = false;

  searchOrg: string = '';
  OrgTree: any[] = [];
  displayedOrgTree: any[] = [];

  dto: OrganizeDto = new OrganizeDto();

  constructor(
    private global: GlobalService,
    private service: OrganizeService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Cấu trúc tổ chức',
        path: 'system-manager/organize',
      },
    ]);
  }

  ngOnInit(): void {
    this.getOrgs();
  }

  getOrgs() {
    this.service.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.OrgTree = this.displayedOrgTree = TreeUtils.buildNzOrgTree(res);
      }
    });
  }

  nzEvent(event: any): void {

  }

  reset() {
    this.searchOrg = '';
    this.getOrgs();
  }

  detail(data: any) {
    this.isEdit = true;
    this.service.detail(data.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.dto = res;
        this.visible = true;
      }
    })
  }

  create(data: any) {
    this.isEdit = false;
    this.dto.pId = data;
    this.visible = true;
  }

  updateOrder() {
    const flatList = this.getCurrentTreeOrderFlat();
    this.service.updateOrder(flatList).subscribe({
      next: (res) => {
        this.globalOrderNumber = 1;
        this.getOrgs()
      },
      error: (response) => {
        console.log(response)
      },
    })
  }

  private getCurrentTreeOrderFlat(): any[] {
    const treeNodes = this.treeCom.getTreeNodes();
    const flatList: any[] = [];
    this.flattenNodeWithOrderAndPid(treeNodes, 'ORG', flatList);
    return flatList;
  }

  private globalOrderNumber = 1;

  private flattenNodeWithOrderAndPid(nodes: any[], parentId: string, result: any[]): void {
    nodes.forEach((node) => {
      result.push({
        id: node.origin.id,
        pId: parentId,
        name: node.origin.name,
        orderNumber: this.globalOrderNumber++,
        expanded: node.origin.expanded,
      });

      if (node.children && node.children.length > 0) {
        this.flattenNodeWithOrderAndPid(node.children, node.origin.id, result);
      }
    });
  }

  onSearchChangeOrg() {
    if (!this.searchOrg?.trim()) {
      this.displayedOrgTree = this.OrgTree;
    } else {
      this.displayedOrgTree = this.filterOrgTree(this.OrgTree, this.searchOrg.toLowerCase());
    }
  }

  filterOrgTree(OrgTree: any[], keyword: string): any[] {
    const result: any[] = [];

    for (const node of OrgTree) {
      const childrenMatched = node.children ? this.filterOrgTree(node.children, keyword) : [];

      const nameMatched = node.name.toLowerCase().includes(keyword);

      if (nameMatched || childrenMatched.length > 0) {
        result.push({
          ...node,
          children: childrenMatched.length > 0 ? childrenMatched : node.children ? [] : null,
          open: childrenMatched.length > 0 || node.open
        });
      }
    }

    return result;
  }

  deleteOrg(id: any) {
    this.service.delete(id).subscribe({
      next: (res) => {
        this.getOrgs();
      }
    })
  }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          var pId = this.dto.pId;
          this.getOrgs();
          if (!this.isEdit) {
            this.dto = new OrganizeDto();
            this.dto.pId = pId;
          } else {
            this.visible = false;
          }
        }
      })
  }

  close() {
    this.visible = false;
    this.dto = new OrganizeDto();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
    this.OrgTree = [];
    this.displayedOrgTree = [];
    this.dto = new OrganizeDto();
    this.visible = false;
    this.isEdit = false;
    this.searchOrg = '';
    this.treeCom = null as any;
  }
}

