import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { forkJoin } from 'rxjs';
import { OrderHistoryItem, TradeHistoryItem, HistoryResponse } from '../models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>History</h1>
    <div class="card" style="padding:12px;margin-top:8px;">
      <table class="tbl">
        <thead>
          <tr>
            <th>Time</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Price</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of records">
            <td class="mono">{{ r.ts*1000 | date:'medium' }}</td>
            <td>{{ r.symbol }}</td>
            <td>{{ r.side }}</td>
            <td class="mono">{{ r.price }}</td>
            <td class="mono">{{ r.qty }}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:8px;">
        <button (click)="prev()" [disabled]="offset === 0">Prev</button>
        <button (click)="next()">Next</button>
      </div>
    </div>
  `
})
export class HistoryPage implements OnInit {
  records: (OrderHistoryItem | TradeHistoryItem)[] = [];
  limit = 20;
  offset = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    forkJoin({
      trades: this.api.historyTrades(this.limit, this.offset),
      orders: this.api.historyOrders(this.limit, this.offset)
    }).subscribe(({ trades, orders }: { trades: HistoryResponse<TradeHistoryItem>; orders: HistoryResponse<OrderHistoryItem> }) => {
      const t = trades?.items ?? [];
      const o = orders?.items ?? [];
      this.records = [...t, ...o].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    });
  }

  next() {
    this.offset += this.limit;
    this.load();
  }

  prev() {
    if (this.offset >= this.limit) {
      this.offset -= this.limit;
      this.load();
    }
  }
}
