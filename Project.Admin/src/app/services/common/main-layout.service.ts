import { Injectable } from '@angular/core';
import { CommonService } from '../common/common.service';
import { MessageDto } from '../../class/AD/message.class';

@Injectable({
    providedIn: 'root',
})
export class MainLayoutService {
    constructor(private common: CommonService) { }

    getAllMenu() { return this.common.get('Menu/GetAll') }
    
    getMenuByUser(param: string) { return this.common.get(`Menu/GetMenuByUser/${param}`) }

}
