import { Component, OnInit, ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { Subject, bufferTime } from 'rxjs';

@Component({
  selector: 'app-orderbook',
  standalone: true,
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      style="width: 100%; height: 420px;"
      class="ag-theme-quartz-dark"
      [gridOptions]="gridOptions"
      (gridReady)="onGridReady($event)">
    </ag-grid-angular>
  `,
  styles: [`:host{ display:block; }`]
})
export class OrderbookComponent implements OnInit {
  @ViewChild(AgGridAngular) grid!: AgGridAngular;
  private api!: GridApi;

  updates$ = new Subject<any>(); // сюда шлём апдейты строк: { side, price, size, total, maxSize }

  gridOptions: GridOptions = {
    columnDefs: [
      { headerName: 'Price', field: 'price', width: 110, valueFormatter: p => Number(p.value).toFixed(2) },
      { headerName: 'Size',  field: 'size',  width: 110, cellRenderer: this.sizeRenderer },
      { headerName: 'Total', field: 'total', width: 110 }
    ] as ColDef[],
    rowData: [],
    animateRows: false,
    getRowId: params => `${params.data?.side}-${params.data?.price}`
  };

  ngOnInit(): void {
    this.updates$.pipe(bufferTime(50)).subscribe(batch => {
      if (!batch.length || !this.api) return;
      this.api.applyTransactionAsync({ update: batch });
    });
  }

  onGridReady(params:any){ this.api = params.api; }

  sizeRenderer(params:any) {
    const size = Number(params.value) || 0;
    const max =  Number(params?.data?.maxSize) || Math.max(size, 1);
    const width = Math.max(0, Math.min(100, Math.round((size / max) * 100)));
    const colorKey = params?.data?.side === 'bid' ? '--buy' : '--sell';
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(colorKey).trim();
    const rgbMatch = raw.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    const [r, g, b] = rgbMatch
      ? rgbMatch.slice(1).map(Number)
      : [
          parseInt(raw.slice(1, 3), 16),
          parseInt(raw.slice(3, 5), 16),
          parseInt(raw.slice(5, 7), 16),
        ];
    const color = `rgba(${r}, ${g}, ${b}, 0.2)`; // adjust alpha as needed
    const el = document.createElement('div');
    el.style.position = 'relative';
    el.style.padding = '0 6px';
    el.textContent = String(size);
    el.style.background = `linear-gradient(to right, ${color} ${width}%, transparent ${width}%)`;
    return el;
  }
}
