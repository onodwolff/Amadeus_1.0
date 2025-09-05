import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppMaterialModule } from '../app.module';
import { ApiService } from '../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-strategies',
  imports: [CommonModule, FormsModule, AppMaterialModule],
  template: `
  <h2 class="mb-2">Strategies</h2>
  <div class="mb-3">
    <select [(ngModel)]="sid" class="border p-1 mr-2">
      <option *ngFor="let s of strategies" [value]="s.id">{{ s.id }}</option>
    </select>
    <button class="btn" (click)="start()">Start</button>
    <button class="btn" (click)="stop()">Stop</button>
  </div>
  `
})
export class StrategiesComponent implements OnInit {
  strategies: { id: string; running: boolean }[] = [];
  sid = '';

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  async ngOnInit() {
    await this.loadStrategies();
  }

  private async loadStrategies() {
    try {
      this.strategies = await this.api.listStrategies();
      if (!this.sid && this.strategies.length) {
        this.sid = this.strategies[0].id;
      }
    } catch (err: any) {
      this.snack.open(`Failed to load strategies: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }

  async start() {
    const cfg = { symbol: 'BTCUSDT', tf: '1m', fast: 9, slow: 21, qty: 0.001 };
    try {
      await this.api.startStrategy(this.sid, cfg);
    } catch (err: any) {
      this.snack.open(`Start failed: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }

  async stop() {
    try {
      await this.api.stopStrategy(this.sid);
    } catch (err: any) {
      this.snack.open(`Stop failed: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }
}

