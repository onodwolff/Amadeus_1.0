import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-analytics',
  imports: [CommonModule, FormsModule, PrimeNgModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Analytics</h2>
    <div class="grid grid-cols-5 gap-3 items-end mb-4">
      <div>
        <label class="block text-sm mb-1">Exchange</label>
        <p-dropdown class="w-full" [(ngModel)]="exchange" [options]="exchangeOptions"></p-dropdown>
      </div>
      <div>
        <label class="block text-sm mb-1">Category</label>
        <p-dropdown class="w-full" [(ngModel)]="category" [options]="categoryOptions"></p-dropdown>
      </div>
      <div>
        <label class="block text-sm mb-1">Symbol</label>
        <input pInputText class="w-full" [(ngModel)]="symbol">
      </div>
      <div class="col-span-2">
        <p-button label="Load" (onClick)="load()" severity="primary"></p-button>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-medium mb-2">Daily PnL (cash)</h3>
        <p-table [value]="daily()" class="min-w-full text-sm">
          <ng-template pTemplate="header">
            <tr class="text-left text-gray-500"><th>Day</th><th>Cash</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-d>
            <tr class="border-t"><td>{{ d.day }}</td><td>{{ d.cash | number:'1.2-2' }}</td></tr>
          </ng-template>
        </p-table>
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
  exchangeOptions = [
    { label: 'binance', value: 'binance' },
    { label: 'bybit', value: 'bybit' }
  ];
  categoryOptions = [
    { label: 'usdt', value: 'usdt' },
    { label: 'spot', value: 'spot' },
    { label: 'linear', value: 'linear' }
  ];

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
    const d: any = await firstValueFrom(
      this.api.get(`/analytics/pnl/daily?symbol=${this.symbol}&exchange=${this.exchange}&category=${this.category}`)
    );
    this.daily.set(d.daily || []);
    const e: any = await firstValueFrom(
      this.api.get(`/analytics/equity/series?symbol=${this.symbol}&exchange=${this.exchange}&category=${this.category}`)
    );
    this.equity.set((e.series || []).map((x:any)=>({ ts:x.ts, equity:x.equity })));
  }
}
