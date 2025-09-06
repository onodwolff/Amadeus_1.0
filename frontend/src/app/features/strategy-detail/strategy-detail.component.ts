import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-strategy-detail',
  imports: [CommonModule, PrimeNgModule],
  template: `
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Strategy: {{ sid }}</h2>
      <p-button label="Download CSV" [link]="true" [href]="csvUrl()" target="_blank" severity="secondary"></p-button>
    </div>
    @if (error()) {
      <div class="mt-4 flex items-center gap-2">
        <div class="text-yellow-600">{{ error() }}</div>
        <p-button label="Retry" (onClick)="load()" severity="primary"></p-button>
      </div>
    }
    <div class="grid md:grid-cols-2 gap-6 mt-4">
      <div>
        <h3 class="font-medium mb-2">Metrics</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="border rounded p-3"><div class="text-gray-500">Sharpe</div><div class="text-lg font-bold">{{ rep()?.sharpe | number:'1.2-2' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">Sortino</div><div class="text-lg font-bold">{{ rep()?.sortino | number:'1.2-2' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">Calmar</div><div class="text-lg font-bold">{{ rep()?.calmar | number:'1.2-2' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">Max DD</div><div class="text-lg font-bold">{{ rep()?.maxdd | percent:'1.2-2' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">Win Rate</div><div class="text-lg font-bold">{{ rep()?.winrate | percent:'1.0-0' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">Profit Factor</div><div class="text-lg font-bold">{{ rep()?.profit_factor | number:'1.2-2' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">CAGR</div><div class="text-lg font-bold">{{ rep()?.cagr | percent:'1.2-2' }}</div></div>
          <div class="border rounded p-3 col-span-2"><div class="text-gray-500">Realized PnL (net)</div><div class="text-lg font-bold">{{ rep()?.pnl_total | number:'1.2-2' }}</div></div>
        </div>
        <div class="mt-4 border rounded p-3">
          <div class="font-medium mb-2">Last Fills</div>
          <p-table [value]="fills()" class="w-full text-sm">
            <ng-template pTemplate="header">
              <tr class="text-left"><th>Time</th><th>Side</th><th>Qty</th><th>Price</th></tr>
            </ng-template>
            <ng-template pTemplate="body" let-f>
              <tr><td>{{ f.ts }}</td><td>{{ f.side }}</td><td>{{ f.qty }}</td><td>{{ f.price }}</td></tr>
            </ng-template>
          </p-table>
        </div>
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
export class StrategyDetailComponent {
  route = inject(ActivatedRoute);
  api = inject(ApiService);
  rep = signal<any>({});
  fills = signal<any[]>([]);
  error = signal<string | null>(null);
  sid = '';
  exchange = 'binance'; category='usdt'; symbol='BTCUSDT';

  ngOnInit() {
    this.sid = this.route.snapshot.params['sid'];
    this.load();
  }

  async load() {
    this.error.set(null);
    try {
      const [repRes, fillRes] = await Promise.all([
        this.api.getStrategyReport(
          this.sid,
          this.exchange,
          this.category,
          this.symbol,
        ),
        this.api.getStrategyFills(
          this.sid,
          this.exchange,
          this.category,
          this.symbol,
        ),
      ]);
      this.rep.set(repRes.report || {});
      this.fills.set(fillRes.items || []);
    } catch (e) {
      console.error('Failed to load strategy data', e);
      this.error.set('Data not available');
      this.rep.set({});
      this.fills.set([]);
    }
  }

  csvUrl() {
    return this.api.url(`/strategy/${this.sid}/trades.csv?exchange=${this.exchange}&category=${this.category}&symbol=${this.symbol}`);
  }

  points() {
    const e = this.rep()?.equity || [];
    if (!e.length) return '';
    const xs = e.map((p:any)=>p.ts);
    const ys = e.map((p:any)=>p.equity);
    const minx = Math.min(...xs), maxx = Math.max(...xs);
    const miny = Math.min(...ys), maxy = Math.max(...ys);
    return e.map((p:any)=>{
      const x = 10 + 380*((p.ts - minx)/Math.max(1,(maxx-minx)));
      const y = 190 - 180*((p.equity - miny)/Math.max(1,(maxy-miny)));
      return `${Math.round(x)},${Math.round(y)}`;
    }).join(' ');
  }
}
