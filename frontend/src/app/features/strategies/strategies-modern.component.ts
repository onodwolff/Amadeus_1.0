import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppMaterialModule } from '../../app.module';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-strategies-modern',
  imports: [CommonModule, RouterModule, AppMaterialModule],
  template: `
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold">Strategies</h2>
    <div class="flex gap-2">
      <button class="btn primary" title="Create new strategy (Ctrl+N)" (click)="create.emit()">New</button>
      <button class="btn" title="Import config JSON" (click)="importCfg.emit()">Import</button>
    </div>
  </div>
  <div class="grid lg:grid-cols-3 gap-3">
    <a class="card p-4 block" *ngFor="let s of items()" [routerLink]="['/strategies', s.id]">
      <div class="flex items-center justify-between">
        <div class="font-medium">{{ s.id }}</div>
        <span class="badge" [class.ok]="s.running" [class.err]="!s.running">{{ s.running ? 'running' : 'stopped' }}</span>
      </div>
      <div class="grid grid-cols-2 gap-1 text-xs mt-3" *ngIf="s.report">
        <div>Sharpe: {{ s.report.sharpe | number:'1.2-2' }}</div>
        <div>Sortino: {{ s.report.sortino | number:'1.2-2' }}</div>
        <div>Calmar: {{ s.report.calmar | number:'1.2-2' }}</div>
        <div>Max DD: {{ s.report.maxdd | percent:'1.0-2' }}</div>
        <div>Win Rate: {{ s.report.winrate | percent:'1.0-0' }}</div>
        <div>Profit Factor: {{ s.report.profit_factor | number:'1.2-2' }}</div>
        <div>CAGR: {{ s.report.cagr | percent:'1.2-2' }}</div>
        <div>PnL: {{ s.report.pnl_total | number:'1.2-2' }}</div>
      </div>
      <div class="mt-2 text-xs" *ngIf="s.fills?.length">
        <div class="font-medium">Last Fills</div>
        <div *ngFor="let f of s.fills">{{ f.side }} {{ f.qty }} @ {{ f.price }}</div>
      </div>
      <div class="text-xs text-red-600 mt-2" *ngIf="s.error">{{ s.error }}</div>
      <div class="flex items-center gap-3 mt-3">
        <button class="btn" title="Edit" (click)="edit.emit(s.id); $event.preventDefault(); $event.stopPropagation()">⚙</button>
        <button class="btn" title="Delete" (click)="remove.emit(s.id); $event.preventDefault(); $event.stopPropagation()">🗑</button>
        <button class="btn" title="Logs" (click)="$event.preventDefault(); $event.stopPropagation()">🧾</button>
      </div>
    </a>
  </div>
  `
})
export class StrategiesModernComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  @Output() create = new EventEmitter<void>();
  @Output() importCfg = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  items = signal<{id: string; running: boolean; report?: any; fills?: any[]; error?: string}[]>([]);
  exchange = 'binance';
  category = 'usdt';
  symbol = 'BTCUSDT';

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    try {
      const list = await this.api.listStrategies();
      await Promise.all(
        list.map(async (s: any) => {
          try {
            const res = await this.api.getStrategySummary(
              s.id,
              this.exchange,
              this.category,
              this.symbol,
            );
            s.report = res.report;
            s.fills = res.fills;
            s.error = null;
          } catch {
            s.report = null;
            s.fills = [];
            s.error = 'Data not available';
          }
        }),
      );
      this.items.set(list);
    } catch (err: any) {
      this.snack.open(`Failed to load strategies: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }
}
