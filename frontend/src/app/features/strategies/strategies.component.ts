import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JsonSchemaFormComponent } from '../../shared/json-schema-form.component';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-strategies',
  imports: [CommonModule, FormsModule, RouterLink, JsonSchemaFormComponent, PrimeNgModule],
  template: `
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Strategies</h2>
      <p-button label="Create" (onClick)="openCreate=true" severity="primary"></p-button>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      @for (s of list(); track s.id) {
        <a class="block border rounded p-4 hover:shadow transition" [routerLink]="['/strategies', s.id]">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">{{ s.id }}</div>
            <span class="text-xs px-2 py-1 rounded" [class.bg-emerald-100]="s.running" [class.bg-gray-100]="!s.running">
              {{ s.running ? 'running' : 'stopped' }}
            </span>
          </div>
          <div class="text-sm text-gray-600">Equity: {{ s.equity ?? '-' }}</div>
        </a>
      }
    </div>

    <div *ngIf="openCreate" class="fixed inset-0 bg-black/50 grid place-items-center">
      <div class="bg-white rounded p-4 w-[700px] max-w-[95vw]">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">Create Strategy</div>
          <p-button label="✕" (onClick)="openCreate=false" text></p-button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Strategy</label>
            <p-dropdown class="w-full" [options]="list()" optionLabel="id" optionValue="id" [(ngModel)]="sid" (onChange)="loadSchema()"></p-dropdown>
          </div>
          <div>
            <label class="block text-sm mb-1">Exchange</label>
            <input pInputText class="w-full" [(ngModel)]="exchange" />
          </div>
          <div>
            <label class="block text-sm mb-1">Symbol</label>
            <input pInputText class="w-full" [(ngModel)]="symbol" />
          </div>
          <div class="col-span-2">
            <app-json-schema-form [schema]="schema()" [(model)]="cfg"></app-json-schema-form>
          </div>
          <div class="col-span-2 mt-2 flex gap-2">
            <p-button label="Create & Start" (onClick)="create()" severity="primary"></p-button>
            <p-button label="Cancel" (onClick)="openCreate=false"></p-button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class StrategiesComponent {
  openCreate = false;
  list = signal<{id:string;running:boolean;equity?:number}[]>([]);
  sid = '';
  cfg: any = {};
  schema = signal<any>({type:'object', properties:{}});
  api = inject(ApiService);
  msg = inject(MessageService);
  exchange = 'mock';
  symbol = '';

  async ngOnInit() {
    await this.refresh();
  }
  async refresh() {
    let list: {id: string; running: boolean}[] = [];
    try {
      list = await this.api.listStrategies();
    } catch (err) {
      console.error('Failed to load strategies', err);
    }

    let summary: any = { items: [] };
    try {
      summary = await firstValueFrom(this.api.get('/dashboard/summary/strategies'));
    } catch (err) {
      console.error('Failed to load strategies summary', err);
    }
    if (!Array.isArray(summary.items)) summary.items = [];
    const sumMap = new Map(summary.items.map((x:any)=>[x.strategy_id, x]));
    this.list.set(list.map((x:any)=>({
      ...x,
      running: sumMap.get(x.id)?.running ?? x.running,
      equity: sumMap.get(x.id)?.equity
    })));

    if (list.length && !list.find((x:any)=>x.id===this.sid)) {
      this.sid = list[0].id;
      await this.loadSchema();
    }
  }

  async loadSchema() {
    if (!this.sid) return;
    try {
      const s = await this.api.getSchema(this.sid);
      this.schema.set(s.schema || s);
      this.cfg = { ...(s.sample || {}) };
    } catch (err) {
      console.error('Failed to load schema', err);
      this.schema.set({ type:'object', properties:{} });
      this.cfg = {};
    }
  }

  async create() {
    if (!this.sid) return;
    try {
      await this.api.startBot({
        strategy_id: this.sid,
        exchange: this.exchange,
        symbol: this.symbol,
        ...this.cfg,
      });
      this.openCreate = false;
      await this.refresh();
    } catch (err:any) {
      console.error('Failed to start strategy', err);
      this.msg.add({
        severity: 'error',
        summary: err?.error?.error || err?.message || 'Failed to start strategy'
      });
    }
  }
}
