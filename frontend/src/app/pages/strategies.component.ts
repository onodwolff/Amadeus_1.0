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
    <input [(ngModel)]="exchange" placeholder="exchange" class="border p-1 mr-2" />
    <input [(ngModel)]="symbol" placeholder="symbol" class="border p-1 mr-2" />
    <button class="btn" (click)="start()">Start</button>
    <button class="btn" (click)="stop()">Stop</button>
  </div>
  `
})
export class StrategiesComponent implements OnInit {
  strategies: { id: string; running: boolean }[] = [];
  sid = '';
  exchange = 'mock';
  symbol = '';

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
    try {
      await this.api.startBot({
        strategy_id: this.sid,
        exchange: this.exchange,
        symbol: this.symbol,
      });
      await this.loadStrategies();
    } catch (err: any) {
      this.snack.open(`Start failed: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }

  async stop() {
    try {
      const bots = await this.api.listBots();
      const bot = bots.items?.find(
        (b: any) =>
          b.strategy_id === this.sid &&
          b.exchange === this.exchange &&
          b.symbol === this.symbol,
      );
      if (bot) {
        await this.api.stopBot(bot.id);
        await this.loadStrategies();
      } else {
        this.snack.open('Bot not found', 'OK', { duration: 2500 });
      }
    } catch (err: any) {
      this.snack.open(`Stop failed: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }
}

