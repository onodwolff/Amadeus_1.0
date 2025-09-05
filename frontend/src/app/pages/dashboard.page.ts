import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <h1>Dashboard</h1>
    <div class="card" style="padding:12px;margin-top:8px;">
      <p>Сводные метрики (PnL, позиции, алерты).</p>
    </div>
  `
})
export class DashboardPage {}
