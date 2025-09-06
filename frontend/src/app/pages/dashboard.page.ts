import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { PrimeNgModule } from '../prime-ng.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimeNgModule],
  template: `
    <div class="p-4">
      <div class="flex justify-between mb-3">
        <h1 class="text-lg font-medium">Bots</h1>
        <p-button label="Add Bot" (onClick)="openAdd=true" severity="primary"></p-button>
      </div>
      <p-table [value]="bots" class="w-full">
        <ng-template pTemplate="header">
          <tr>
            <th>ID</th>
            <th>Strategy</th>
            <th>Exchange</th>
            <th>Symbol</th>
            <th>Risk</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-b>
          <tr>
            <td>{{ b.id }}</td>
            <td>{{ b.strategy_id }}</td>
            <td>{{ b.exchange }}</td>
            <td>{{ b.symbol }}</td>
            <td>{{ b.risk_profile }}</td>
            <td><p-button label="Stop" (onClick)="stop(b.id)"></p-button></td>
          </tr>
        </ng-template>
      </p-table>
    </div>
    <p-dialog [(visible)]="openAdd" [modal]="true" header="Add Bot" styleClass="w-[400px] max-w-[95vw]">
      <div class="grid gap-3">
        <div>
          <label class="block text-sm mb-1">Strategy</label>
          <p-dropdown [options]="strategyOptions" [(ngModel)]="strategy_id"></p-dropdown>
        </div>
        <div>
          <label class="block text-sm mb-1">Exchange</label>
          <input pInputText class="w-full" [(ngModel)]="exchange" />
        </div>
        <div>
          <label class="block text-sm mb-1">Symbol</label>
          <input pInputText class="w-full" [(ngModel)]="symbol" />
        </div>
        <div>
          <label class="block text-sm mb-1">Risk Profile</label>
          <input pInputText class="w-full" [(ngModel)]="risk" />
        </div>
        <div class="flex gap-2 mt-2">
          <p-button label="Start" (onClick)="start()" severity="primary"></p-button>
          <p-button label="Cancel" (onClick)="openAdd=false"></p-button>
        </div>
      </div>
    </p-dialog>
  `,
})
export class DashboardPage implements OnInit {
  private api = inject(ApiService);

  bots: any[] = [];
  openAdd = false;

  strategy_id = '';
  strategies: {id: string; running: boolean}[] = [];
  exchange = 'mock';
  symbol = '';
  risk = '';

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    const res = await this.api.listBots();
    this.bots = res.items ?? [];
    try {
      this.strategies = await this.api.listStrategies();
      if (!this.strategy_id && this.strategies.length) {
        this.strategy_id = this.strategies[0].id;
      }
    } catch (err) {
      console.error('Failed to load strategies', err);
    }
  }

  async start() {
    await this.api.startBot({
      strategy_id: this.strategy_id,
      exchange: this.exchange,
      symbol: this.symbol,
      risk_profile: this.risk,
    });
    this.openAdd = false;
    this.strategy_id = '';
    this.exchange = 'mock';
    this.symbol = '';
    this.risk = '';
    await this.refresh();
  }

  async stop(id: string) {
    await this.api.stopBot(id);
    await this.refresh();
  }

  get strategyOptions() {
    return this.strategies.map(s => ({ label: s.id, value: s.id }));
  }
}
