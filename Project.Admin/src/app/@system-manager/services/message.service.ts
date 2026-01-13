import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { MessageDto } from '../../class/AD/message.class';

@Injectable({
    providedIn: 'root',
})
export class MessageService {
    constructor(private common: CommonService) { }

    search(params: MessageDto) { return this.common.get('Message/Search', params, false) }

    getAll() { return this.common.get('Message/GetAll', {}, false) }

    getAllActive() { return this.common.get('Message/GetAllActive', {}, false) }

    insert(data: MessageDto) { return this.common.post('Message/Insert', data, false) }

    update(data: MessageDto) { return this.common.put('Message/Update', data, false) }

    detail(data: string) { return this.common.get(`Message/Detail/${data}`, {}, false) }
}
