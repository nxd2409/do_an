import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { LocalStorageUtils } from "../utilities/local-storage.ultis";

@Injectable({ providedIn: 'root' })
export class GlobalService {
    private loading: BehaviorSubject<boolean>;
    breadcrumbSubject: Subject<boolean> = new Subject<boolean>()
    rightSubject: Subject<string> = new Subject<string>();
    breadcrumb: any = []
    rightData: any = []

    constructor() {
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

    getInitialsAvatar(fullName: string): string {
        if (!fullName) return '?';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0][0].toUpperCase();
        }
        const first = parts[0][0].toUpperCase();
        const last = parts[parts.length - 1][0].toUpperCase();
        return first + last;
    }

    getAvatarColor(nameOrId: string): string {
        if (!nameOrId) return '#1890ff';
        const firstChar = nameOrId.charAt(0).toUpperCase();
        const code = firstChar.charCodeAt(0);
        const group = Math.floor((code - 65) / 2);

        const colors = [
            '#1890ff', '#52c41a', '#faad14', '#eb2f96', '#13c2c2',
            '#722ed1', '#fa541c', '#2f54eb', '#a0d911', '#f759ab',
            '#36cfc9', '#9254de', '#f5222d', '#73d13d', '#ffc53d',
            '#597ef7', '#ff85c0', '#5cdbd3', '#b37feb', '#ff4d4f'
        ];

        return colors[group % colors.length];
    }

    formatDateTime(dateInput: any): string {
        const date = new Date(dateInput);  // ép về Date

        if (isNaN(date.getTime())) {
            console.error("Invalid date:", dateInput);
            return "";
        }

        const yyyy = date.getFullYear();
        const MM = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');

        return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
    }
}