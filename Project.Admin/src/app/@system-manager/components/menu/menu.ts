import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { GlobalService } from '../../../services/common/global.service';
import { MenuService } from '../../services/menu.service';
import { NgModule } from '../../../shared/ng-zorro.module';
import { Subject, takeUntil } from 'rxjs';
import { NzTreeComponent } from 'ng-zorro-antd/tree';
import { MenuDto } from '../../../class/AD/menu.class';
import { RightService } from '../../services/right.service';
import { MenuRightDto } from '../../../class/AD/menu-right.class';
import { TreeUtils } from '../../../services/utilities/tree.ultis';

@Component({
  selector: 'app-menu',
  imports: [NgModule],
  standalone: true,
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class Menu implements OnInit, OnDestroy {
  @ViewChild('treeComMenu') treeComMenu!: NzTreeComponent;
  @ViewChild('treeComRight') treeComRight!: NzTreeComponent;

  private destroy$ = new Subject<void>();

  visible = false;
  isEdit = false;

  searchMenu = '';
  menuTree: any[] = [];
  displayedMenuTree: any[] = [];

  searchRight = '';
  menuRight: any[] = [];
  displayedRightTree: any[] = [];

  dto = new MenuDto();

  constructor(
    private global: GlobalService,
    private service: MenuService,
    private right: RightService
  ) {
    this.global.setBreadcrumb([{ name: 'Cấu hình menu', path: 'system-manager/menu' }]);
  }

  ngOnInit() {
    this.loadMenus();
  }

  private loadMenus() {
    this.service.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => this.displayedMenuTree = this.menuTree = TreeUtils.buildNzMenuTree(res));
  }

  private loadRights(withCheck = false) {
    this.right.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.menuRight = TreeUtils.buildNzRightTree(res);
        if (withCheck) this.setCheckedRights(this.menuRight, this.dto.menuRights ?? []);
        this.displayedRightTree = [...this.menuRight];
      });
  }

  reset() {
    this.searchMenu = '';
    this.loadMenus();
  }

  detail(menu: any) {
    this.isEdit = true;
    this.service.detail(menu.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: any) => {
        this.dto = res;
        this.loadRights(true);
        this.visible = true;
      });
  }

  create(pId: string) {
    this.dto = new MenuDto();
    this.dto.pId = pId;
    this.isEdit = false;
    this.loadRights();
    this.visible = true;
  }

  private setCheckedRights(nodes: any[], rights: MenuRightDto[]) {
    const rightIds = new Set(rights.map(r => r.rightId));
    nodes.forEach(node => {
      node.checked = rightIds.has(node.id);
      node.children?.length && this.setCheckedRights(node.children, rights);
    });
  }

  updateOrder() {
    const flatList: any[] = [];
    let counter = 1;
    const flatten = (nodes: any[], parentId: string) =>
      nodes.forEach((n) => {
        flatList.push({
          id: n.origin.id,
          pId: parentId,
          name: n.origin.name,
          url: n.origin.url ?? '',
          icon: n.origin.icon ?? '',
          orderNumber: counter++,
          expanded: n.origin.expanded
        });
        n.children?.length && flatten(n.children, n.origin.id);
      });

    flatten(this.treeComMenu.getTreeNodes(), 'MNU');
    this.service.updateOrder(flatList).subscribe(() => this.loadMenus());
  }


  onSearchChangeMenu() {
    const keyword = this.searchMenu.trim().toLowerCase();
    const filterTree = (nodes: any[]): any[] =>
      nodes
        .map(n => {
          const children = filterTree(n.children ?? []);
          return n.name.toLowerCase().includes(keyword) || children.length
            ? { ...n, children, open: !!children.length || n.open }
            : null;
        })
        .filter(Boolean) as any[];
    this.displayedMenuTree = keyword ? filterTree(this.menuTree) : this.menuTree;
  }

  deleteMenu(id: string) {
    this.service.delete(id).subscribe(() => this.loadMenus());
  }

  private getCheckedRights(): MenuRightDto[] {
    if (!this.treeComRight) return [];
    const checked: any[] = [];
    const collect = (node: any) => {
      if (node.isChecked) checked.push(node.origin);
      node.children?.forEach(collect);
    };
    this.treeComRight.getTreeNodes().forEach(collect);
    return checked.map(o => ({ id: '', menuId: this.dto.id, rightId: o.id }));
  }

  save() {
    this.dto.menuRights = this.getCheckedRights();
    const action$ = this.isEdit ? this.service.update(this.dto) : this.service.insert(this.dto);
    action$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const pId = this.dto.pId;
      this.loadMenus();
      if (!this.isEdit) this.dto = { ...new MenuDto(), pId }
      else this.visible = false;
    });
  }

  close() {
    this.visible = false;
    this.dto = new MenuDto();
    this.searchRight = '';
    this.menuRight = [];
    this.displayedRightTree = [];
  }

  ngOnDestroy() {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
