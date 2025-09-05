import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppMaterialModule } from '../../app.module';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-strategies-modern',
  imports: [CommonModule, RouterModule, AppMaterialModule],
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
        <button class="btn" title="Start" (click)="start(s.id); $event.preventDefault(); $event.stopPropagation()" [disabled]="loading()[s.id]">
          {{ loading()[s.id] ? '⏳' : '▶' }}
        </button>
        <button class="btn" title="Stop" (click)="stop(s.id); $event.preventDefault(); $event.stopPropagation()" [disabled]="loading()[s.id]">
          {{ loading()[s.id] ? '⏳' : '⏸' }}
        </button>
        <button class="btn" title="Edit config" (click)="$event.preventDefault(); $event.stopPropagation()" [disabled]="loading()[s.id]">⚙</button>
        <button class="btn" title="Logs" (click)="$event.preventDefault(); $event.stopPropagation()" [disabled]="loading()[s.id]">🧾</button>
      </div>
    </a>
  </div>
  `
})
export class StrategiesModernComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  @Output() create = new EventEmitter<void>();
  @Output() importCfg = new EventEmitter<void>();

  items = signal<{id: string; running: boolean}[]>([]);
  loading = signal<Record<string, boolean>>({});

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    try {
      const list = await this.api.listStrategies();
      this.items.set(list);
    } catch (err: any) {
      this.snack.open(`Failed to load strategies: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }

  private setLoading(id: string, v: boolean) {
    const l = { ...this.loading() };
    l[id] = v;
    this.loading.set(l);
  }

  async start(id: string) {
    this.setLoading(id, true);
    try {
      await this.api.startStrategy(id, {});
      this.items.update(list => list.map(it => it.id === id ? { ...it, running: true } : it));
    } catch (err: any) {
      this.snack.open(`Start failed: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    } finally {
      this.setLoading(id, false);
    }
  }

  async stop(id: string) {
    this.setLoading(id, true);
    try {
      await this.api.stopStrategy(id);
      this.items.update(list => list.map(it => it.id === id ? { ...it, running: false } : it));
    } catch (err: any) {
      this.snack.open(`Stop failed: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    } finally {
      this.setLoading(id, false);
    }
  }
}
