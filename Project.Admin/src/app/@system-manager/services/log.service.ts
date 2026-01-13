import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';

@Injectable({
    providedIn: 'root',
})
export class LogService {
    constructor(private common: CommonService) { }

    search() { return this.common.get('Log/Search', {}, false) }

    date() { return this.common.get('Menu/GetAll', {}, false) }
}
