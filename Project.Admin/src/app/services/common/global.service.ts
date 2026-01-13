import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { LocalStorageUtils } from "../utilities/local-storage.ultis";

@Injectable({ providedIn: 'root' })
export class GlobalService {
    private loading: BehaviorSubject<boolean>;
    rightSubject: Subject<string> = new Subject<string>();
    rightData: any = []
    breadcrumbSubject: Subject<boolean> = new Subject<boolean>()
    breadcrumb: any = []

    constructor(
        private message: NzMessageService,
        private modal: NzModalService
    ) {
        this.loading = new BehaviorSubject<boolean>(false);
        this.rightSubject.subscribe((value) => {
            console.log(value);
            
            localStorage.setItem('userRights', value);
            this.rightData = value;
        });
        this.breadcrumbSubject.subscribe((value) => {
            this.breadcrumb = value
        })
    }

    // ==================== BREADCRUMB ====================
    
    setBreadcrumb(value: any) {
        localStorage.setItem('breadcrumb', JSON.stringify(value))
        this.breadcrumbSubject.next(value)
    }

    getBreadcrumb() {
        try {
            if (this.breadcrumb && this.breadcrumb?.length > 0) {
                return this.breadcrumb
            }
            const breadcrumb = localStorage.getItem('breadcrumb')
            return breadcrumb ? JSON.parse(breadcrumb) : null
        } catch (e) {
            return null
        }
    }


    getRightData() {
        try {
            if (this.rightData?.length > 0) {
                return this.rightData;
            }
            const rights = LocalStorageUtils.getItem('userRights')
            
            return rights ? rights : null;
        } catch (e) {
            return null;
        }
    }

    // ==================== MESSAGE NOTIFICATIONS ====================
    
    showSuccess(content: string, duration: number = 3000): void {
        this.message.success(content, {
            nzDuration: duration
        });
    }

    showError(content: string, duration: number = 3000): void {
        this.message.error(content, {
            nzDuration: duration
        });
    }

    showWarning(content: string, duration: number = 3000): void {
        this.message.warning(content, {
            nzDuration: duration
        });
    }

    showInfo(content: string, duration: number = 3000): void {
        this.message.info(content, {
            nzDuration: duration
        });
    }

    showLoading(content: string = 'Đang xử lý...', duration: number = 0): void {
        this.message.loading(content, {
            nzDuration: duration
        });
    }

    // ==================== MODAL DIALOGS ====================
    
    confirm(
        content: string, 
        onOk: () => void, 
        onCancel?: () => void,
        title: string = 'Xác nhận'
    ): void {
        this.modal.confirm({
            nzTitle: title,
            nzContent: content,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                if (onOk) onOk();
            },
            nzOnCancel: () => {
                if (onCancel) onCancel();
            }
        });
    }

    info(content: string, title: string = 'Thông báo'): void {
        this.modal.info({
            nzTitle: title,
            nzContent: content,
            nzOkText: 'Đóng'
        });
    }

    warning(content: string, onOk?: () => void, title: string = 'Cảnh báo'): void {
        this.modal.warning({
            nzTitle: title,
            nzContent: content,
            nzOkText: 'Đóng',
            nzOnOk: () => {
                if (onOk) onOk();
            }
        });
    }

    error(content: string, title: string = 'Lỗi'): void {
        this.modal.error({
            nzTitle: title,
            nzContent: content,
            nzOkText: 'Đóng'
        });
    }

    success(content: string, title: string = 'Thành công'): void {
        this.modal.success({
            nzTitle: title,
            nzContent: content,
            nzOkText: 'Đóng'
        });
    }
}