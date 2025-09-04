import { Component } from '@angular/core';
import { TvLiteChartComponent } from './tv-lite-chart.component';
import { OrderbookComponent } from './orderbook.component';
import { TradesVirtualComponent } from './trades-virtual.component';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [TvLiteChartComponent, OrderbookComponent, TradesVirtualComponent],
  templateUrl: './market.page.html',
  styleUrls: ['./market.page.scss']
})
export class MarketPage {}
