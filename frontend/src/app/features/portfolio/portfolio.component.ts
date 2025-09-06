import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { WsService } from '../../core/services/ws.service';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-portfolio',
  imports: [CommonModule, PrimeNgModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Portfolio</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-medium mb-2">Balances</h3>
        <p-table [value]="balances()" class="min-w-full text-sm">
          <ng-template pTemplate="header">
            <tr class="text-left text-gray-500"><th>Asset</th><th>Free</th><th>Locked</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-b>
            <tr class="border-t"><td>{{ b.asset }}</td><td>{{ b.free }}</td><td>{{ b.locked }}</td></tr>
          </ng-template>
        </p-table>
      </div>
      <div>
        <h3 class="font-medium mb-2">Positions</h3>
        <p-table [value]="positions()" class="min-w-full text-sm">
          <ng-template pTemplate="header">
            <tr class="text-left text-gray-500"><th>Symbol</th><th>Qty</th><th>Avg Price</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-p>
            <tr class="border-t"><td>{{ p.symbol }}</td><td>{{ p.qty }}</td><td>{{ p.avg_price }}</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <div class="mt-8">
      <h3 class="font-medium mb-2">Live fills</h3>
      <div class="border rounded p-2 h-60 overflow-auto text-sm">
        @for (f of liveFills(); track f.ts) {
          <div>[{{ f.exchange }}] {{ f.symbol }} {{ f.side }} {{ f.qty }} @ {{ f.price }} <span class="text-gray-500">{{ f.ts }}</span></div>
        }
      </div>
    </div>
  </div>
  `
})
export class PortfolioComponent {
  api = inject(ApiService);
  ws = inject(WsService);
  balances = signal<any[]>([]);
  positions = signal<any[]>([]);
  liveFills = signal<any[]>([]);

  async ngOnInit() {
    this.balances.set(await this.api.getBalances());
    this.positions.set(await this.api.getPositions());
    this.ws.connect('portfolio/fills');
    this.ws.messages$.subscribe((m) => {
      if (m?.type === 'fill') {
        this.liveFills.update(arr => (arr.length>200? arr.slice(-200):arr).concat(m));
      }
    });
  }
}
