import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-backtest',
  imports: [CommonModule, FormsModule, PrimeNgModule],
  template: `
  <div class="p-4 max-w-3xl">
    <h2 class="text-xl font-semibold mb-4">Backtest</h2>
    <div class="grid grid-cols-6 gap-3 items-end mb-4">
      <div>
        <label class="block text-sm mb-1">Exchange</label>
        <p-dropdown class="w-full" [(ngModel)]="cfg.exchange" [options]="exchangeOptions"></p-dropdown>
      </div>
      <div>
        <label class="block text-sm mb-1">Category</label>
        <p-dropdown class="w-full" [(ngModel)]="cfg.category" [options]="categoryOptions"></p-dropdown>
      </div>
      <div>
        <label class="block text-sm mb-1">Symbol</label>
        <input pInputText class="w-full" [(ngModel)]="cfg.symbol">
      </div>
      <div>
        <label class="block text-sm mb-1">Timeframe</label>
        <input pInputText class="w-full" [(ngModel)]="cfg.tf">
      </div>
      <div>
        <label class="block text-sm mb-1">Limit</label>
        <p-inputNumber class="w-full" [(ngModel)]="cfg.limit"></p-inputNumber>
      </div>
      <div>
        <p-button label="Run" (onClick)="run()" severity="primary" class="w-full"></p-button>
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
  exchangeOptions = [
    { label: 'mock', value: 'mock' },
    { label: 'bybit', value: 'bybit' },
    { label: 'binance', value: 'binance' }
  ];
  categoryOptions = [
    { label: 'spot', value: 'spot' },
    { label: 'linear', value: 'linear' },
    { label: 'usdt', value: 'usdt' }
  ];

  async run() {
    this.result.set(await this.api.runBacktest(this.cfg));
  }
}
