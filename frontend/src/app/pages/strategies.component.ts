import { Component } from '@angular/core';
import { ApiService } from '../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-strategies',
  template: `
  <h2>Strategies</h2>
  <button (click)="start()">Start sample_ema</button>
  <button (click)="stop()">Stop</button>
  `
})
export class StrategiesComponent {
  constructor(private api: ApiService) {}

  start() {
    const body = {
      strategy: 'sample_ema',
      config: { symbol: 'BTCUSDT', tf: '1m', fast: 9, slow: 21, qty: 0.001 }
    };
    this.api.start(body).subscribe();
  }

  stop() {
    this.api.stop().subscribe();
  }
}
