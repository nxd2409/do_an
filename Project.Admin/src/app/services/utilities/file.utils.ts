import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })

export class FileUtilities {

    constructor() { }

    // Convert filename
    static convertFilename(filename: string): string {
        const removeVietnameseTones = (str: string): string => {
            return str.normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D');
        };

        const toPascalCase = (str: string): string => {
            return str
                .toLowerCase()
                .split(/[^a-z0-9]+/g)
                .filter(Boolean)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
        };

        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) {
            return toPascalCase(removeVietnameseTones(filename));
        }

        const name = filename.substring(0, lastDotIndex);
        const ext = filename.substring(lastDotIndex + 1);

        return `${toPascalCase(removeVietnameseTones(name))}.${ext.toLowerCase()}`;
    }

    // Trích xuất đuôi mở rộng của file (không bao gồm dấu chấm)
    static getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toLowerCase() || '';
    }

    // Lấy tên file mà không có phần mở rộng.
    static getFileNameWithoutExtension(filename: string): string {
        return filename.substring(0, filename.lastIndexOf('.')) || filename;
    }

    // Chuyển đổi dung lượng file từ byte sang định dạng dễ đọc (KB, MB, GB,...)
    static getHumanFileSize(bytes: number, decimals = 2): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Kiểm tra xem file có phải là ảnh không (jpg, png, webp, svg,...)
    static isImageFile(filename: string): boolean {
        const ext = this.getFileExtension(filename);
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
    }

    // Kiểm tra xem có phải PDF không
    static isPdfFile(filename: string): boolean {
        return this.getFileExtension(filename) === 'pdf';
    }

    // Xác định loại MIME (content-type) từ đuôi file
    static getMimeTypeByExtension(extension: string): string {
        const map: Record<string, string> = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            txt: 'text/plain',
            json: 'application/json',
            csv: 'text/csv'
        };
        return map[extension.toLowerCase()] || 'application/octet-stream';
    }

    // Kiểm tra tên file có hợp lệ
    static isValidFileName(filename: string): boolean {
        const forbidden = /[\\/:*?"<>|]/;
        return !!filename && !forbidden.test(filename) && !filename.includes('..');
    }

    // Chuyển file thành base64
    static getBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    }

}