import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { AccountGroupDto } from '../../class/AD/account-group.class';

@Injectable({
    providedIn: 'root',
})
export class AccountGroupService {
    constructor(private common: CommonService) { }

    search(params: AccountGroupDto) { return this.common.get('AccountGroup/Search', params, false) }

    getAll() { return this.common.get('AccountGroup/GetAll', {}, false) }

    getAllActive() { return this.common.get('AccountGroup/GetAllActive', {}, false) }

    insert(data: AccountGroupDto) { return this.common.post('AccountGroup/Insert', data, false) }

    update(data: AccountGroupDto) { return this.common.put('AccountGroup/Update', data, false) }

    detail(data: string) { return this.common.get(`AccountGroup/Detail/${data}`, {}, false) }
}
