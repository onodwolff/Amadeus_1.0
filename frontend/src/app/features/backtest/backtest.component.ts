import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-backtest',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4 max-w-3xl">
    <h2 class="text-xl font-semibold mb-4">Backtest</h2>
    <div class="grid grid-cols-6 gap-3 items-end mb-4">
      <div>
        <label class="block text-sm mb-1">Exchange</label>
        <select class="border rounded p-2 w-full" [(ngModel)]="cfg.exchange">
          <option value="mock">mock</option>
          <option value="bybit">bybit</option>
          <option value="binance">binance</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Category</label>
        <select class="border rounded p-2 w-full" [(ngModel)]="cfg.category">
          <option value="spot">spot</option>
          <option value="linear">linear</option>
          <option value="usdt">usdt</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Symbol</label>
        <input class="border rounded p-2 w-full" [(ngModel)]="cfg.symbol">
      </div>
      <div>
        <label class="block text-sm mb-1">Timeframe</label>
        <input class="border rounded p-2 w-full" [(ngModel)]="cfg.tf">
      </div>
      <div>
        <label class="block text-sm mb-1">Limit</label>
        <input type="number" class="border rounded p-2 w-full" [(ngModel)]="cfg.limit">
      </div>
      <div>
        <button class="px-3 py-2 rounded bg-black text-white w-full" (click)="run()">Run</button>
      </div>
    </div>

    <div *ngIf="result() as r" class="mt-4">
      <h3 class="font-medium mb-2">Metrics</h3>
      <pre class="bg-gray-50 p-3 rounded text-sm">{{ r.metrics | json }}</pre>
      <div class="text-sm text-gray-600">Candles used: {{ r.n }}</div>
    </div>
  </div>
  `
})
export class BacktestComponent {
  api = inject(ApiService);
  cfg: any = { exchange: 'mock', category: 'spot', symbol: 'BTCUSDT', tf: '1m', limit: 500 };
  result = signal<any | null>(null);

  async run() {
    this.result.set(await this.api.runBacktest(this.cfg));
  }
}
