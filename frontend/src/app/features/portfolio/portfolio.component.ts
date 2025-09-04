import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { WsService } from '../../core/services/ws.service';

@Component({
  standalone: true,
  selector: 'app-portfolio',
  imports: [CommonModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Portfolio</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-medium mb-2">Balances</h3>
        <table class="min-w-full text-sm">
          <thead><tr class="text-left text-gray-500"><th>Asset</th><th>Free</th><th>Locked</th></tr></thead>
          <tbody>
            @for (b of balances(); track b.id) {
              <tr class="border-t"><td>{{ b.asset }}</td><td>{{ b.free }}</td><td>{{ b.locked }}</td></tr>
            }
          </tbody>
        </table>
      </div>
      <div>
        <h3 class="font-medium mb-2">Positions</h3>
        <table class="min-w-full text-sm">
          <thead><tr class="text-left text-gray-500"><th>Symbol</th><th>Qty</th><th>Avg Price</th></tr></thead>
          <tbody>
            @for (p of positions(); track p.id) {
              <tr class="border-t"><td>{{ p.symbol }}</td><td>{{ p.qty }}</td><td>{{ p.avg_price }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-8">
      <h3 class="font-medium mb-2">Live fills</h3>
      <div class="border rounded p-2 h-60 overflow-auto text-sm">
        @for (f of liveFills(); track f.ts) {
          <div>[{{ f.exchange }}] {{ f.symbol }} {{ f.side }} {{ f.qty }} @ {{ f.price }} <span class="text-gray-500">{{ f.ts }}</span></div>
        }
      </div>
    </div>
  </div>
  `
})
export class PortfolioComponent {
  api = inject(ApiService);
  ws = inject(WsService);
  balances = signal<any[]>([]);
  positions = signal<any[]>([]);
  liveFills = signal<any[]>([]);

  async ngOnInit() {
    this.balances.set(await this.api.getBalances());
    this.positions.set(await this.api.getPositions());
    const base = (window as any).__WS__ || 'ws://localhost:8000/api/portfolio/ws';
    this.ws.subscribe(`${base}/fills`, (m) => {
      if (m?.type === 'fill') {
        this.liveFills.update(arr => (arr.length>200? arr.slice(-200):arr).concat(m));
      }
    });
  }
}
