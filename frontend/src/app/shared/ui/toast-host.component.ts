import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  standalone: true,
  selector: 'toast-host',
  imports: [CommonModule],
  template: `
  <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
    @for (t of toast.list(); track t.id) {
      <div class="px-3 py-2 rounded shadow text-white"
           [class.bg-gray-800]="t.kind==='info'"
           [class.bg-emerald-600]="t.kind==='success'"
           [class.bg-rose-600]="t.kind==='error'">
        {{ t.text }}
      </div>
    }
  </div>
  `
})
export class ToastHostComponent {
  toast = inject(ToastService);
}
