import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { EnvironmentService } from './environment.service';

export interface NotificationData {
    username?: string;
    usernames?: string[];
    action: string;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
    
    constructor(private env : EnvironmentService){}

    private hubConnection!: signalR.HubConnection;

    startConnection(username: string, onConnected?: () => void): void {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${this.env.getEnv('apiBaseUrl')}/Hub/Notification?username=${username}`, {
                withCredentials: true,
            })
            .build();

        this.hubConnection.start()
            .then(() => {
                if (onConnected) {
                    onConnected();
                }
            });
    }

    onNotification(callback: (data: NotificationData) => void): void {
        this.hubConnection.on('ReceiveNotification', callback);
    }

    stop(onStopped?: () => void): void {
        this.hubConnection?.stop()
            .then(() => {
                if (onStopped) {
                    onStopped();
                }
            });
    }

    isConnected(): boolean {
        return this.hubConnection?.state === signalR.HubConnectionState.Connected;
    }
}
