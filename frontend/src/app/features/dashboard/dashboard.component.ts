import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
  <div class="grid gap-4 lg:grid-cols-4">
    <div class="kpi"><div class="text-text-muted text-xs">Equity</div><div class="value">$ {{ equity() | number:'1.0-0' }}</div><div class="delta up">+{{ delta() | number:'1.2-2' }}%</div></div>
    <div class="kpi"><div class="text-text-muted text-xs">PNL (today)</div><div class="value" [class.price-up]="pnl()>0" [class.price-down]="pnl()<0">{{ pnl() | number:'1.2-2' }}</div><div class="text-text-muted text-xs">Sharpe {{ sharpe() | number:'1.2-2' }}</div></div>
    <div class="kpi"><div class="text-text-muted text-xs">Active strategies</div><div class="value">{{ strategies() }}</div><div class="text-text-muted text-xs">Running now</div></div>
    <div class="kpi"><div class="text-text-muted text-xs">Open orders</div><div class="value">{{ openOrders() }}</div><div class="text-text-muted text-xs">Fill ratio {{ fillRatio() | percent:'1.0-0' }}</div></div>
  </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  equity = signal(0);
  delta = signal(0);
  pnl = signal(0);
  sharpe = signal(0);
  strategies = signal(0);
  openOrders = signal(0);
  fillRatio = signal(0);

  async ngOnInit() {
    let summary: any = {};
    try {
      summary = await this.api.getDashboardSummary();
    } catch {
      summary = {};
    }
    let status: any = {};
    try {
      status = await this.api.status();
    } catch {
      status = {};
    }
    const metrics = { ...summary, ...(status?.metrics || {}) };
    this.equity.set(metrics.equity || 0);
    this.delta.set(metrics.delta || 0);
    this.pnl.set(metrics.pnl || 0);
    this.sharpe.set(metrics.sharpe || 0);
    this.strategies.set(metrics.strategies || metrics.strategy_count || 0);
    this.openOrders.set(metrics.openOrders || metrics.open_orders || 0);
    this.fillRatio.set(metrics.fillRatio || metrics.fill_ratio || 0);
  }
}
