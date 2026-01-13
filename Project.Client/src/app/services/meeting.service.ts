import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { CommonService } from './common/common.service'
import { HttpClient } from '@angular/common/http'
import { EnvironmentService } from './common/environment.service'
import { LoadingService } from './common/loading.service'

@Injectable({
    providedIn: 'root',
})
export class MeetingService {
    constructor(
        private common: CommonService, 
        private http: HttpClient, 
        private env: EnvironmentService,
        private loading : LoadingService,
    ) { }

    startQuickMeeting(name: string): Observable<any> {
        return this.common.get(`Meeting/StartQuickMeeting?name=${name}`)
    }

    searchMeeting(request: any): Observable<any> {
        return this.common.get(`Meeting/SearchMeetingInfo`, request)
    }

    buildTreeOrgAndUser(): Observable<any> {
        return this.common.get(`Meeting/BuildTreeOrgAndUser`)
    }

    getInfoMeeting(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/GetInfoMeeting/${meetingId}`)
    }

    getPersonalMeeting(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/GetPersonalMeeting/${meetingId}`, {}, false)
    }

    getMeetingVote(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/GetMeetingVote/${meetingId}`, {}, false)
    }

    answerVote(data: any): Observable<any> {
        return this.common.post(`Meeting/AnswerVote`, data, false)
    }

    getListFilesCommon(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/GetListFilesCommon/${meetingId}`, {}, false)
    }

    createMeeting(data: any): Observable<any> {
        return this.common.post(`Meeting/CreateMeeting`, data)
    }
    updateMeeting(data: any): Observable<any> {
        return this.common.post(`Meeting/UpdateMeeting`, data)
    }

    getMeetingDetail(id: string): Observable<any> {
         return this.common.get(`Meeting/Detail/${id}`);
    }

    startVoting(data: any): Observable<any> {
        return this.common.post(`Meeting/StartVoting`, data, false)
    }

    endVoting(data: any): Observable<any> {
        return this.common.post(`Meeting/EndVoting`, data, false)
    }

    getDetailVote(voteId: any): Observable<any> {
        return this.common.get(`Meeting/GetDetailVote/${voteId}`)
    }

    raiseHand(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('apiBaseUrl')}/Meeting/RaiseHand`, payload)
    }

    startMeeting(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('apiBaseUrl')}/Meeting/StartMeeting`, payload)
    }

    endMeeting(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('apiBaseUrl')}/Meeting/EndMeeting`, payload)
    }

    startRecording(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('apiBaseUrl')}/Meeting/StartRecording`, payload)
    }

    endRecording(payload: any): Observable<any> {
        return this.http.post(`${this.env.getEnv('apiBaseUrl')}/Meeting/EndRecording`, payload)
    }

    updateStatusMeeting(meetingId: string, status: number): Observable<any> {
        return this.common.put(`Meeting/UpdateStatusMeeting?meetingId=${meetingId}&status=${status}`, {}, false)
    }

    getOnlineUsers(): Observable<any> {
        return this.common.get(`SignalR/GetOnlineUsers`, {}, false)
    }

    intoTheMeeting(meetingId: any): Observable<any> {
        return this.http.get(`${this.env.getEnv('apiBaseUrl')}/Meeting/IntoTheMeeting/${meetingId}`)
    }

    exitTheMeeting(meetingId: any): Observable<any> {
        return this.http.get(`${this.env.getEnv('apiBaseUrl')}/Meeting/ExitTheMeeting/${meetingId}`)
    }

    moveToSharedDocument(meetingId: any, fileId : any): Observable<any> {
        return this.common.get(`File/MoveToSharedDocument?fileId=${fileId}&meetingId=${meetingId}`)
    }

    sendMessage(message: any): Observable<any> {
        return this.common.post(`Meeting/SendMessage`, message, false)
    }

    saveVoiceToText(data: any): Observable<any> {
        return this.common.post(`Meeting/SaveVoiceToText`, data)
    }

    getListMessage(request : any): Observable<any> {
        return this.common.post(`Meeting/GetListMessage`, request, false)
    }
    getRoomList(): Observable<any> {
        return this.common.get(`${this.env.getEnv('apiBaseUrl')}/Room/search`);
    }

    getRoomDetail(code: string): Observable<any> {
        return this.common.get(`${this.env.getEnv('apiBaseUrl')}/Room/detail/${code}`);
    }

    getMeetingLayout(meetingId: string): Observable<any> {
        return this.common.get(`Meeting/${meetingId}/layout`);
    }

    createMeetingVote(data: any): Observable<any> {
        return this.common.post(`Meeting/CreateMeetingVote`, data);
    }

    kickParticipant(data: any): Observable<any> {
        return this.common.post(`Meeting/KickParticipant`, data, false);
    }

    controlParticipant(data: any): Observable<any> {
        return this.common.post(`Meeting/ControlParticipant`, data, false);
    }

    syncParticipantState(request: any): Observable<any> {
        return this.common.post(`Meeting/SyncParticipantState`, request, false);
    }

    toggleAllMedia(request: any): Observable<any> {
        return this.common.post(`Meeting/ToggleAllMedia`, request);
    }

    broadcastTranscription(data: any): Observable<any> {
        return this.common.post(`Meeting/BroadcastTranscription`, data, false);
    }

    deleteMeeting(meetingId: string): Observable<any> {
        return this.common.delete(`Meeting/DeleteMeeting/${meetingId}`);
    }

    exportPersonal(meetingId: string): void {
        this.loading.show();
        this.http.get(`${this.env.getEnv('apiBaseUrl')}/Meeting/ExportPersonal/${meetingId}`, {
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
                this.loading.hide();
                window.URL.revokeObjectURL(link.href);
            },
            error: () => {
                this.loading.show();
            }
        });
    }

    saveExcalidraw(data: any): Observable<any> {
    return this.common.post(`File/SaveExcalidraw`, data);  
    }

    getExcalidrawList(meetingId: string): Observable<any> {
        return this.common.get(`File/GetExcalidrawList/${meetingId}`, {}, false);  
    }

    exportSummaryMeeting(meetingId: string): Observable<any> {
        return this.common.get(`File/ExportSummaryMeeting/${meetingId}`, {});  
    }

    getExcalidrawDetail(id: string): Observable<any> {
        return this.common.get(`File/GetExcalidrawDetail/${id}`, {}, false);  
    }

    deleteExcalidraw(id: string): Observable<any> {
        return this.common.delete(`File/DeleteExcalidraw/${id}`); 
    }

   

    private extractFilename(disposition: string | null): string | null {
        const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        return match ? decodeURIComponent(match[1].replace(/['"]/g, '')) : null;
    }
}
