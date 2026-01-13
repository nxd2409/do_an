import { BaseFilter } from "../common/base-filter.class";
import { AccountGroupDto } from "./account-group.class";

export class AccountDto extends BaseFilter {
    userName: string = '';
    fullName: string = '';
    phone: string = '';
    email: string = '';
    address: string = '';
    orgId: string = '';
    titleCode: string = '';
    accountGroups: AccountGroupDto[] = [];
    rights: string[] = [];
}