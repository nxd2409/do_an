import * as CryptoJS from 'crypto-js';

const SECRET_KEY_LOCAL_STORAGE = 'iOYUg1}T+P>QiAni<yO,e0;kMkMl3*N_';

export class LocalStorageUtils {
  static setItem(key: string, value: any): void {
    try {
      const jsonData = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(
        jsonData,
        SECRET_KEY_LOCAL_STORAGE
      ).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`SetItem failed for key "${key}"`, error);
    }
  }

  static getItem(key: string): any | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(
        encrypted,
        SECRET_KEY_LOCAL_STORAGE
      ).toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        return null;
      }

      return JSON.parse(decrypted);
    } catch (error) {
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }

  static exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  static debugDecrypt(key: string): { encrypted: string | null, decrypted: string | null } {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return { encrypted: null, decrypted: null };

      const decrypted = CryptoJS.AES.decrypt(
        encrypted,
        SECRET_KEY_LOCAL_STORAGE
      ).toString(CryptoJS.enc.Utf8);

      return { encrypted, decrypted };
    } catch (error) {
      return { encrypted: null, decrypted: null };
    }
  }
}