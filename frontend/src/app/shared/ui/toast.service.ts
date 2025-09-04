import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; text: string; kind?: 'info'|'success'|'error'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  list = signal<Toast[]>([]);
  push(text: string, kind: Toast['kind']='info') {
    const id = Date.now() + Math.random();
    this.list.update(arr => arr.concat({ id, text, kind }));
    setTimeout(() => this.dismiss(id), 3000);
  }
  dismiss(id: number) {
    this.list.update(arr => arr.filter(t => t.id !== id));
  }
}
