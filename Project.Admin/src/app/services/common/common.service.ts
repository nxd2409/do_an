import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http'
import { Observable, throwError, BehaviorSubject } from 'rxjs'
import {
    catchError,
    map,
    finalize,
    switchMap,
    filter,
    take,
} from 'rxjs/operators'
import { Router } from '@angular/router'
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { LoadingService } from './loading.service'
import { EnvironmentService } from './environment.service'
import { NzMessageService } from 'ng-zorro-antd/message'

@Injectable({
    providedIn: 'root',
})
export class CommonService {
    private baseUrl: string = ''
    private refreshTokenInProgress = false
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
        null,
    )

    constructor(
        private http: HttpClient,
        private router: Router,
        private notification: NzNotificationService,
        private _loading: LoadingService,
        private env: EnvironmentService,
        private message: NzMessageService
    ) {
        this.baseUrl = this.env.getEnv('API_BASE_URL') || ''
     }

    private buildParams(params?: any): HttpParams {
        let httpParams = new HttpParams()
        if (!params) return httpParams

        const flattenParams = (obj: any, parentKey: string = ''): void => {
            Object.keys(obj).forEach((key) => {
                const fullKey = parentKey ? `${parentKey}.${key}` : key
                const value = obj[key]

                if (value !== null && value !== undefined) {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        flattenParams(value, fullKey)
                    } else if (Array.isArray(value)) {
                        value.forEach((item) => {
                            httpParams = httpParams.append(fullKey, item)
                        })
                    } else {
                        httpParams = httpParams.append(fullKey, value)
                    }
                }
            })
        }

        flattenParams(params)
        return httpParams
    }

    private handleGetResponse(response: any) {
        if (response.status === false) {
            throw new Error(`${response.messageObject.message}${response.messageObject.messageDetail ? ' - ' + response.messageObject.messageDetail : ''}`)
        }
        return response.data
    }

    private handleResponse(response: any) {
        if (response.status === true && (response.messageObject.message !== null || response.messageObject.message !== '')) {

            this.showSuccess(response)
        } else {
            this.showError(response)
        }
        return response
    }

    private resolveUrl(endpoint: string): string {
        if (/^https?:\/\//i.test(endpoint)) {
            return endpoint;
        }
        return `${this.baseUrl}/${endpoint}`;
    }

    get<T>(
        endpoint: string,
        params?: any,
        showLoading: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http
            .get<any>(this.resolveUrl(endpoint), { params: this.buildParams(params) })
            .pipe(
                map(this.handleGetResponse),
                catchError((error) => this.handleError(error, () => this.get<T>(endpoint, params, showLoading))),
                finalize(() => {
                    if (showLoading) {
                        this._loading.setLoading(false);
                    }
                })
            );
    }


    post<T>(
        endpoint: string,
        data: any,
        showLoading: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.post<any>(this.resolveUrl(endpoint), data).pipe(
            map(this.handleResponse.bind(this)),
            catchError((error) => this.handleError(error, () => this.post<T>(endpoint, data, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }


    put<T>(
        endpoint: string,
        data: any,
        showLoading: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.put<any>(this.resolveUrl(endpoint), data).pipe(
            map(this.handleResponse.bind(this)),
            catchError((error) => this.handleError(error, () => this.put<T>(endpoint, data, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }



    delete<T>(
        endpoint: string,
        data: any = {},
        showLoading: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.delete<any>(this.resolveUrl(endpoint), { body: data }).pipe(
            map(this.handleResponse.bind(this)),
            catchError((error) => this.handleError(error, () => this.delete<T>(endpoint, data, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }

    deletes<T>(
        endpoint: string,
        data: string | number[],
        showLoading: boolean = true,
    ): Observable<T> {
        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.request<any>('delete', this.resolveUrl(endpoint), { body: data }).pipe(
            map(this.handleResponse.bind(this)),
            catchError((error) => this.handleError(error, () => this.deletes<T>(endpoint, data, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(false);
                }
            })
        );
    }


    uploadFile(
        endpoint: string,
        file: File,
        paramsUrl?: any,
        params?: any,
        showLoading: boolean = true,
    ): Observable<any> {
        const formData = new FormData()
        formData.append('file', file, file.name)

        if (params) {
            Object.keys(params).forEach(key => formData.append(key, params[key]))
        }

        if (showLoading) {
            this._loading.setLoading(true);
        }
        return this.http.post<any>(this.resolveUrl(endpoint), formData, {
            params: this.buildParams(paramsUrl)
        }).pipe(
            map(this.handleResponse.bind(this)),
            catchError((error) => this.handleError(error, () => this.uploadFile(endpoint, file, paramsUrl, params, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(true);
                }
            })
        )
    }

    uploadFiles(
        endpoint: string,
        files: File[],
        paramsUrl?: any,
        params?: any,
        showLoading: boolean = true,
    ): Observable<any> {
        const formData = new FormData()
        files.forEach(file => formData.append('files', file, file.name))

        if (params) {
            Object.keys(params).forEach(key => formData.append(key, params[key]))
        }

        if (showLoading) {
            this._loading.setLoading(true);
        }

        return this.http.post<any>(this.resolveUrl(endpoint), formData, {
            params: this.buildParams(paramsUrl)
        }).pipe(
            map(this.handleResponse.bind(this)),
            catchError((error) => this.handleError(error, () => this.uploadFiles(endpoint, files, paramsUrl, params, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(true);
                }
            })
        )
    }

    downloadFile(endpoint: string, params?: any, showLoading: boolean = true): Observable<HttpResponse<Blob>> {
        if (showLoading) {
            this._loading.setLoading(true);
        }
        return this.http.get(this.resolveUrl(endpoint), {
            params: this.buildParams(params),
            responseType: 'blob',
            observe: 'response'
        }).pipe(
            catchError((error) => this.handleError(error, () => this.downloadFile(endpoint, params, showLoading))),
            finalize(() => {
                if (showLoading) {
                    this._loading.setLoading(true);
                }
            })
        );
    }


    showSuccess(message: any): void {
        if (message.messageObject.message) {
            this.message.success(message.messageObject.message)
        }
    }

    showError(message: any): void {
        if (message.messageObject.message) {
            const { code, message: msg, messageDetail, logId } = message.messageObject;
            const codeText = code ? `[${code}] ` : '';
            const description = logId
                ? `${messageDetail}<br>LogID: ${logId}`
                : messageDetail;

            this.notification.create(
                'error',
                `${codeText}${msg}`,
                description,
                {
                    nzDuration: 10000,
                    nzPlacement: 'topLeft',
                    nzStyle: { whiteSpace: 'pre-line' },
                    nzClass: 'custom-notification'
                }
            );
        }
    }

    private handleError = (
        error: HttpErrorResponse,
        retryCallback: () => Observable<any>,
    ): Observable<any> => {
        this._loading.reset();
        if (error.status === 503) {
            this.router.navigate(['maintain-server'])
        }
        if (error.status === 0) {
            this.router.navigate(['error-server'])
        }
        if (error.status === 401) {
            if (!this.refreshTokenInProgress) {
                this.refreshTokenInProgress = true
                this.refreshTokenSubject.next(null)

                return this.refreshToken().pipe(
                    switchMap(({ data }) => {
                        this.refreshTokenInProgress = false
                        this.refreshTokenSubject.next(data)
                        localStorage.setItem('token', data?.accessToken)
                        localStorage.setItem('refreshToken', data?.refreshToken)
                        return retryCallback()
                    }),
                    catchError(() => {
                        this.refreshTokenInProgress = false
                        localStorage.clear()
                        this.router.navigate(['/login'])
                        return throwError('Session expired')
                    })
                )
            }
            return this.refreshTokenSubject.pipe(
                filter(result => result !== null),
                take(1),
                switchMap(() => retryCallback())
            )
        }

        const errorMessage = error.error?.messageObject
            ? `${error.error.messageObject.message} - ${error.error.messageObject.messageDetail}`
            : error.message

        this.showError(errorMessage)
        this._loading.setLoading(false);
        return throwError(errorMessage)
    }

    private refreshToken(): Observable<any> {
        const refreshToken = localStorage.getItem('refreshToken')
        return this.http.post<any>(this.resolveUrl('Auth/RefreshToken'), { refreshToken })
    }
}
