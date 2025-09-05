import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';

@Component({
  standalone: true,
  selector: 'page-dashboard',
  imports: [CommonModule],
  template: `
    <div class="grid gap-4 lg:grid-cols-4">
      <div class="card p-4"><div class="text-xs text-[#9aa4ad]">Equity</div><div class="text-2xl font-semibold">$ {{ equity() | number:'1.0-0' }}</div></div>
      <div class="card p-4"><div class="text-xs text-[#9aa4ad]">PNL (today)</div><div class="text-2xl" [class.price-up]="pnl()>0" [class.price-down]="pnl()<0">{{ pnl() | number:'1.2-2' }}</div></div>
      <div class="card p-4"><div class="text-xs text-[#9aa4ad]">Strategies</div><div class="text-2xl">{{ strategies() }}</div></div>
      <div class="card p-4"><div class="text-xs text-[#9aa4ad]">Open orders</div><div class="text-2xl">{{ orders() }}</div></div>
    </div>
    `
  })
  export class DashboardPageComponent {
    equity = signal(0);
    pnl = signal(0);
    strategies = signal(0);
    orders = signal(0);

    constructor(private api: ApiService) {
      this.api.status().subscribe();
      this.loadSummary();
    }

    private async loadSummary() {
      try {
        const summary: any = await this.api.getDashboardSummary();
        this.equity.set(Number(summary?.equity ?? 0));
        this.pnl.set(Number(summary?.pnl ?? 0));
        this.strategies.set(Number(summary?.strategies ?? 0));
        this.orders.set(Number(summary?.orders ?? 0));
      } catch (err) {
        console.error('Failed to load dashboard summary', err);
      }
    }
  }
