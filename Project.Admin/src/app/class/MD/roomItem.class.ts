import { BaseFilter } from "../common/base-filter.class";

export class RoomItemDto extends BaseFilter {
    id?: string;
    roomId?: string;        
    type: 'table' | 'chair' = 'table';
    style?: string = '';
    x: string = '';
    y: string = '';
    width: string = '';
    height: string = '';
    rotation?: string = '';
}
