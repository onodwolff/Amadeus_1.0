import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderHistoryItem, TradeHistoryItem } from '../models';
import { ApiService } from '../core/services/api.service';
import { PrimeNgModule } from '../prime-ng.module';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule, FormsModule, PrimeNgModule],
    template: `
        <h1>History</h1>
        <div class="section">
            <h2>Orders</h2>
            <div class="filters">
                <input pInputText [(ngModel)]="orderSymbol" placeholder="Symbol" />
                <p-dropdown [(ngModel)]="orderSide" [options]="sideOptions"></p-dropdown>
            </div>
            <p-table [value]="filteredOrders" class="tbl">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Time</th>
                        <th>Symbol</th>
                        <th>Side</th>
                        <th>Price</th>
                        <th>Qty</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-o>
                    <tr>
                        <td>{{ o.ts * 1000 | date:'medium' }}</td>
                        <td>{{ o.symbol }}</td>
                        <td>{{ o.side }}</td>
                        <td>{{ o.price }}</td>
                        <td>{{ o.qty }}</td>
                    </tr>
                </ng-template>
            </p-table>
            <div class="pager">
                <p-button label="Prev" (onClick)="prevOrders()" [disabled]="orderOffset === 0"></p-button>
                <p-button label="Next" (onClick)="nextOrders()" [disabled]="orders.length < limit"></p-button>
            </div>
        </div>

        <div class="section">
            <h2>Trades</h2>
            <div class="filters">
                <input pInputText [(ngModel)]="tradeSymbol" placeholder="Symbol" />
                <p-dropdown [(ngModel)]="tradeSide" [options]="sideOptions"></p-dropdown>
            </div>
            <p-table [value]="filteredTrades" class="tbl">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Time</th>
                        <th>Symbol</th>
                        <th>Side</th>
                        <th>Price</th>
                        <th>Qty</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-t>
                    <tr>
                        <td>{{ t.ts * 1000 | date:'medium' }}</td>
                        <td>{{ t.symbol }}</td>
                        <td>{{ t.side }}</td>
                        <td>{{ t.price }}</td>
                        <td>{{ t.qty }}</td>
                    </tr>
                </ng-template>
            </p-table>
            <div class="pager">
                <p-button label="Prev" (onClick)="prevTrades()" [disabled]="tradeOffset === 0"></p-button>
                <p-button label="Next" (onClick)="nextTrades()" [disabled]="trades.length < limit"></p-button>
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
    sideOptions = [
        { label: 'All Sides', value: '' },
        { label: 'Buy', value: 'buy' },
        { label: 'Sell', value: 'sell' },
    ];

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
