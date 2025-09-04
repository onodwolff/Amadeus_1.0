import { Component, signal } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  template: `
  <h2>Dashboard</h2>
  <div>Status: {{status()?.started ? 'RUNNING' : 'STOPPED'}}</div>
  <div>Mode: {{status()?.mode}}</div>
  <div>Exchange: {{status()?.exchange}}</div>
  <div>Strategy: {{status()?.strategy || '-'}}</div>
  <button (click)="refresh()">Refresh</button>
  `
})
export class DashboardComponent {
  status = signal<any>({});

  constructor(private api: ApiService) {
    this.refresh();
  }

  refresh() {
    this.api.status().subscribe(res => this.status.set(res));
  }
}
