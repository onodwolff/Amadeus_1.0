
import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { createChart, ISeriesApi, CandlestickData } from 'lightweight-charts';

@Component({
  selector: 'app-tv-lite-chart',
  standalone: true,
  template: `<div #host class="chart-host"></div>`,
  styles: [`.chart-host{ width:100%; height:100%; min-height:380px; }`]
})
export class TvLiteChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', {static:true}) host!: ElementRef<HTMLDivElement>;
  @Input() seriesData: CandlestickData[] = [];

  private chart: any;
  private series!: ISeriesApi<'Candlestick'>;
  private resizeObs?: ResizeObserver;

  constructor(private zone:NgZone) {}

  ngAfterViewInit(): void {
    const css = getComputedStyle(document.documentElement);
    this.chart = createChart(this.host.nativeElement, {
      layout: {
        // для lightweight-charts v4 используем простую форму background:{ color }
        background: { color: css.getPropertyValue('--bg-1').trim() },
        textColor: css.getPropertyValue('--text-1').trim()
      },
      grid: {
        vertLines: { color: css.getPropertyValue('--gridline').trim() },
        horzLines: { color: css.getPropertyValue('--gridline').trim() }
      },
      rightPriceScale: { borderColor: css.getPropertyValue('--gridline').trim() },
      timeScale: { borderColor: css.getPropertyValue('--gridline').trim() }
    });
    this.series = this.chart.addCandlestickSeries({
      upColor: getComputedStyle(document.documentElement).getPropertyValue('--buy').trim(),
      downColor: getComputedStyle(document.documentElement).getPropertyValue('--sell').trim(),
      wickUpColor: getComputedStyle(document.documentElement).getPropertyValue('--buy').trim(),
      wickDownColor: getComputedStyle(document.documentElement).getPropertyValue('--sell').trim(),
      borderVisible:false
    });
    if (this.seriesData?.length) this.series.setData(this.seriesData);

    this.zone.runOutsideAngular(() => {
      this.resizeObs = new ResizeObserver(() => this.chart.applyOptions({ width: this.host.nativeElement.clientWidth, height: this.host.nativeElement.clientHeight }));
      this.resizeObs.observe(this.host.nativeElement);
      this.chart.applyOptions({ width: this.host.nativeElement.clientWidth, height: this.host.nativeElement.clientHeight });
    });
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    this.chart?.remove();
  }
}
