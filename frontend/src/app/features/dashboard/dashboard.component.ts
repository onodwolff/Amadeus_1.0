import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class DashboardComponent {
  equity = signal(125000); delta = signal(2.35); pnl = signal(1432.12); sharpe = signal(1.82);
  strategies = signal(3); openOrders = signal(12); fillRatio = signal(0.73);
}
