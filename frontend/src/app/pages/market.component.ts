import { Component } from '@angular/core';
@Component({
  standalone: true,
  selector: 'app-market',
  template: `
  <h2>Market (Mock)</h2>
  <p>Connects to /ws for realtime events (book/trade) — minimal stub.</p>
  `
})
export class MarketViewComponent {}
