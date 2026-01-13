import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { HistoryLoginDto } from '../../class/AD/history-login.class';

@Injectable({
    providedIn: 'root',
})
export class HistoryLoginService {
    constructor(private common: CommonService) { }

    search(params: HistoryLoginDto) { return this.common.get('HistoryLogin/Search', params, false) }

    getAll() { return this.common.get('HistoryLogin/GetAll', {}, false) }

    getAllActive() { return this.common.get('HistoryLogin/GetAllActive', {}, false) }

    insert(data: HistoryLoginDto) { return this.common.post('HistoryLogin/Insert', data, false) }

    update(data: HistoryLoginDto) { return this.common.put('HistoryLogin/Update', data, false) }

    detail(data: string) { return this.common.get(`HistoryLogin/Detail/${data}`, {}, false) }

    delete(data: any) { return this.common.post('HistoryLogin/Delete', data, false) }

}
