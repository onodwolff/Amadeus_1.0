import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderHistoryItem, TradeHistoryItem } from '../models';
import { ApiService } from '../core/services/api.service';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <h1>History</h1>
        <div class="section">
            <h2>Orders</h2>
            <div class="filters">
                <input [(ngModel)]="orderSymbol" placeholder="Symbol" />
                <select [(ngModel)]="orderSide">
                    <option value="">All Sides</option>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
            </div>
            <table class="tbl">
                <tr>
                    <th>Time</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Qty</th>
                </tr>
                <tr *ngFor="let o of filteredOrders">
                    <td>{{ o.ts * 1000 | date:'medium' }}</td>
                    <td>{{ o.symbol }}</td>
                    <td>{{ o.side }}</td>
                    <td>{{ o.price }}</td>
                    <td>{{ o.qty }}</td>
                </tr>
            </table>
            <div class="pager">
                <button (click)="prevOrders()" [disabled]="orderOffset === 0">Prev</button>
                <button (click)="nextOrders()" [disabled]="orders.length < limit">Next</button>
            </div>
        </div>

        <div class="section">
            <h2>Trades</h2>
            <div class="filters">
                <input [(ngModel)]="tradeSymbol" placeholder="Symbol" />
                <select [(ngModel)]="tradeSide">
                    <option value="">All Sides</option>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
            </div>
            <table class="tbl">
                <tr>
                    <th>Time</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Qty</th>
                </tr>
                <tr *ngFor="let t of filteredTrades">
                    <td>{{ t.ts * 1000 | date:'medium' }}</td>
                    <td>{{ t.symbol }}</td>
                    <td>{{ t.side }}</td>
                    <td>{{ t.price }}</td>
                    <td>{{ t.qty }}</td>
                </tr>
            </table>
            <div class="pager">
                <button (click)="prevTrades()" [disabled]="tradeOffset === 0">Prev</button>
                <button (click)="nextTrades()" [disabled]="trades.length < limit">Next</button>
            </div>
        </div>
    `
})
export class HistoryPage implements OnInit {
    limit = 20;
    orderOffset = 0;
    tradeOffset = 0;
    orders: OrderHistoryItem[] = [];
    trades: TradeHistoryItem[] = [];
    orderSymbol = '';
    orderSide = '';
    tradeSymbol = '';
    tradeSide = '';

    constructor(private api: ApiService) {}

    ngOnInit() {
        this.loadOrders();
        this.loadTrades();
    }

    loadOrders() {
        this.api
            .historyOrders(this.limit, this.orderOffset)
            .then((res) => (this.orders = res.items ?? []));
    }

    loadTrades() {
        this.api
            .historyTrades(this.limit, this.tradeOffset)
            .then((res) => (this.trades = res.items ?? []));
    }

    nextOrders() {
        this.orderOffset += this.limit;
        this.loadOrders();
    }

    prevOrders() {
        this.orderOffset = Math.max(0, this.orderOffset - this.limit);
        this.loadOrders();
    }

    nextTrades() {
        this.tradeOffset += this.limit;
        this.loadTrades();
    }

    prevTrades() {
        this.tradeOffset = Math.max(0, this.tradeOffset - this.limit);
        this.loadTrades();
    }

    get filteredOrders(): OrderHistoryItem[] {
        const sym = this.orderSymbol.toLowerCase();
        const side = this.orderSide.toLowerCase();
        return this.orders.filter(o =>
            (!sym || o.symbol.toLowerCase().includes(sym)) &&
            (!side || o.side.toLowerCase() === side)
        );
    }

    get filteredTrades(): TradeHistoryItem[] {
        const sym = this.tradeSymbol.toLowerCase();
        const side = this.tradeSide.toLowerCase();
        return this.trades.filter(t =>
            (!sym || t.symbol.toLowerCase().includes(sym)) &&
            (!side || t.side.toLowerCase() === side)
        );
    }
}
