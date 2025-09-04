import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-keys',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4 max-w-xl">
    <h2 class="text-xl font-semibold mb-4">Exchange API Keys</h2>
    <div class="grid gap-3">
      <label class="block">
        <span class="text-sm">Exchange</span>
        <select class="border rounded p-2 w-full" [(ngModel)]="exchange">
          <option value="binance">binance</option>
        </select>
      </label>
      <label class="block">
        <span class="text-sm">Category</span>
        <select class="border rounded p-2 w-full" [(ngModel)]="category">
          <option value="usdt">usdt (futures)</option>
        </select>
      </label>
      <label class="block">
        <span class="text-sm">API Key</span>
        <input class="border rounded p-2 w-full" [(ngModel)]="api_key">
      </label>
      <label class="block">
        <span class="text-sm">API Secret</span>
        <input class="border rounded p-2 w-full" [(ngModel)]="api_secret">
      </label>
      <button class="px-3 py-2 rounded bg-black text-white w-fit" (click)="save()">Save</button>
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

  async save() {
    await this.api.saveKeys({ exchange: this.exchange, category: this.category, api_key: this.api_key, api_secret: this.api_secret });
    alert('Saved. Workers will try to connect on server side.');
  }
}
