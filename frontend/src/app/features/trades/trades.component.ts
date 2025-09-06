import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-trades',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-3">Trades</h2>
    <div class="grid md:grid-cols-5 gap-2 mb-3">
      <input class="border rounded p-2 w-full" [(ngModel)]="symbol" placeholder="symbol (e.g. BTCUSDT)">
      <input class="border rounded p-2 w-full" [(ngModel)]="exchange" placeholder="exchange (binance/bybit)">
      <input class="border rounded p-2 w-full" [(ngModel)]="category" placeholder="category (spot/usdt/linear)">
      <select class="border rounded p-2 w-full" [(ngModel)]="strategy_id">
        <option *ngFor="let s of strategies" [value]="s.id">{{ s.id }}</option>
      </select>
      <button class="px-3 py-2 rounded bg-black text-white" (click)="load()">Load</button>
    </div>
    <div class="mb-3">
      <a class="underline" [href]="csvUrl()" target="_blank">Download realized CSV</a>
    </div>
    <table class="w-full text-sm border">
      <thead><tr class="text-left"><th>Time</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th><th>Exchange</th><th>Category</th><th>Strategy</th></tr></thead>
      <tbody>
        @for (f of items(); track f.ts) {
          <tr><td>{{ f.ts }}</td><td>{{ f.symbol }}</td><td>{{ f.side }}</td><td>{{ f.qty }}</td><td>{{ f.price }}</td><td>{{ f.exchange }}</td><td>{{ f.category }}</td><td>{{ f.strategy_id }}</td></tr>
        }
      </tbody>
    </table>
  </div>
  `
})
export class TradesComponent {
  api = inject(ApiService);
  symbol=''; exchange=''; category=''; strategy_id='';
  strategies: {id: string; running: boolean}[] = [];
  items = signal<any[]>([]);

  async ngOnInit() {
    await this.loadStrategies();
  }

  private async loadStrategies() {
    try {
      this.strategies = await this.api.listStrategies();
      if (!this.strategy_id && this.strategies.length) {
        this.strategy_id = this.strategies[0].id;
      }
    } catch (err) {
      console.error('Failed to load strategies', err);
    }
  }
  async load() {
    const params = new URLSearchParams();
    if (this.symbol) params.set('symbol', this.symbol);
    if (this.exchange) params.set('exchange', this.exchange);
    if (this.category) params.set('category', this.category);
    if (this.strategy_id) params.set('strategy_id', this.strategy_id);
    const r: any = await firstValueFrom(this.api.get(`/trades/fills?${params.toString()}`));
    this.items.set(r.items);
  }
  csvUrl() {
    const params = new URLSearchParams();
    if (this.symbol) params.set('symbol', this.symbol);
    if (this.exchange) params.set('exchange', this.exchange);
    if (this.category) params.set('category', this.category);
    if (this.strategy_id) params.set('strategy_id', this.strategy_id);
    return this.api.url(`/trades/realized.csv?${params.toString()}`);
  }
}
