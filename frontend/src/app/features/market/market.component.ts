import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WsService } from '../../core/services/ws.service';
import { MarketStore } from '../../core/state/market.store';

@Component({
  standalone: true,
  selector: 'app-market',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4 grid gap-4">
    <div class="flex gap-3 items-end">
      <div>
        <label class="block text-sm mb-1">Exchange</label>
        <select class="border rounded p-2" [(ngModel)]="exchange">
          <option value="mock">mock</option>
          <option value="bybit">bybit</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Category</label>
        <select class="border rounded p-2" [(ngModel)]="category">
          <option value="spot">spot</option>
          <option value="linear">linear</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Symbol</label>
        <input class="border rounded p-2" [(ngModel)]="symbol">
      </div>
      <button class="px-3 py-2 rounded bg-black text-white" (click)="reconnect()">Connect</button>
    </div>

    <h2 class="text-xl font-semibold">Market — {{symbol}}</h2>

    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <h3 class="font-medium mb-2">Order Book (L2)</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <div class="text-sm text-gray-500 mb-1">Bids</div>
            <div class="border rounded p-2 h-80 overflow-auto">
              @for (b of (book()?.bids ?? []); track b) {
                <div class="flex justify-between text-emerald-600 text-sm">
                  <span>{{ b.price }}</span><span>{{ b.size }}</span>
                </div>
              }
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500 mb-1">Asks</div>
            <div class="border rounded p-2 h-80 overflow-auto">
              @for (a of (book()?.asks ?? []); track a) {
                <div class="flex justify-between text-rose-600 text-sm">
                  <span>{{ a.price }}</span><span>{{ a.size }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="font-medium mb-2">Trade tape</h3>
        <div class="border rounded p-2 h-80 overflow-auto">
          @for (t of trades(); track t.ts) {
            <div class="flex justify-between text-sm" [class.text-emerald-600]="t.side==='buy'" [class.text-rose-600]="t.side==='sell'">
              <span>{{ t.price }}</span><span>{{ t.size }}</span><span class="text-gray-500">{{ t.ts }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  </div>`,
})
export class MarketComponent {
  ws = inject(WsService);
  store = inject(MarketStore);
  symbol = 'BTCUSDT';
  exchange = 'mock';
  category = 'spot';

  book = this.store.book;
  trades = this.store.trades;

  reconnect() {
    const base = (window as any).__WS__ || 'ws://localhost:8000/api/market/ws';
    // subscribe to book
    this.ws.subscribe(`${base}/book?exchange=${this.exchange}&category=${this.category}&symbol=${encodeURIComponent(this.symbol)}`, (m) => {
      if (m?.type === 'book') this.store.pushBook(m);
    });
    // subscribe to trades
    this.ws.subscribe(`${base}/trades?exchange=${this.exchange}&category=${this.category}&symbol=${encodeURIComponent(this.symbol)}`, (m) => {
      if (m?.type === 'trade') this.store.pushTrade(m);
    });
  }

  constructor() {
    this.reconnect();
  }
}
