import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// ApiService removed until backend supports dashboard

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

    constructor() {
      // dashboard summary not available
    }
  }
