import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-keys',
  imports: [CommonModule, FormsModule, PrimeNgModule],
  template: `
  <div class="p-4 max-w-xl">
    <h2 class="text-xl font-semibold mb-4">Exchange API Keys</h2>
    <div class="grid gap-3">
      <label class="block">
        <span class="text-sm">Exchange</span>
        <p-dropdown class="w-full" [(ngModel)]="exchange" [options]="exchangeOptions"></p-dropdown>
      </label>
      <label class="block">
        <span class="text-sm">Category</span>
        <p-dropdown class="w-full" [(ngModel)]="category" [options]="categoryOptions"></p-dropdown>
      </label>
      <label class="block">
        <span class="text-sm">API Key</span>
        <input pInputText class="w-full" [(ngModel)]="api_key">
      </label>
      <label class="block">
        <span class="text-sm">API Secret</span>
        <input pInputText class="w-full" [(ngModel)]="api_secret">
      </label>
      <p-button label="Save" (onClick)="save()" severity="primary" class="w-fit"></p-button>
    </div>
    <p class="text-sm text-gray-600 mt-4">Ключи шифруются (Fernet) и хранятся в БД. Для прод — задайте ENCRYPTION_KEY.</p>
  </div>
  `
})
export class KeysComponent {
  api = inject(ApiService);
  exchange = 'binance';
  category = 'usdt';
  api_key = '';
  api_secret = '';
  exchangeOptions = [ { label: 'binance', value: 'binance' } ];
  categoryOptions = [ { label: 'usdt (futures)', value: 'usdt' } ];

  async save() {
    await this.api.saveKeys({ exchange: this.exchange, category: this.category, api_key: this.api_key, api_secret: this.api_secret });
    alert('Saved. Workers will try to connect on server side.');
  }
}
