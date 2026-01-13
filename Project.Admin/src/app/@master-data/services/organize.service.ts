import { Injectable } from '@angular/core';
import { OrganizeDto } from '../../class/MD/organize.class';
import { CommonService } from '../../services/common/common.service';

@Injectable({
    providedIn: 'root',
})
export class OrganizeService {
    constructor(private common: CommonService) { }

    search(params: OrganizeDto) { return this.common.get('Organize/Search', params, false) }

    getAll() { return this.common.get('Organize/GetAll', {}, false) }

    getAllActive() { return this.common.get('Organize/GetAllActive', {}, false) }

    insert(data: OrganizeDto) { return this.common.post('Organize/Insert', data, false) }

    update(data: OrganizeDto) { return this.common.put('Organize/Update', data, false) }

    detail(data: string) { return this.common.get(`Organize/Detail/${data}`, {}, false) }

    delete(data: string) { return this.common.delete(`Organize/Delete/${data}`, {}, false) }

    updateOrder(data: any) { return this.common.put(`Organize/UpdateOrder`, data, false) }
}
