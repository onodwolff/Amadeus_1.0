import { Component } from '@angular/core';

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
  async start(){
    await fetch('http://localhost:8100/api/bot/start', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({strategy:'sample_ema', config:{symbol:'BTCUSDT', tf:'1m', fast:9, slow:21, qty:0.001}})
    });
  }
  async stop(){
    await fetch('http://localhost:8100/api/bot/stop', {method:'POST'});
  }
}
