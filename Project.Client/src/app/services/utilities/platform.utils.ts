export class PlatformUtils {
    /**
     * Kiểm tra đang chạy trên trình duyệt
     */
    static isBrowser(): boolean {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
    }

    /**
     * Kiểm tra đang chạy trên server (Angular Universal)
     */
    static isServer(): boolean {
        return !PlatformUtils.isBrowser();
    }

    /**
     * Kiểm tra thiết bị di động
     */
    static isMobile(): boolean {
        if (!PlatformUtils.isBrowser()) return false;
        const ua = navigator.userAgent || navigator.vendor;
        return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
    }

    /**
     * Kiểm tra có phải iOS
     */
    static isIOS(): boolean {
        if (!PlatformUtils.isBrowser()) return false;
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    }

    /**
     * Kiểm tra có phải Android
     */
    static isAndroid(): boolean {
        if (!PlatformUtils.isBrowser()) return false;
        return /android/i.test(navigator.userAgent);
    }

    /**
     * Kiểm tra touch support
     */
    static isTouchDevice(): boolean {
        return PlatformUtils.isBrowser() && 'ontouchstart' in window;
    }

    /**
     * Lấy locale trình duyệt
     */
    static getBrowserLocale(): string {
        if (!PlatformUtils.isBrowser()) return 'en-US';
        return navigator.language || (navigator as any).userLanguage || 'en-US';
    }

    /**
     * Lấy timezone người dùng
     */
    static getBrowserTimezone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return 'UTC';
        }
    }
}
