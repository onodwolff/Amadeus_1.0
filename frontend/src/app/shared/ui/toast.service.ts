import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastKind = 'info' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private msg = inject(MessageService);

  push(text: string, kind: ToastKind = 'info') {
    this.msg.add({ severity: kind, summary: text });
  }
}
