import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { EnvironmentService } from '../common/environment.service';

@Injectable({
    providedIn: 'root',
})
export class DeepSeekService {
    constructor(
        private env: EnvironmentService
    ) { }

    sendMessage(prompt: string): Observable<string> {
        const url = `${this.env.getEnv('apiBaseUrl')}/DeepSeek/ChatDeepSeek?prompt=${encodeURIComponent(prompt)}`;
        return new Observable<string>((observer) => {
            fetch(url).then((response) => {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                const read = () => {
                    reader?.read().then(({ done, value }) => {
                        if (done) {
                            observer.complete();
                            return;
                        }
                        const text = decoder.decode(value, { stream: true });
                        observer.next(text);
                        read();
                    });
                };
                read();
            }).catch((err) => observer.error(err));
        });
    }

}
