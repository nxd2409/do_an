import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { AccountDto } from '../../class/AD/account.class';
import { AccountRightDto } from '../../class/AD/account-right.class';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    constructor(private common: CommonService) { }

    search(params: AccountDto) { return this.common.get('Account/Search', params, true) }

    getAll() { return this.common.get('Account/GetAll', {}, false) }

    getAllActive() { return this.common.get('Account/GetAllActive', {}, false) }

    insert(data: AccountDto) { return this.common.post('Account/Insert', data, false) }

    update(data: AccountDto) { return this.common.put('Account/Update', data, false) }
    
    updateAccountRight(data: AccountRightDto) { return this.common.put('Account/UpdateAccountRight', data, false) }

    detail(data: string) { return this.common.get(`Account/Detail/${data}`, {}, false) }
}
