import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-strategies-modern',
  imports: [CommonModule],
  template: `
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold">Strategies</h2>
    <div class="flex gap-2">
      <button class="btn primary" title="Create new strategy (Ctrl+N)">New</button>
      <button class="btn" title="Import config JSON">Import</button>
    </div>
  </div>
  <div class="grid lg:grid-cols-3 gap-3">
    <div class="card p-4" *ngFor="let s of items()">
      <div class="flex items-center justify-between">
        <div class="font-medium">{{ s.name }}</div>
        <span class="badge" [class.ok]="s.running" [class.err]="!s.running">{{ s.running ? 'running' : 'stopped' }}</span>
      </div>
      <div class="text-[#9aa4ad] text-xs mt-1">{{ s.symbol }} • {{ s.exchange }}/{{ s.category }}</div>
      <div class="flex items-center gap-3 mt-3">
        <button class="btn" title="Start">▶</button>
        <button class="btn" title="Stop">⏸</button>
        <button class="btn" title="Edit config">⚙</button>
        <button class="btn" title="Logs">🧾</button>
      </div>
    </div>
  </div>
  `
})
export class StrategiesModernComponent {
  items = signal([
    { name: 'sample_ema_crossover', symbol:'BTCUSDT', exchange:'binance', category:'usdt', running: true },
    { name: 'mean_reversion', symbol:'ETHUSDT', exchange:'bybit', category:'linear', running: false },
    { name: 'breakout', symbol:'SOLUSDT', exchange:'okx', category:'usdt', running: false },
  ]);
}
