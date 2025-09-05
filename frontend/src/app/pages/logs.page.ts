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

  constructor(private ws: WsService) {}

  ngOnInit() {
    this.ws.connect('/logs');
    this.ws.messages$.subscribe(msg => {
      const line = typeof msg === 'string' ? msg : JSON.stringify(msg);
      this.lines.push(line);
      setTimeout(() => this.scrollBottom());
    });
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
