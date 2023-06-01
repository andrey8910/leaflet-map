import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor() {}

  private get ourStorage(): Storage {
    return localStorage;
  }

  setItem(key: string, value: any) {
    this.ourStorage.setItem(key, JSON.stringify(value));
  }
  getItem(key: string): any {
    return this.ourStorage.getItem(key);
  }
  removeItem(key: string) {
    this.ourStorage.removeItem(key);
  }
  clear(): void {
    this.ourStorage.clear();
  }
}
