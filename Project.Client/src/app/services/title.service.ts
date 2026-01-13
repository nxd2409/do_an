import { Injectable } from '@angular/core';
import { CommonService } from './common/common.service';
import { TitleDto } from '../shared/class/title.class';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  constructor(private common: CommonService) {}

  search(params: TitleDto) {
    return this.common.get('Title/Search', params, false);
  }

  getAll() {
    return this.common.get('Title/GetAll', {}, false);
  }

  getAllActive() {
    return this.common.get('Title/GetAllActive', {}, false);
  }

  insert(data: TitleDto) {
    return this.common.post('Title/Insert', data, false);
  }

  update(data: TitleDto) {
    return this.common.put('Title/Update', data, false);
  }

  detail(data: string) {
    return this.common.get(`Title/Detail/${data}`, {}, false);
  }

  delete(data: string) {
    return this.common.delete(`Title/Delete/${data}`, {}, false);
  }

  updateOrder(data: any) {
    return this.common.put(`Title/UpdateOrder`, data, false);
  }
}
