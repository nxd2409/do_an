import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from '@angular/common/http';
import { EnvironmentService } from '../../services/common/environment.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private common: CommonService, private http: HttpClient, private env: EnvironmentService) { }

    loginAccount(data: any) { return this.common.post('Auth/Login', data) }

    loginFace(faceId: any) { return this.http.post(`${this.env.getEnv('API_BASE_URL')}/Auth/LoginFace/${faceId}`, {}) }
}
