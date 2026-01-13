import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from '../../services/common/common.service';
import { RoomDto } from '../../class/MD/room.class';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private readonly baseUrl = 'Room';

  constructor(private common: CommonService) {}

  search(params: RoomDto): Observable<any> {
    return this.common.get(`${this.baseUrl}/Search`, params, false);
  }

  getAll(): Observable<any> {
    return this.common.get(`${this.baseUrl}/GetAll`, {}, false);
  }

  getAllActive(): Observable<any> {
    // Chỉ dùng nếu backend có endpoint tương ứng
    return this.common.get(`${this.baseUrl}/GetAllActive`, {}, false);
  }

  insert(data: RoomDto): Observable<any> {
    return this.common.post(`${this.baseUrl}/Insert`, data, false);
  }

  update(data: RoomDto): Observable<any> {
    return this.common.put(`${this.baseUrl}/Update`, data, false);
  }

  getDetail(code: string): Observable<any> {
    return this.common.get(`${this.baseUrl}/Detail/${code}`, {}, false);
  }

  delete(code: string): Observable<any> {
    return this.common.delete(`${this.baseUrl}/Delete/${code}`, {}, false);
  }

  updateOrder(data: any): Observable<any> {
    return this.common.put(`${this.baseUrl}/UpdateOrder`, data, false);
  }
}
