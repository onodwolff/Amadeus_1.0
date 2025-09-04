import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-risk',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Risk Policies</h2>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="border rounded p-4">
        <div class="grid grid-cols-2 gap-2">
          <input class="border rounded p-2" [(ngModel)]="sid" placeholder="strategy id">
          <button class="px-3 py-2 rounded bg-black text-white" (click)="load()">Load</button>
          <label>max_active_orders</label><input type="number" class="border rounded p-2" [(ngModel)]="pol.max_active_orders">
          <label>max_dd</label><input type="number" step="0.01" class="border rounded p-2" [(ngModel)]="pol.max_dd">
          <label>max_leverage</label><input type="number" class="border rounded p-2" [(ngModel)]="pol.max_leverage">
          <label>max_notional_per_symbol.BTCUSDT</label><input type="number" class="border rounded p-2" [(ngModel)]="pol.max_notional_per_symbol.BTCUSDT">
          <label>max_pos_qty_per_symbol.BTCUSDT</label><input type="number" step="0.0001" class="border rounded p-2" [(ngModel)]="pol.max_pos_qty_per_symbol.BTCUSDT">
          <div class="col-span-2">
            <button class="px-3 py-2 rounded bg-black text-white" (click)="save()">Save</button>
          </div>
        </div>
      </div>
      <div class="border rounded p-4">
        <div class="font-medium mb-2">Risk Log</div>
        <div class="max-h-[320px] overflow-auto text-sm">
          <div *ngFor="let it of log()">{{ it.ts }} — [{{ it.strategy_id }}] {{ it.action }} — {{ it.msg }}</div>
        </div>
        <div class="mt-2">
          <button class="px-3 py-2 rounded" (click)="refreshLog()">Refresh</button>
        </div>
      </div>
    </div>
  </div>
  `
})
export class RiskComponent {
  sid=''; pol:any={max_active_orders:100, max_dd:0.3, max_leverage:5.0, max_notional_per_symbol:{}, max_pos_qty_per_symbol:{}};
  log = signal<any[]>([]);
  async load() {
    const base = (window as any).__API__ || 'http://localhost:8000/api';
    const p = await fetch(`${base}/riskx/policies/${this.sid}`).then(r=>r.json());
    this.pol = Object.assign({max_active_orders:100, max_dd:0.3, max_leverage:5.0, max_notional_per_symbol:{}, max_pos_qty_per_symbol:{}}, p||{});
  }
  async save() {
    const base = (window as any).__API__ || 'http://localhost:8000/api';
    await fetch(`${base}/riskx/policies/${this.sid}`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(this.pol)});
  }
  async refreshLog() {
    const base = (window as any).__API__ || 'http://localhost:8000/api';
    this.log.set(await fetch(`${base}/riskx/log`).then(r=>r.json()).then(j=>j.items));
  }
}
