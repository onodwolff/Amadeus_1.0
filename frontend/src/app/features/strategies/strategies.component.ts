import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-strategies',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Strategies</h2>
      <button class="px-3 py-2 rounded bg-black text-white" (click)="openCreate=true">Create</button>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      @for (s of list(); track s.id) {
        <a class="block border rounded p-4 hover:shadow transition" [routerLink]="['/strategies', s.id]">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">{{ s.id }}</div>
            <span class="text-xs px-2 py-1 rounded" [class.bg-emerald-100]="s.running" [class.bg-gray-100]="!s.running">
              {{ s.running ? 'running' : 'stopped' }}
            </span>
          </div>
          <div class="text-sm text-gray-600">Equity: {{ s.equity ?? '-' }}</div>
        </a>
      }
    </div>

    <div *ngIf="openCreate" class="fixed inset-0 bg-black/50 grid place-items-center">
      <div class="bg-white rounded p-4 w-[600px] max-w-[95vw]">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">Create Strategy</div>
          <button class="text-sm" (click)="openCreate=false">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Strategy</label>
            <select class="border rounded p-2 w-full" [(ngModel)]="sid">
              <option value="sample_ema_crossover">sample_ema_crossover</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Symbol</label>
            <input class="border rounded p-2 w-full" [(ngModel)]="cfg.symbol">
          </div>
          <div>
            <label class="block text-sm mb-1">Exchange</label>
            <select class="border rounded p-2 w-full" [(ngModel)]="cfg.exchange">
              <option value="binance">binance</option>
              <option value="bybit">bybit</option>
              <option value="mock">mock</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Category</label>
            <select class="border rounded p-2 w-full" [(ngModel)]="cfg.category">
              <option value="usdt">usdt</option>
              <option value="spot">spot</option>
              <option value="linear">linear</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Qty</label>
            <input type="number" class="border rounded p-2 w-full" [(ngModel)]="cfg.qty">
          </div>
          <div class="col-span-2 mt-2">
            <button class="px-3 py-2 rounded bg-black text-white" (click)="create()">Create & Start</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class StrategiesComponent {
  openCreate = false;
  list = signal<{id:string;running:boolean;equity?:number}[]>([]);
  sid = 'sample_ema_crossover';
  cfg: any = { symbol: 'BTCUSDT', exchange: 'binance', category: 'usdt', qty: 0.01 };

  async ngOnInit() {
    await this.refresh();
  }
  async refresh() {
    const base = (window as any).__API__ || 'http://localhost:8000/api';
    const a = await fetch(`${base}/strategies`).then(r=>r.json());
    const d = await fetch(`${base}/dashboard/summary/strategies`).then(r=>r.json()).catch(()=>({items:[]}));
    const eqMap = new Map(d.items?.map((x:any)=>[x.strategy_id, x.equity]) || []);
    this.list.set(a.map((x:any)=>({ ...x, equity: eqMap.get(x.id) })));
  }
  async create() {
    const base = (window as any).__API__ || 'http://localhost:8000/api';
    await fetch(`${base}/strategies/${this.sid}/start`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(this.cfg) });
    this.openCreate = false;
    await this.refresh();
  }
}
