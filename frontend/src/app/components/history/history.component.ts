import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMaterialModule } from '../../app.module';
import { HistoryResponse, HistoryStats, OrderHistoryItem, TradeHistoryItem } from '../../models';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule, AppMaterialModule],
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss']
})
export class HistoryComponent {
    orders: OrderHistoryItem[] = [];
    trades: TradeHistoryItem[] = [];
    loadingO = false;
    loadingT = false;
    stats: HistoryStats = { orders: 0, trades: 0 };

    constructor() {}

    ngOnInit() {
        this.refreshAll();
    }

    refreshAll() {
        // history endpoints disabled
        this.orders = [];
        this.trades = [];
        this.stats = { orders: 0, trades: 0 };
    }

    refreshOrders() {
        this.loadingO = false;
    }

    refreshTrades() {
        this.loadingT = false;
    }

    export(kind: 'orders'|'trades') {
        // экспорт истории отключён
    }

    clear(kind: 'orders'|'trades'|'all') {
        // очистка истории отключена
    }
}
