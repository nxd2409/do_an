import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { RightDto } from '../../class/AD/right.class';

@Injectable({
    providedIn: 'root',
})
export class RightService {
    constructor(private common: CommonService) { }

    search(params: RightDto) { return this.common.get('Right/Search', params, false) }

    getAll() { return this.common.get('Right/GetAll', {}, false) }

    getAllActive() { return this.common.get('Right/GetAllActive', {}, false) }

    insert(data: RightDto) { return this.common.post('Right/Insert', data, false) }

    update(data: RightDto) { return this.common.put('Right/Update', data, false) }

    detail(data: string) { return this.common.get(`Right/Detail/${data}`, {}, false) }

    delete(data: string) { return this.common.delete(`Right/Delete/${data}`, {}, false) }

    updateOrder(data: any) { return this.common.put(`Right/UpdateOrder`, data, false) }
}
