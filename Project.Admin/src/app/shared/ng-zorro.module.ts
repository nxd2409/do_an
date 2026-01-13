import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { NzBadgeModule } from "ng-zorro-antd/badge";
import { NzBreadCrumbModule } from "ng-zorro-antd/breadcrumb";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzCheckboxModule } from "ng-zorro-antd/checkbox";
import { NzDatePickerModule } from "ng-zorro-antd/date-picker";
import { NzDividerModule } from "ng-zorro-antd/divider";
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { NzFormModule } from "ng-zorro-antd/form";
import { NzGridModule } from "ng-zorro-antd/grid";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzLayoutModule } from "ng-zorro-antd/layout";
import { NzMenuModule } from "ng-zorro-antd/menu";
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzPageHeaderModule } from "ng-zorro-antd/page-header";
import { NzPaginationModule } from "ng-zorro-antd/pagination";
import { NzPopconfirmModule } from "ng-zorro-antd/popconfirm";
import { NzPopoverModule } from "ng-zorro-antd/popover";
import { NzRadioModule } from "ng-zorro-antd/radio";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzSpaceModule } from "ng-zorro-antd/space";
import { NzSplitterModule } from "ng-zorro-antd/splitter";
import { NzSwitchModule } from "ng-zorro-antd/switch";
import { NzTableModule } from "ng-zorro-antd/table";
import { NzTabsModule } from "ng-zorro-antd/tabs";
import { NzTagModule } from "ng-zorro-antd/tag";
import { NzTooltipModule } from "ng-zorro-antd/tooltip";
import { NzTreeModule } from "ng-zorro-antd/tree";
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { PermissionDirective } from "./permission.directive";

export const NgModule = [
    NzEmptyModule,
    NzProgressModule,
    NzDropDownModule,
    ScrollingModule,
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzPageHeaderModule,
    NzSpaceModule,
    NzInputModule,
    NzIconModule,
    NzTableModule,
    NzPaginationModule,
    NzDrawerModule,
    NzRadioModule,
    NzBreadCrumbModule,
    NzMenuModule,
    NzLayoutModule,
    NzGridModule,
    NzPopconfirmModule,
    NzTooltipModule,
    RouterModule,
    NzModalModule,
    NzBadgeModule,
    NzPopoverModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTagModule,
    ReactiveFormsModule,
    NzCheckboxModule,
    NzFormModule,
    NzTabsModule,
    NzTreeModule,
    NzDividerModule,
    NzSplitterModule,
    NzSwitchModule,
    NzStepsModule,
    NzTimelineModule,
    PermissionDirective,
];