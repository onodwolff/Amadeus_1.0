import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderHistoryItem, TradeHistoryItem } from '../models';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule],
    template: `
        <h1>History</h1>
        <p class="construction">Feature under construction</p>

        <div class="section">
            <h2>Orders</h2>
            <table class="tbl">
                <tr>
                    <th>Time</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Qty</th>
                </tr>
                <tr *ngFor="let o of orders">
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
            <table class="tbl">
                <tr>
                    <th>Time</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Qty</th>
                </tr>
                <tr *ngFor="let t of trades">
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

    constructor() {}

    ngOnInit() {
        // history endpoints disabled
    }

    loadOrders() {
        this.orders = [];
    }

    loadTrades() {
        this.trades = [];
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
}
