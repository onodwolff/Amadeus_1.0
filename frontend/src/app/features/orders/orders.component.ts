import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-orders',
  imports: [CommonModule, PrimeNgModule],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Orders & Fills</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-medium mb-2">Orders (latest)</h3>
        <p-table [value]="orders()" class="min-w-full text-sm">
          <ng-template pTemplate="header">
            <tr class="text-left text-gray-500">
              <th>Time</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th><th>Status</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-o>
            <tr class="border-t">
              <td>{{ o.created_at }}</td><td>{{ o.symbol }}</td><td>{{ o.side }}</td>
              <td>{{ o.qty }}</td><td>{{ o.price ?? '-' }}</td><td>{{ o.status }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
      <div>
        <h3 class="font-medium mb-2">Fills (latest)</h3>
        <p-table [value]="fills()" class="min-w-full text-sm">
          <ng-template pTemplate="header">
            <tr class="text-left text-gray-500">
              <th>TS</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Price</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-f>
            <tr class="border-t">
              <td>{{ f.ts }}</td><td>{{ f.symbol }}</td><td>{{ f.side }}</td><td>{{ f.qty }}</td><td>{{ f.price }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  </div>
  `
})
export class OrdersComponent {
  api = inject(ApiService);
  orders = signal<any[]>([]);
  fills = signal<any[]>([]);

  async ngOnInit() {
    this.orders.set(await this.api.getOrders());
    this.fills.set(await this.api.getFills());
  }
}
