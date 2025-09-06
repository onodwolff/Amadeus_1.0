import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { StrategiesModernComponent } from '../features/strategies/strategies-modern.component';
import { JsonSchemaFormComponent } from '../shared/ui/json-schema-form.component';
import { ApiService } from '../core/services/api.service';
import { PrimeNgModule } from '../prime-ng.module';
import { MessageService } from 'primeng/api';
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
          <p-dropdown [options]="strategyOptions" name="createSid" [(ngModel)]="sid" (onChange)="loadSchema()" required #createSidModel="ngModel"></p-dropdown>
          <p-messages *ngIf="createSidModel.invalid && createSidModel.touched" [value]="[{severity:'error', detail:'Strategy is required'}]"></p-messages>
        </div>
        <div>
          <label class="block text-sm mb-1">Risk Policy</label>
          <p-dropdown [options]="riskPolicyOptions" name="riskPolicy" [(ngModel)]="riskPolicy" [disabled]="!riskPolicyOptions.length" required #riskPolicyModel="ngModel"></p-dropdown>
          <p-messages *ngIf="riskPolicyModel.invalid && riskPolicyModel.touched && riskPolicyOptions.length" [value]="[{severity:'error', detail:'Risk Policy is required'}]"></p-messages>
        </div>
        <div class="col-span-2">
          <app-json-schema-form [schema]="schema" [(model)]="cfg"></app-json-schema-form>
        </div>
        <div class="col-span-2 mt-2 flex gap-2">
          <p-button label="Save" (onClick)="submitSave(createSidModel, riskPolicyModel)" severity="primary"></p-button>
          <p-button label="Cancel" (onClick)="openCreate=false; editing=false"></p-button>
        </div>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="openImport" [modal]="true" header="Import Strategy Config" styleClass="w-[500px] max-w-[95vw]">
      <div class="grid gap-3">
        <div>
          <label class="block text-sm mb-1">Strategy</label>
          <p-dropdown [options]="strategyOptions" name="importSid" [(ngModel)]="sid" required #importSidModel="ngModel"></p-dropdown>
          <p-messages *ngIf="importSidModel.invalid && importSidModel.touched" [value]="[{severity:'error', detail:'Strategy is required'}]"></p-messages>
        </div>
        <div>
          <p-fileUpload mode="basic" accept="application/json" [auto]="true" customUpload="true" (uploadHandler)="onFileUpload($event)" chooseLabel="Select File"></p-fileUpload>
          <p-messages *ngIf="fileError" [value]="[{severity:'error', detail:fileError}]"></p-messages>
        </div>
        <div class="flex gap-2 mt-2">
          <p-button label="Save" (onClick)="submitImport(importSidModel)" severity="primary"></p-button>
          <p-button label="Cancel" (onClick)="openImport=false"></p-button>
        </div>
      </div>
    </p-dialog>
  `
})
export class StrategiesPage {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  @ViewChild('list') private list?: StrategiesModernComponent;

  openCreate = false;
  openImport = false;
  editing = false;

  strategies: {id: string; running: boolean}[] = [];
  sid = '';
  schema: any = { type: 'object', properties: {} };
  cfg: any = {};
  importedCfg: any = {};
  fileError = '';
  private fileSelected = false;
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
    this.fileError = '';
    this.fileSelected = false;
    this.importedCfg = {};
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
      this.messageService.add({
        severity: 'error',
        summary: `Load failed: ${err?.error?.error || err?.message || 'unknown'}`
      });
    }
  }

  async onRemove(id: string) {
    try {
      await firstValueFrom(this.api.delete(`/strategies/${id}`));
      await this.list?.refresh();
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: `Delete failed: ${err?.error?.error || err?.message || 'unknown'}`
      });
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

  async submitSave(sidModel: NgModel, riskModel: NgModel) {
    if (sidModel.invalid || (this.riskPolicyOptions.length && riskModel.invalid)) {
      sidModel.control.markAsTouched();
      if (this.riskPolicyOptions.length) riskModel.control.markAsTouched();
      return;
    }
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
      this.messageService.add({
        severity: 'error',
        summary: `Save failed: ${err?.error?.error || err?.message || 'unknown'}`
      });
    }
  }

  onFileUpload(event: any) {
    const file = event.files?.[0];
    if (!file) {
      this.fileError = 'File is required';
      this.fileSelected = false;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.importedCfg = JSON.parse(String(reader.result));
        this.fileError = '';
        this.fileSelected = true;
      } catch {
        this.importedCfg = {};
        this.fileError = 'Invalid JSON file';
        this.fileSelected = false;
      }
    };
    reader.readAsText(file);
  }

  async submitImport(sidModel: NgModel) {
    if (sidModel.invalid || !this.fileSelected || this.fileError) {
      if (sidModel.invalid) sidModel.control.markAsTouched();
      if (!this.fileSelected) this.fileError = 'Please select a config file';
      return;
    }
    try {
      await firstValueFrom(
        this.api.put(`/strategies/${this.sid}`, { config: this.importedCfg || {}, risk_policy: this.riskPolicy })
      );
      this.openImport = false;
      this.importedCfg = {};
      await this.list?.refresh();
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: `Save failed: ${err?.error?.error || err?.message || 'unknown'}`
      });
    }
  }

  private async loadRiskPolicies() {
    try {
      this.riskPolicies = await this.api.getRiskPolicies();
      if (!this.riskPolicies.length) {
        this.messageService.add({ severity: 'info', summary: 'No risk policies found' });
      }
    } catch (err: any) {
      if (err?.status === 404) {
        this.riskPolicies = [];
        this.messageService.add({ severity: 'info', summary: 'No risk policies found' });
      } else {
        this.riskPolicies = [];
        this.messageService.add({
          severity: 'error',
          summary: `Load failed: ${err?.error?.error || err?.message || 'unknown'}`
        });
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
