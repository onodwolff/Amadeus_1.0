import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-analytics',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Analytics</h2>
    <div class="grid grid-cols-5 gap-3 items-end mb-4">
      <div>
        <label class="block text-sm mb-1">Exchange</label>
        <select class="border rounded p-2 w-full" [(ngModel)]="exchange">
          <option value="binance">binance</option>
          <option value="bybit">bybit</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Category</label>
        <select class="border rounded p-2 w-full" [(ngModel)]="category">
          <option value="usdt">usdt</option>
          <option value="spot">spot</option>
          <option value="linear">linear</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Symbol</label>
        <input class="border rounded p-2 w-full" [(ngModel)]="symbol">
      </div>
      <div class="col-span-2">
        <button class="px-3 py-2 rounded bg-black text-white" (click)="load()">Load</button>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-medium mb-2">Daily PnL (cash)</h3>
        <table class="min-w-full text-sm">
          <thead><tr class="text-left text-gray-500"><th>Day</th><th>Cash</th></tr></thead>
          <tbody>
            @for (d of daily(); track d.day) { <tr class="border-t"><td>{{ d.day }}</td><td>{{ d.cash | number:'1.2-2' }}</td></tr> }
          </tbody>
        </table>
      </div>
      <div>
        <h3 class="font-medium mb-2">Equity</h3>
        <svg [attr.viewBox]="'0 0 400 200'" class="w-full border rounded">
          <polyline [attr.points]="points()" fill="none" stroke="currentColor"></polyline>
        </svg>
      </div>
    </div>
  </div>
  `
})
export class AnalyticsComponent {
  api = inject(ApiService);
  exchange = 'binance'; category = 'usdt'; symbol = 'BTCUSDT';
  daily = signal<any[]>([]);
  equity = signal<{ts:number;equity:number}[]>([]);

  scaleX(arr:any[], i:number) { return Math.round((i/(Math.max(arr.length-1,1)))*380)+10; }
  scaleY(arr:any[], y:number) {
    const ys = arr.map(p=>p.equity);
    const min = Math.min(...ys, 0); const max = Math.max(...ys, 1);
    const norm = (y - min) / (max - min || 1);
    return Math.round((1 - norm) * 180) + 10;
  }
  points() {
    const arr = this.equity();
    return arr.map((p,i)=>`${this.scaleX(arr,i)},${this.scaleY(arr,p.equity)}`).join(' ');
  }

  async load() {
    const d = await fetch(`${(this.api as any).base}/analytics/pnl/daily?symbol=${this.symbol}&exchange=${this.exchange}&category=${this.category}`).then(r=>r.json());
    this.daily.set(d.daily || []);
    const e = await fetch(`${(this.api as any).base}/analytics/equity/series?symbol=${this.symbol}&exchange=${this.exchange}&category=${this.category}`).then(r=>r.json());
    this.equity.set((e.series || []).map((x:any)=>({ ts:x.ts, equity:x.equity })));
  }
}
