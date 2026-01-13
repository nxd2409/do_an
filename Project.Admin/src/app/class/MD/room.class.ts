import { BaseFilter } from "../common/base-filter.class";
import { RoomItemDto } from "./roomItem.class";

export class RoomDto extends BaseFilter {
    code?: string;
    name: string = '';
    address: string = '';    
    width: string = '';
    height: string = '';
    tableType: string = '';
    chairCount: number = 0;
    wsStreamUrl : string = '';
    items: RoomItemDto[] = [];
}