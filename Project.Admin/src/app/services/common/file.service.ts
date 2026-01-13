import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';

@Injectable({
    providedIn: 'root',
})
export class FileService {
    constructor(private common: CommonService) { }

    upload(data: any) { return this.common.post(`File/Upload`, data, true) }
}
