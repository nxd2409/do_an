import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EnvironmentService } from '../../services/common/environment.service';

interface FaceSearchResponse {
    data: Array<{
        user_id: string;
        [key: string]: any;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class FaceRecognitionService {
    private readonly API_URL = 'https://llm.xbot.vn/face/search-face';
    private readonly TOKEN = 'cba287859e90fd581d177d499250f6aaf0524b739377a396cfd2684303fff302';

    constructor(
        private http: HttpClient,
        private env: EnvironmentService
    ) { }

    searchFace(imageBlob: Blob): Observable<string | null> {
        const formData = new FormData();
        formData.append('file', imageBlob, 'face.jpg');
        formData.append('anti_spoofing', 'true');
        formData.append('threshold_spoofing', '0.7');
        formData.append('min_score', '0.5');

        const headers = new HttpHeaders({
            'X-Bypass-Auth': 'true',
            'Authorization': `Bearer ${this.TOKEN}`
        });

        return this.http.post<FaceSearchResponse>(this.env.getEnv("aiFaceSearchUrl"), formData, { headers }).pipe(
            map(response => {
                if (!response.data || response.data.length === 0) {
                    return null;
                }
                return response.data[0].user_id || '';
            }),
            catchError(error => {
                const errorMessage = error.status
                    ? `Lỗi API: ${error.status}, Nội dung: ${error.message}`
                    : 'Không thể phân tích kết quả JSON từ API';
                return throwError(() => new Error(errorMessage));
            })
        );
    }
}