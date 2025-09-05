import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-strategies-modern',
  imports: [CommonModule, RouterModule],
  template: `
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold">Strategies</h2>
    <div class="flex gap-2">
      <button class="btn primary" title="Create new strategy (Ctrl+N)" (click)="create.emit()">New</button>
      <button class="btn" title="Import config JSON" (click)="importCfg.emit()">Import</button>
    </div>
  </div>
  <div class="grid lg:grid-cols-3 gap-3">
    <a class="card p-4 block" *ngFor="let s of items()" [routerLink]="['/strategies', s.id]">
      <div class="flex items-center justify-between">
        <div class="font-medium">{{ s.id }}</div>
        <span class="badge" [class.ok]="s.running" [class.err]="!s.running">{{ s.running ? 'running' : 'stopped' }}</span>
      </div>
      <div class="flex items-center gap-3 mt-3">
        <button class="btn" title="Start" (click)="start(s.id); $event.preventDefault(); $event.stopPropagation()">▶</button>
        <button class="btn" title="Stop" (click)="stop(s.id); $event.preventDefault(); $event.stopPropagation()">⏸</button>
        <button class="btn" title="Edit config" (click)="$event.preventDefault(); $event.stopPropagation()">⚙</button>
        <button class="btn" title="Logs" (click)="$event.preventDefault(); $event.stopPropagation()">🧾</button>
      </div>
    </a>
  </div>
  `
})
export class StrategiesModernComponent implements OnInit {
  private api = inject(ApiService);

  @Output() create = new EventEmitter<void>();
  @Output() importCfg = new EventEmitter<void>();

  items = signal<{id: string; running: boolean}[]>([]);

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    const list = await this.api.listStrategies();
    this.items.set(list);
  }

  async start(id: string) {
    await this.api.startStrategy(id, {});
    await this.refresh();
  }

  async stop(id: string) {
    await this.api.stopStrategy(id);
    await this.refresh();
  }
}
