import { BaseFilter } from "../common/base-filter.class";
import { AccountGroupRightDto } from "./account-group-right.class";

export class AccountGroupDto extends BaseFilter {
    id: string = '';
    orgId: string = '';
    name: string = '';
    notes: string = '';
    accountGroupRights : AccountGroupRightDto[] = []
}