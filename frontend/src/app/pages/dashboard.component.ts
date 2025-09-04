import { Component, signal, effect } from '@angular/core';

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
  async ngOnInit(){ await this.refresh(); }
  async refresh(){
    const res = await fetch('http://localhost:8100/api/status');
    this.status.set(await res.json());
  }
}
