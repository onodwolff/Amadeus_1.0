import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-audit',
  imports: [CommonModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Audit Logs</h2>
    <p class="text-sm text-gray-600 mb-4">Only admins can view this page.</p>
    <div *ngIf="auth.role()==='admin'; else denied">
      <table class="min-w-full text-sm">
        <thead><tr class="text-left text-gray-500"><th>Time</th><th>Route</th><th>Method</th><th>Status</th><th>Actor</th></tr></thead>
        <tbody>
          @for (a of logs(); track a.id) {
            <tr class="border-t">
              <td>{{ a.ts }}</td><td>{{ a.route }}</td><td>{{ a.method }}</td><td>{{ a.status }}</td><td>{{ a.actor }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <ng-template #denied><div class="text-rose-600">Forbidden</div></ng-template>
  </div>
  `
})
export class AuditComponent {
  auth = inject(AuthService);
  logs = signal<any[]>([]);
  base = (window as any).__API__ || 'http://localhost:8000/api';
  token = (window as any).__TOKEN__ || '';

  async ngOnInit() {
    await this.auth.whoami();
    if (this.auth.role()!=='admin') return;
    const headers = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    const r = await fetch(`${this.base}/audit`, { headers });
    this.logs.set(await r.json());
  }
}
