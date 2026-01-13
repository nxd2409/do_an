import { Injectable } from '@angular/core';
import { CommonService } from './common/common.service';
import { AccountDto } from '../../../../Project.Admin/src/app/class/AD/account.class';
import { Observable } from 'rxjs';
interface ChangePasswordModel {
  userName: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
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

    detail(data: string) { return this.common.get(`Account/Detail/${data}`, {}, false) }

    changePassword(model: ChangePasswordModel): Observable<any> {
        return this.common.post(`Account/ChangePassword`, model, false);
    }
}
