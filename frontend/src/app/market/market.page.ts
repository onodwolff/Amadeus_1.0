import { Component } from '@angular/core';
import { TvLiteChartComponent } from './tv-lite-chart.component';
import { OrderbookComponent } from './orderbook.component';
import { TradesVirtualComponent } from './trades-virtual.component';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [TvLiteChartComponent, OrderbookComponent, TradesVirtualComponent, CardModule],
  templateUrl: './market.page.html',
  styleUrls: ['./market.page.scss']
})
export class MarketPage {}
