import { BaseFilter } from "../common/base-filter.class";
import { MenuRightDto } from "./menu-right.class";

export class MenuDto extends BaseFilter {
    id: string = '';
    name: string = '';
    pId: string = '';
    orderNumber: number = 0;
    url: string = '';
    icon: string = '';
    expanded: boolean = true;
    menuRights: MenuRightDto[] = []
}