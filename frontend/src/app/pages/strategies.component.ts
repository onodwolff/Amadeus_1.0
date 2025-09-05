import { Component } from '@angular/core';
import { ApiService } from '../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-strategies',
  template: `
  <h2>Strategies</h2>
  <button (click)="start()">Start sample_ema_crossover</button>
  <button (click)="stop()">Stop</button>
  `
})
export class StrategiesComponent {
  constructor(private api: ApiService) {}

  async start() {
    const cfg = { symbol: 'BTCUSDT', tf: '1m', fast: 9, slow: 21, qty: 0.001 };
    await this.api.startStrategy('sample_ema_crossover', cfg);
  }

  async stop() {
    await this.api.stopStrategy('sample_ema_crossover');
  }
}
