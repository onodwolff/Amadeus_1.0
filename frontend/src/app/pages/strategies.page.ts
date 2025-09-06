import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StrategiesModernComponent } from '../features/strategies/strategies-modern.component';
import { JsonSchemaFormComponent } from '../shared/ui/json-schema-form.component';
import { ApiService } from '../core/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppMaterialModule } from '../app.module';

@Component({
  selector: 'app-strategies',
  standalone: true,
  imports: [CommonModule, FormsModule, StrategiesModernComponent, JsonSchemaFormComponent, AppMaterialModule],
  template: `
    <div class="p-4">
      <app-strategies-modern (create)="onCreate()" (importCfg)="onImport()" #list></app-strategies-modern>
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
              <option *ngFor="let s of strategies" [value]="s.id">{{ s.id }}</option>
            </select>
          </div>
          <div class="col-span-2">
            <app-json-schema-form [schema]="schema" [(model)]="cfg"></app-json-schema-form>
          </div>
          <div class="col-span-2 mt-2 flex gap-2">
            <button class="btn primary" (click)="submitCreate()">Create & Start</button>
            <button class="btn" (click)="openCreate=false">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="openImport" class="fixed inset-0 bg-black/50 grid place-items-center">
      <div class="bg-white rounded p-4 w-[500px] max-w-[95vw]">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">Import Strategy Config</div>
          <button class="text-sm" (click)="openImport=false">✕</button>
        </div>
        <div class="grid gap-3">
          <div>
            <label class="block text-sm mb-1">Strategy</label>
            <select class="border rounded p-2 w-full" [(ngModel)]="sid">
              <option *ngFor="let s of strategies" [value]="s.id">{{ s.id }}</option>
            </select>
          </div>
          <div>
            <input type="file" accept="application/json" (change)="onFile($event)">
          </div>
          <div class="flex gap-2 mt-2">
            <button class="btn primary" (click)="submitImport()">Start</button>
            <button class="btn" (click)="openImport=false">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StrategiesPage {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  @ViewChild('list') private list?: StrategiesModernComponent;

  openCreate = false;
  openImport = false;

  strategies: {id: string; running: boolean}[] = [];
  sid = '';
  schema: any = { type: 'object', properties: {} };
  cfg: any = {};
  importedCfg: any = {};

  async onCreate() {
    this.openCreate = true;
    await this.loadStrategies();
    await this.loadSchema();
  }

  async onImport() {
    this.openImport = true;
    await this.loadStrategies();
  }

  private async loadStrategies() {
    this.strategies = await this.api.listStrategies();
    if (!this.sid && this.strategies.length) {
      this.sid = this.strategies[0].id;
    }
  }

  async loadSchema() {
    if (!this.sid) return;
    this.schema = await this.api.getSchema(this.sid);
    this.cfg = {};
  }

  async submitCreate() {
    try {
      await this.api.startStrategy(this.sid, this.cfg);
      this.openCreate = false;
      await this.list?.refresh();
    } catch (err: any) {
      this.snack.open(`Create failed: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }

  onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.importedCfg = JSON.parse(String(reader.result));
      } catch {
        this.importedCfg = {};
      }
    };
    reader.readAsText(file);
  }

  async submitImport() {
    try {
      await this.api.startStrategy(this.sid, this.importedCfg || {});
      this.openImport = false;
      this.importedCfg = {};
      await this.list?.refresh();
    } catch (err: any) {
      this.snack.open(`Import failed: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
    }
  }
}
