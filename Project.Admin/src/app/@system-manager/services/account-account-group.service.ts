import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { AccountAccountGroupDto } from '../../class/AD/account-account-group.class';

@Injectable({
    providedIn: 'root',
})
export class AccountAccountGroupService {
    constructor(private common: CommonService) { }
    insert(data: AccountAccountGroupDto) { return this.common.post('AccountAccountGroup/Insert', data, false) }

    delete(data: AccountAccountGroupDto) { return this.common.post('AccountAccountGroup/Delete', data, false) }
}
