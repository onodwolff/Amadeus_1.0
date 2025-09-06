import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '../prime-ng.module';
import { ApiService } from '../core/services/api.service';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-strategies',
  imports: [CommonModule, FormsModule, PrimeNgModule],
  template: `
  <h2 class="mb-2">Strategies</h2>
  <div class="mb-3 flex items-center gap-2">
    <p-dropdown [options]="strategies" optionLabel="id" optionValue="id" [(ngModel)]="sid" class="mr-2"></p-dropdown>
    <input pInputText [(ngModel)]="exchange" placeholder="exchange" class="mr-2" />
    <input pInputText [(ngModel)]="symbol" placeholder="symbol" class="mr-2" />
    <p-button label="Start" (onClick)="start()"></p-button>
    <p-button label="Stop" (onClick)="stop()"></p-button>
  </div>
  `
})
export class StrategiesComponent implements OnInit {
  strategies: { id: string; running: boolean }[] = [];
  sid = '';
  exchange = 'mock';
  symbol = '';

  constructor(private api: ApiService, private messageService: MessageService) {}

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
      this.messageService.add({ severity: 'error', summary: `Failed to load strategies: ${err?.error?.error || err?.message || 'unknown'}` });
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
      this.messageService.add({ severity: 'error', summary: `Start failed: ${err?.error?.error || err?.message || 'unknown'}` });
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
        this.messageService.add({ severity: 'error', summary: 'Bot not found' });
      }
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: `Stop failed: ${err?.error?.error || err?.message || 'unknown'}` });
    }
  }
}

