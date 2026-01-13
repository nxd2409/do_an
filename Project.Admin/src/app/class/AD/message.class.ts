import { BaseFilter } from "../common/base-filter.class";

export class MessageDto extends BaseFilter {
    code: string = '';
    lang: string = '';
    message: string = '';
    type: string = '';
}