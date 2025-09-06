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
    <p-dialog [(visible)]="openCreate" [modal]="true" [header]="editing ? 'Edit Strategy' : 'Create Strategy'" styleClass="w-[700px] max-w-[95vw]">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm mb-1">Strategy</label>
          <p-dropdown [options]="strategyOptions" [(ngModel)]="sid" (onChange)="loadSchema()"></p-dropdown>
        </div>
        <div>
          <label class="block text-sm mb-1">Risk Policy</label>
          <p-dropdown [options]="riskPolicyOptions" [(ngModel)]="riskPolicy" [disabled]="!riskPolicyOptions.length"></p-dropdown>
        </div>
        <div class="col-span-2">
          <app-json-schema-form [schema]="schema" [(model)]="cfg"></app-json-schema-form>
        </div>
        <div class="col-span-2 mt-2 flex gap-2">
          <p-button label="Save" (onClick)="submitSave()" severity="primary"></p-button>
          <p-button label="Cancel" (onClick)="openCreate=false; editing=false"></p-button>
        </div>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="openImport" [modal]="true" header="Import Strategy Config" styleClass="w-[500px] max-w-[95vw]">
      <div class="grid gap-3">
        <div>
          <label class="block text-sm mb-1">Strategy</label>
          <p-dropdown [options]="strategyOptions" [(ngModel)]="sid"></p-dropdown>
        </div>
        <div>
          <input type="file" accept="application/json" (change)="onFile($event)">
        </div>
        <div class="flex gap-2 mt-2">
          <p-button label="Save" (onClick)="submitImport()" severity="primary"></p-button>
          <p-button label="Cancel" (onClick)="openImport=false"></p-button>
        </div>
      </div>
    </p-dialog>
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

  get strategyOptions() {
    return this.strategies.map(s => ({ label: s.id, value: s.id }));
  }

  get riskPolicyOptions() {
    return this.riskPolicies.map(r => ({ label: r, value: r }));
  }
}
