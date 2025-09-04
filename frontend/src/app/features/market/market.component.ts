import { AfterViewInit, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createChart, ISeriesApi, ColorType } from 'lightweight-charts';
@Component({
  standalone: true, selector: 'app-market', imports: [CommonModule],
  template: `
  <div class="card"><div class="card-header">BTCUSDT • 1m</div><div class="card-body p-0"><div #chartContainer class="h-[420px]"></div></div></div>`
})
export class MarketComponent implements AfterViewInit {
  @ViewChild('chartContainer', { static: true }) container!: ElementRef<HTMLDivElement>;
  series!: ISeriesApi<'Candlestick'>;
  ngAfterViewInit() {
    const chart = createChart(this.container.nativeElement, { layout:{ background:{ type: ColorType.Solid, color:'#0b0e11' }, textColor:'#e6e8eb' }, grid:{ vertLines:{ color:'#1d232a' }, horzLines:{ color:'#1d232a' } }, timeScale:{ borderColor:'#1d232a' }, rightPriceScale:{ borderColor:'#1d232a' } });
    this.series = chart.addCandlestickSeries({ upColor:'#22c55e', downColor:'#ef4444', borderVisible:false, wickUpColor:'#22c55e', wickDownColor:'#ef4444' });
    this.series.setData([{ time:1, open:49900, high:50100, low:49800, close:50000 },{ time:2, open:50000, high:50200, low:49950, close:50120 },{ time:3, open:50120, high:50300, low:50000, close:50040 }]);
  }
}
