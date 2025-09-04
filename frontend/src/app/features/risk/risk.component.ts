import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-risk',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4 max-w-xl">
    <h2 class="text-xl font-semibold mb-4">Risk Limits</h2>

    <form (ngSubmit)="save()" class="grid gap-3">
      <label class="block">
        <span class="text-sm">Max active orders</span>
        <input type="number" class="border rounded p-2 w-full" [(ngModel)]="limits.max_active_orders" name="mao">
      </label>
      <label class="block">
        <span class="text-sm">Max position qty</span>
        <input type="number" class="border rounded p-2 w-full" [(ngModel)]="limits.max_position_qty" name="mpq" step="0.001">
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" [(ngModel)]="limits.forbid_market_orders" name="fmo">
        <span class="text-sm">Forbid market orders</span>
      </label>
      <button class="px-3 py-2 rounded bg-black text-white w-fit">Save</button>
    </form>

    <div class="mt-6">
      <h3 class="font-medium mb-2">State</h3>
      <pre class="bg-gray-50 p-3 rounded text-sm">{{ state | json }}</pre>
    </div>
  </div>
  `
})
export class RiskComponent {
  api = inject(ApiService);
  limits: any = { max_active_orders: 10, max_position_qty: 1.0, forbid_market_orders: false };
  state: any = {};

  async ngOnInit() {
    this.limits = await this.api.getRiskLimits();
    this.state = await this.api.getRiskState();
  }
  async save() {
    this.limits = await this.api.setRiskLimits(this.limits);
    this.state = await this.api.getRiskState();
  }
}
