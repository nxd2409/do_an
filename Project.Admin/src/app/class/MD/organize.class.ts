import { BaseFilter } from "../common/base-filter.class";

export class OrganizeDto extends BaseFilter {
    id: string = '';
    name: string = '';
    pId: string = '';
    orderNumber: number = 0;
    expanded : boolean = true;
}