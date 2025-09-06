import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JsonSchemaFormComponent } from '../../shared/json-schema-form.component';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-strategies',
  imports: [CommonModule, FormsModule, RouterLink, JsonSchemaFormComponent],
  template: `
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Strategies</h2>
      <button class="px-3 py-2 rounded bg-black text-white" (click)="openCreate=true">Create</button>
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
          <button class="text-sm" (click)="openCreate=false">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Strategy</label>
            <select class="border rounded p-2 w-full" [(ngModel)]="sid" (ngModelChange)="loadSchema()">
              @for (s of list(); track s.id) {
                <option [value]="s.id">{{ s.id }}</option>
              }
            </select>
          </div>
          <div class="col-span-2">
            <app-json-schema-form [schema]="schema()" [(model)]="cfg"></app-json-schema-form>
          </div>
          <div class="col-span-2 mt-2 flex gap-2">
            <button class="px-3 py-2 rounded bg-black text-white" (click)="create()">Create & Start</button>
            <button class="px-3 py-2 rounded" (click)="openCreate=false">Cancel</button>
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
  sid = 'sample_ema_crossover';
  cfg: any = {};
  schema = signal<any>({type:'object', properties:{}});
  api = inject(ApiService);

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
    try {
      await this.api.startStrategy(this.sid, this.cfg);
      this.openCreate = false;
      await this.refresh();
    } catch (err:any) {
      console.error('Failed to start strategy', err);
      alert(err?.error?.error || err?.message || 'Failed to start strategy');
    }
  }
}
