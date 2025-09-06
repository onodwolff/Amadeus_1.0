import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <div class="flex justify-between mb-3">
        <h1 class="text-lg font-medium">Bots</h1>
        <button class="btn primary" (click)="openAdd=true">Add Bot</button>
      </div>
      <table class="tbl w-full">
        <tr>
          <th>ID</th>
          <th>Strategy</th>
          <th>Exchange</th>
          <th>Symbol</th>
          <th>Risk</th>
          <th></th>
        </tr>
        <tr *ngFor="let b of bots">
          <td>{{ b.id }}</td>
          <td>{{ b.strategy_id }}</td>
          <td>{{ b.exchange }}</td>
          <td>{{ b.symbol }}</td>
          <td>{{ b.risk_profile }}</td>
          <td><button class="btn" (click)="stop(b.id)">Stop</button></td>
        </tr>
      </table>
    </div>

    <div *ngIf="openAdd" class="fixed inset-0 bg-black/50 grid place-items-center">
      <div class="bg-white rounded p-4 w-[400px] max-w-[95vw]">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">Add Bot</div>
          <button class="text-sm" (click)="openAdd=false">✕</button>
        </div>
        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1">Strategy</label>
            <input class="border rounded p-2 w-full" [(ngModel)]="strategy_id" />
          </div>
          <div>
            <label class="block text-sm mb-1">Exchange</label>
            <input class="border rounded p-2 w-full" [(ngModel)]="exchange" />
          </div>
          <div>
            <label class="block text-sm mb-1">Symbol</label>
            <input class="border rounded p-2 w-full" [(ngModel)]="symbol" />
          </div>
          <div>
            <label class="block text-sm mb-1">Risk Profile</label>
            <input class="border rounded p-2 w-full" [(ngModel)]="risk" />
          </div>
          <div class="flex gap-2 mt-2">
            <button class="btn primary" (click)="start()">Start</button>
            <button class="btn" (click)="openAdd=false">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPage implements OnInit {
  private api = inject(ApiService);

  bots: any[] = [];
  openAdd = false;

  strategy_id = '';
  exchange = 'mock';
  symbol = '';
  risk = '';

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    const res = await this.api.listBots();
    this.bots = res.items ?? [];
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
}
