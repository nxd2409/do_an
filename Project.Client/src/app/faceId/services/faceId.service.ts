import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SettingRegisterFaceIdRequest } from '../models/requests/setting-register-face-id-request';
import { CommonService } from '../../services/common/common.service';
import { BYPASS_AUTH } from '../../services/config/auth.interceptor.config';

@Injectable({
  providedIn: 'root',
})
export class FaceIdService {
  private environment: string = 'https://llm.xbot.vn/face-v2';

  constructor(private http: HttpClient, private commonService: CommonService) {}

  onCheckValidateRegisterImageFaceId(
    dataRequest: SettingRegisterFaceIdRequest
  ): Observable<void> {

    const formData = new FormData();
    formData.append('anti_spoofing', dataRequest.anti_spoofing.toString());
    formData.append(
      'threshold_spoofing',
      dataRequest.threshold_spoofing.toString()
    );
    formData.append('collection_name', dataRequest.collection_name);
    if (dataRequest.file) {
      formData.append('file', dataRequest.file, dataRequest.file.name);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer test_face_id_token_123_xyz`,
    });

    const context = new HttpContext().set(BYPASS_AUTH, true);

    return this.http.post<void>(`${this.environment}/embed-face`, formData, {
      headers,
      context,
    });
  }

  // face id => dùng chung api với ADMIN . REsponse , params ko rõ
  updateFace(params: any): Observable<any> {
    return this.commonService.put('Account/updateFace', params);
  }
}
