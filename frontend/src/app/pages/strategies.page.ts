import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StrategiesModernComponent } from '../features/strategies/strategies-modern.component';
import { JsonSchemaFormComponent } from '../shared/ui/json-schema-form.component';
import { ApiService } from '../core/services/api.service';
import { PrimeNgModule } from '../prime-ng.module';
import { ToastService } from '../shared/ui/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-strategies',
  standalone: true,
  imports: [CommonModule, FormsModule, StrategiesModernComponent, JsonSchemaFormComponent, PrimeNgModule],
  template: `
    <div class="p-4">
      <app-strategies-modern (create)="onCreate()" (importCfg)="onImport()" (edit)="onEdit($event)" (remove)="onRemove($event)" #list></app-strategies-modern>
    </div>

    <div *ngIf="openCreate" class="fixed inset-0 bg-black/50 grid place-items-center">
      <div class="bg-white rounded p-4 w-[700px] max-w-[95vw]">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">{{ editing ? 'Edit Strategy' : 'Create Strategy' }}</div>
          <button class="text-sm" (click)="openCreate=false; editing=false">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">Strategy</label>
            <select class="border rounded p-2 w-full" [(ngModel)]="sid" (ngModelChange)="loadSchema()">
              <option *ngFor="let s of strategies" [value]="s.id">{{ s.id }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Risk Policy</label>
            <select class="border rounded p-2 w-full" [(ngModel)]="riskPolicy" [disabled]="!riskPolicies.length">
              <option *ngFor="let r of riskPolicies" [value]="r">{{ r }}</option>
            </select>
          </div>
          <div class="col-span-2">
            <app-json-schema-form [schema]="schema" [(model)]="cfg"></app-json-schema-form>
          </div>
          <div class="col-span-2 mt-2 flex gap-2">
            <button class="btn primary" (click)="submitSave()">Save</button>
            <button class="btn" (click)="openCreate=false; editing=false">Cancel</button>
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
            <button class="btn primary" (click)="submitImport()">Save</button>
            <button class="btn" (click)="openImport=false">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StrategiesPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  @ViewChild('list') private list?: StrategiesModernComponent;

  openCreate = false;
  openImport = false;
  editing = false;

  strategies: {id: string; running: boolean}[] = [];
  sid = '';
  schema: any = { type: 'object', properties: {} };
  cfg: any = {};
  importedCfg: any = {};
  riskPolicies: string[] = [];
  riskPolicy = '';

  async onCreate() {
    this.editing = false;
    this.cfg = {};
    this.openCreate = true;
    await this.loadStrategies();
    await this.loadRiskPolicies();
    await this.loadSchema();
  }

  async onImport() {
    this.openImport = true;
    await this.loadStrategies();
  }

  async onEdit(id: string) {
    this.editing = true;
    this.sid = id;
    this.openCreate = true;
    await this.loadStrategies();
    await this.loadRiskPolicies();
    await this.loadSchema();
    try {
      const res: any = await firstValueFrom(this.api.get(`/strategies/${id}`));
      this.cfg = res.config || {};
      this.riskPolicy = res.risk_policy || this.riskPolicy;
    } catch (err: any) {
      this.toast.push(`Load failed: ${err?.error?.error || err?.message || 'unknown'}`, 'error');
    }
  }

  async onRemove(id: string) {
    try {
      await firstValueFrom(this.api.delete(`/strategies/${id}`));
      await this.list?.refresh();
    } catch (err: any) {
      this.toast.push(`Delete failed: ${err?.error?.error || err?.message || 'unknown'}`, 'error');
    }
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

  async submitSave() {
    try {
      if (this.editing) {
        await firstValueFrom(
          this.api.put(`/strategies/${this.sid}`, { config: this.cfg, risk_policy: this.riskPolicy })
        );
      } else {
        await firstValueFrom(
          this.api.post('/strategies', { name: this.sid, config: this.cfg, risk_policy: this.riskPolicy })
        );
      }
      this.openCreate = false;
      this.editing = false;
      await this.list?.refresh();
    } catch (err: any) {
      this.toast.push(`Save failed: ${err?.error?.error || err?.message || 'unknown'}`, 'error');
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
      await firstValueFrom(
        this.api.put(`/strategies/${this.sid}`, { config: this.importedCfg || {}, risk_policy: this.riskPolicy })
      );
      this.openImport = false;
      this.importedCfg = {};
      await this.list?.refresh();
    } catch (err: any) {
      this.toast.push(`Save failed: ${err?.error?.error || err?.message || 'unknown'}`, 'error');
    }
  }

  private async loadRiskPolicies() {
    try {
      this.riskPolicies = await this.api.getRiskPolicies();
      if (!this.riskPolicies.length) {
        this.toast.push('No risk policies found', 'info');
      }
    } catch (err: any) {
      if (err?.status === 404) {
        this.riskPolicies = [];
        this.toast.push('No risk policies found', 'info');
      } else {
        this.riskPolicies = [];
        this.toast.push(`Load failed: ${err?.error?.error || err?.message || 'unknown'}`, 'error');
      }
    }
    if (!this.riskPolicy && this.riskPolicies.length) {
      this.riskPolicy = this.riskPolicies[0];
    }
  }
}
