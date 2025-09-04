import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-strategy-detail',
  imports: [CommonModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Strategy: {{ sid }}</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-medium mb-2">Metrics</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="border rounded p-3"><div class="text-gray-500">Sharpe</div><div class="text-lg font-bold">{{ report()?.sharpe | number:'1.2-2' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">Calmar</div><div class="text-lg font-bold">{{ report()?.calmar | number:'1.2-2' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">Max DD</div><div class="text-lg font-bold">{{ report()?.maxdd | percent:'1.2-2' }}</div></div>
          <div class="border rounded p-3"><div class="text-gray-500">Win Rate</div><div class="text-lg font-bold">{{ report()?.winrate | percent:'1.0-0' }}</div></div>
          <div class="border rounded p-3 col-span-2"><div class="text-gray-500">Realized PnL</div><div class="text-lg font-bold">{{ report()?.pnl_total | number:'1.2-2' }}</div></div>
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
  report = signal<any>({});
  sid = '';
  exchange = 'binance'; category='usdt'; symbol='BTCUSDT';

  async ngOnInit() {
    this.sid = this.route.snapshot.params['sid'];
    const base = (window as any).__API__ || 'http://localhost:8000/api';
    const url = `${base}/strategy/${this.sid}/report?exchange=${this.exchange}&category=${this.category}&symbol=${this.symbol}`;
    this.report.set(await fetch(url).then(r=>r.json()).then(j=>j.report));
  }

  points() {
    const e = this.report()?.equity || [];
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
