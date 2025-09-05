import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WsService } from '../core/services/ws.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Logs</h1>
    <div class="status" style="margin-top:8px;display:flex;align-items:center;gap:8px;">
      <span>Connection: {{ status }}</span>
      <button *ngIf="status !== 'connected'" type="button" (click)="retry()">Retry</button>
    </div>
    <div class="card" style="padding:12px;margin-top:8px;">
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input [(ngModel)]="filter" placeholder="Filter"/>
        <button type="button" (click)="clear()">Clear</button>
      </div>
      <pre #pane style="max-height:400px;overflow:auto;">{{ filtered.join('\n') }}</pre>
    </div>
  `
})
export class LogsPage {
  @ViewChild('pane') pane?: ElementRef<HTMLPreElement>;
  lines: string[] = [];
  filter = '';
  status = 'disconnected';

  constructor(private ws: WsService) {}

  ngOnInit() {
    this.ws.messages$.subscribe(msg => {
      if (msg?.type === 'error') {
        const line = msg.message || 'WebSocket error';
        this.lines.push(line);
      } else {
        const line = typeof msg === 'string' ? msg : JSON.stringify(msg);
        this.lines.push(line);
      }
      setTimeout(() => this.scrollBottom());
    });
    this.ws.stream$.subscribe(evt => {
      if (evt.type === 'open') this.status = 'connected';
      else if (evt.type === 'close') this.status = 'closed';
      else if (evt.type === 'error') this.status = 'error';
    });
    this.retry();
  }

  retry() {
    this.status = 'connecting';
    this.ws.connect('/logs');
  }

  get filtered(): string[] {
    const f = this.filter.toLowerCase();
    return f ? this.lines.filter(l => l.toLowerCase().includes(f)) : this.lines;
  }

  clear() { this.lines = []; }

  private scrollBottom() {
    const el = this.pane?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
