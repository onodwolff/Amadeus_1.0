import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-strategies',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Strategies</h2>

    <div class="grid grid-cols-5 gap-3 mb-4 items-end">
      <div>
        <label class="block text-sm mb-1">Exchange</label>
        <select class="border rounded p-2" [(ngModel)]="cfg.exchange">
          <option value="mock">mock</option>
          <option value="bybit">bybit</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Category</label>
        <select class="border rounded p-2" [(ngModel)]="cfg.category">
          <option value="spot">spot</option>
          <option value="linear">linear</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Symbol</label>
        <input class="border rounded p-2 w-full" [(ngModel)]="cfg.symbol">
      </div>
      <div>
        <label class="block text-sm mb-1">Short</label>
        <input type="number" class="border rounded p-2 w-full" [(ngModel)]="cfg.short">
      </div>
      <div>
        <label class="block text-sm mb-1">Long</label>
        <input type="number" class="border rounded p-2 w-full" [(ngModel)]="cfg.long">
      </div>
    </div>

    <div class="grid grid-cols-5 gap-3 mb-4 items-end">
      <div>
        <label class="block text-sm mb-1">Qty</label>
        <input type="number" class="border rounded p-2 w-full" [(ngModel)]="cfg.qty" step="0.001">
      </div>
      <div class="col-span-4">
        <button class="px-3 py-2 rounded bg-black text-white" (click)="start()">Start (Paper)</button>
        <button class="px-3 py-2 rounded border ml-2" (click)="stop()">Stop</button>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="font-medium mb-2">Available</h3>
      <ul class="list-disc pl-5">
        @for (s of strategies(); track s.id) {
          <li>{{ s.id }} — {{ s.running ? 'running' : 'stopped' }}</li>
        }
      </ul>
    </div>
  </div>
  `
})
export class StrategiesComponent {
  api = inject(ApiService);
  strategies = signal<{id:string; running:boolean}[]>([]);
  cfg: any = { exchange:'mock', category:'spot', symbol: 'BTCUSDT', short: 12, long: 26, qty: 0.01 };

  async ngOnInit() {
    this.strategies.set(await this.api.listStrategies());
  }
  async start() {
    await this.api.startStrategy('sample_ema_crossover', this.cfg);
    this.strategies.set(await this.api.listStrategies());
  }
  async stop() {
    await this.api.stopStrategy('sample_ema_crossover');
    this.strategies.set(await this.api.listStrategies());
  }
}
