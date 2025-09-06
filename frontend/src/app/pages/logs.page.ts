import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { WsService } from '../core/services/ws.service';
import { ApiService } from '../core/services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, InputTextModule],
  template: `
    <h1>Logs</h1>
    <div class="status" style="margin-top:8px;display:flex;align-items:center;gap:8px;">
      <span>Connection: {{ status }}</span>
      <p-button *ngIf="status !== 'connected'" type="button" (onClick)="retry()" label="Retry"></p-button>
    </div>
    <p-card class="mt-2 p-3">
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input pInputText [(ngModel)]="filter" placeholder="Filter"/>
        <p-button type="button" (onClick)="clear()" label="Clear"></p-button>
      </div>
      <pre #pane style="max-height:400px;overflow:auto;">{{ filtered.join('\n') }}</pre>
    </p-card>
  `
})
export class LogsPage {
  @ViewChild('pane') pane?: ElementRef<HTMLPreElement>;
  lines: string[] = [];
  filter = '';
  status = 'disconnected';
  private msgSub?: Subscription;
  private errSub?: Subscription;
  private statusSub?: Subscription;

  constructor(private ws: WsService, private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const sid = this.route.snapshot.queryParamMap.get('sid');
    if (sid) this.filter = sid;

    this.api.getLogs().subscribe({
      next: (res: any) => {
        const arr = Array.isArray(res?.lines)
          ? res.lines
          : [];
        if (arr.length) {
          this.lines.push(...arr.map((l: any) => String(l)));
          setTimeout(() => this.scrollBottom());
        }
      },
      error: () => {
        this.lines.push('Failed to load logs.');
        setTimeout(() => this.scrollBottom());
      }
    });

    this.statusSub = this.ws.status$.subscribe(s => this.status = s);
    this.errSub = this.ws.errors$.subscribe(() => {
      this.lines.push('Log stream unavailable');
      setTimeout(() => this.scrollBottom());
    });
    this.msgSub = this.ws.messages$.subscribe((msg: any) => {
      const line = typeof msg === 'string' ? msg : msg?.message || JSON.stringify(msg);
      this.lines.push(line);
      setTimeout(() => this.scrollBottom());
    });

    this.retry();
  }

  retry() {
    this.status = 'connecting';
    const ws = this.ws.connect('logs');
    if (!ws) {
      this.lines.push('Log stream unavailable');
      setTimeout(() => this.scrollBottom());
    }
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
