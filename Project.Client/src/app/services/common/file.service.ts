import { Injectable } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { EnvironmentService } from './environment.service';

@Injectable({
    providedIn: 'root',
})
export class FileService {
    constructor(
        private common: CommonService,
        private http: HttpClient,
        private env: EnvironmentService
    ) { }

    upload(data: any) {
        return this.common.post(`File/Upload`, data, true);
    }

    download(fileId: string): void {
        this.http.get(`${this.env.getEnv('apiBaseUrl')}/File/Download/${fileId}`, {
            observe: 'response',
            responseType: 'blob'
        }).subscribe({
            next: (response: any) => {
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const error = JSON.parse(reader.result as string);
                        alert(error.messageObject?.message || 'Không thể tải file!');
                    };
                    reader.readAsText(response.body);
                    return;
                }

                const blob = new Blob([response.body!], { type: contentType || 'application/octet-stream' });
                const contentDisposition = response.headers.get('content-disposition');
                const fileName = this.extractFilename(contentDisposition) || 'downloaded-file';
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(link.href);
            },
            error: () => alert('Không thể tải file. Vui lòng thử lại.')
        });
    }

    uploadAndSaveInMeeting(data: any) {
        return this.common.post(`File/UploadAndSaveInMeeting`, data, true);
    }

    getByRefrence(refrenceFileId: any) {
        return this.common.get(`File/GetByRefrence/${refrenceFileId}`, {}, false);
    }

    private extractFilename(disposition: string | null): string | null {
        const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        return match ? decodeURIComponent(match[1].replace(/['"]/g, '')) : null;
    }
}
