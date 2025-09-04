import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { JsonSchemaFormComponent } from '../../shared/ui/json-schema-form.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-strategies',
  imports: [CommonModule, FormsModule, JsonSchemaFormComponent],
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Strategies</h2>

    <div class="grid grid-cols-5 gap-3 mb-4 items-end">
      <div>
        <label class="block text-sm mb-1">Exchange</label>
        <select class="border rounded p-2" [(ngModel)]="cfg.exchange">
          <option value="mock">mock</option>
          <option value="bybit">bybit</option>
          <option value="binance">binance</option>
        </select>
      </div>
      <div>
        <label class="block text-sm mb-1">Category</label>
        <select class="border rounded p-2" [(ngModel)]="cfg.category">
          <option value="spot">spot</option>
          <option value="linear">linear</option>
          <option value="usdt">usdt</option>
        </select>
      </div>
      <div class="col-span-3">
        <label class="block text-sm mb-1">Strategy</label>
        <select class="border rounded p-2 w-full" [(ngModel)]="selected">
          @for (s of strategies(); track s.id) { <option [ngValue]="s.id">{{ s.id }}</option> }
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6 mb-4">
      <div>
        <h3 class="font-medium mb-2">Config</h3>
        <app-json-schema-form [schema]="schema()" [model]="cfg" (modelChange)="onCfg($event)"></app-json-schema-form>
      </div>
      <div>
        <h3 class="font-medium mb-2">Actions</h3>
        <div class="text-sm text-gray-500 mb-2">Role: {{ auth.role() }}</div>
        <button class="px-3 py-2 rounded bg-black text-white" (click)="start()" [disabled]="auth.role()==='viewer'">Start</button>
        <button class="px-3 py-2 rounded border ml-2" (click)="stop()" [disabled]="auth.role()==='viewer'">Stop</button>

        <div class="mt-6">
          <h3 class="font-medium mb-2">Available</h3>
          <ul class="list-disc pl-5">
            @for (s of strategies(); track s.id) {
              <li>{{ s.id }} — {{ s.running ? 'running' : 'stopped' }}</li>
            }
          </ul>
        </div>
      </div>
    </div>
  </div>
  `
})
export class StrategiesComponent {
  api = inject(ApiService);
  auth = inject(AuthService);
  strategies = signal<{id:string; running:boolean}[]>([]);
  selected = 'sample_ema_crossover';
  schema = signal<any>({ type:'object', properties:{} });
  cfg: any = { exchange:'mock', category:'spot', symbol: 'BTCUSDT', short: 12, long: 26, qty: 0.01 };

  async ngOnInit() {
    await this.auth.whoami();
    this.strategies.set(await this.api.listStrategies());
    this.schema.set(await this.api.getSchema(this.selected));
  }
  async onCfg(_: any) { /* two-way via ngModel */ }
  async start() {
    await this.api.startStrategy(this.selected, this.cfg);
    this.strategies.set(await this.api.listStrategies());
  }
  async stop() {
    await this.api.stopStrategy(this.selected);
    this.strategies.set(await this.api.listStrategies());
  }
}
