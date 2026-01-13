import { Injectable } from '@angular/core';
import { CommonService } from '../common/common.service';

@Injectable({
    providedIn: 'root',
})
export class MainLayoutService {
    constructor(private common: CommonService) { }

    getAllMenu() { return this.common.get('Menu/GetAll') }

}
