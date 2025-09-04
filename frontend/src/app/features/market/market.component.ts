import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
} from 'lightweight-charts';

@Component({
  standalone: true,
  selector: 'app-market',
  imports: [CommonModule],
  template: `
  <div class="card">
    <div class="card-header flex items-center justify-between">
      <div>BTCUSDT • 1m</div>
      <div class="text-text-muted text-xs">Lightweight Charts v5</div>
    </div>
    <div class="card-body p-0">
      <div #chartContainer class="h-[420px]"></div>
    </div>
  </div>
  `
})
export class MarketComponent implements AfterViewInit {
  @ViewChild('chartContainer', { static: true }) container!: ElementRef<HTMLDivElement>;
  private chart!: IChartApi;
  private series!: ISeriesApi<'Candlestick'>;

  ngAfterViewInit() {
    this.chart = createChart(this.container.nativeElement, {
      layout: { background: { type: ColorType.Solid, color: '#0b0e11' }, textColor: '#e6e8eb' },
      grid:   { vertLines: { color: '#1d232a' }, horzLines: { color: '#1d232a' } },
      timeScale: { borderColor: '#1d232a' },
      rightPriceScale: { borderColor: '#1d232a' }
    });

    this.series = this.chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      borderVisible: false
    });

    const data: CandlestickData<UTCTimestamp>[] = [
      { time: 1700000000 as UTCTimestamp, open: 49900, high: 50100, low: 49800, close: 50000 },
      { time: 1700000600 as UTCTimestamp, open: 50000, high: 50200, low: 49950, close: 50120 },
      { time: 1700001200 as UTCTimestamp, open: 50120, high: 50300, low: 50000, close: 50040 },
    ];
    this.series.setData(data);
  }
}
