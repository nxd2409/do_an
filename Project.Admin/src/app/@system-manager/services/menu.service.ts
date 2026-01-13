import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { MenuDto } from '../../class/AD/menu.class';

@Injectable({
    providedIn: 'root',
})
export class MenuService {
    constructor(private common: CommonService) { }

    search(params: MenuDto) { return this.common.get('Menu/Search', params, false) }

    getAll() { return this.common.get('Menu/GetAll', {}, false) }

    getAllActive() { return this.common.get('Menu/GetAllActive', {}, false) }

    insert(data: MenuDto) { return this.common.post('Menu/Insert', data, false) }

    update(data: MenuDto) { return this.common.put('Menu/Update', data, false) }

    detail(data: string) { return this.common.get(`Menu/Detail/${data}`, {}, false) }

    delete(data: string) { return this.common.delete(`Menu/Delete/${data}`, {}, false) }

    updateOrder(data: any) { return this.common.put(`Menu/UpdateOrder`, data, false) }
}
