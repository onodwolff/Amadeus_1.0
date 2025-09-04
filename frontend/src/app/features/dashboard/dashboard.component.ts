import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
  <div class="p-4 grid gap-6">
    <h2 class="text-xl font-semibold">Dashboard</h2>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="border rounded p-4">
        <div class="text-sm text-gray-500">Realized cash</div>
        <div class="text-2xl font-bold">{{ data()?.realized_cash | number:'1.2-2' }}</div>
      </div>
      <div class="border rounded p-4">
        <div class="text-sm text-gray-500">Equity</div>
        <div class="text-2xl font-bold">{{ data()?.equity | number:'1.2-2' }}</div>
      </div>
      <div class="border rounded p-4">
        <div class="text-sm text-gray-500">Position</div>
        <div class="text-2xl font-bold">{{ data()?.position_qty }}</div>
      </div>
    </div>
    <div class="text-sm text-gray-600">Last price: {{ data()?.last_price }}</div>
  </div>`
})
export class DashboardComponent {
  api = inject(ApiService);
  data = signal<any>({});

  async ngOnInit() {
    this.data.set(await this.api.getDashboardSummary());
  }
}
