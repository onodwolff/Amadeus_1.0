import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { PrimeNgModule } from '../prime-ng.module';
import { RiskStatus } from '../models';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../shared/ui/toast.service';

@Component({
  selector: 'app-risk',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, ReactiveFormsModule],
  template: `
    <h1>Risk</h1>

    <p-card class="mt-2">
      <div *ngIf="loadingStatus">Загрузка статуса...</div>
      <ng-container *ngIf="!loadingStatus">
        <div class="row">
          <div class="chip" [class.on]="status?.allowed">Entries: {{ status?.allowed ? 'ALLOWED' : 'BLOCKED' }}</div>
          <p-button label="Обновить" (onClick)="refreshStatus()"></p-button>
          <p-button label="Снять блокировки" (onClick)="unlock()" *ngIf="!status?.allowed" severity="warning"></p-button>
        </div>
        <div class="muted" *ngIf="status?.reason">Reason: {{ status?.reason }}</div>
      </ng-container>
    </p-card>

    <p-card class="mt-2">
      <div *ngIf="loadingPolicies">Загрузка политик...</div>
      <ng-container *ngIf="!loadingPolicies">
        <form [formGroup]="policiesForm">
          <label>Risk policy
            <p-dropdown formControlName="policy" [options]="policies.map(p => ({label:p, value:p}))"></p-dropdown>
          </label>
        </form>
        <div class="muted" *ngIf="!policies.length">Политики не найдены</div>
        <div class="row mt-2">
          <p-button label="Обновить" type="button" (onClick)="refreshPolicies()"></p-button>
        </div>
      </ng-container>
    </p-card>

    <p-card class="mt-2">
      <form [formGroup]="limitsForm" (ngSubmit)="save()">
        <div *ngIf="loadingLimits">Загрузка лимитов...</div>
        <div *ngIf="!loadingLimits">
          <div class="grid">
            <label>Max drawdown %
              <p-inputNumber formControlName="max_drawdown_pct"></p-inputNumber>
            </label>
            <label>DD window sec
              <p-inputNumber formControlName="dd_window_sec"></p-inputNumber>
            </label>
            <label>Stop duration sec
              <p-inputNumber formControlName="stop_duration_sec"></p-inputNumber>
            </label>
            <label>Cooldown sec
              <p-inputNumber formControlName="cooldown_sec"></p-inputNumber>
            </label>
            <label>Min trades for DD
              <p-inputNumber formControlName="min_trades_for_dd"></p-inputNumber>
            </label>
            <label>Max base ratio
              <p-inputNumber formControlName="max_base_ratio"></p-inputNumber>
            </label>
            <label>Max loss %
              <p-inputNumber formControlName="max_loss_pct"></p-inputNumber>
            </label>
            <label>Max loss USD
              <p-inputNumber formControlName="max_loss_usd"></p-inputNumber>
            </label>
          </div>
          <p-button label="Сохранить" type="submit" [disabled]="loadingLimits" severity="primary"></p-button>
        </div>
      </form>
    </p-card>
  `
})
export class RiskPage {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  status: RiskStatus | null = null;
  loadingStatus = true;

  policiesForm: FormGroup = this.fb.group({
    policy: [''],
  });
  policies: string[] = [];
  loadingPolicies = true;

  limitsForm: FormGroup = this.fb.group({
    max_drawdown_pct: [0],
    dd_window_sec: [0],
    stop_duration_sec: [0],
    cooldown_sec: [0],
    min_trades_for_dd: [0],
    max_base_ratio: [0],
    max_loss_pct: [0],
    max_loss_usd: [0],
  });
  loadingLimits = true;

  /** Display a user-friendly error based on HTTP status codes */
  private handleError(action: string, err: any) {
    const status = err?.status;
    let message = action;
    if (status === 0) {
      // usually a network error
      message += ': network error';
    } else if (status === 404) {
      message += ': not found (404)';
    } else if (status === 500) {
      message += ': server error (500)';
    } else if (err?.message) {
      message += ': ' + err.message;
    }
    this.toast.push(message, 'error');
  }

  ngOnInit() {
    this.refreshStatus(true);
    this.refreshPolicies(true);
    this.refreshLimits(true);
  }

  async refreshStatus(silent = false) {
    this.loadingStatus = true;
    try {
      this.status = await this.api.getRiskStatus();
      if (!silent) this.toast.push('Risk status loaded', 'success');
    } catch (err) {
      this.handleError('Failed to load risk status', err);
    } finally {
      this.loadingStatus = false;
    }
  }

  async refreshPolicies(silent = false) {
    this.loadingPolicies = true;
    this.policiesForm.disable();
    try {
      this.policies = await this.api.getRiskPolicies();
      if (this.policies.length && !this.policiesForm.value.policy) {
        this.policiesForm.patchValue({ policy: this.policies[0] });
      }
      if (!silent) this.toast.push('Risk policies loaded', 'success');
    } catch (err: any) {
      if (err?.status === 404) {
        // endpoint may be unavailable
        this.policies = [];
        if (!silent) this.toast.push('Risk policies not found', 'error');
      } else {
        this.handleError('Failed to load risk policies', err);
      }
    } finally {
      this.loadingPolicies = false;
      this.policiesForm.enable();
    }
  }

  async refreshLimits(silent = false) {
    this.loadingLimits = true;
    this.limitsForm.disable();
    try {
      const limits = await this.api.getRiskLimits();
      this.limitsForm.patchValue(limits || {});
      if (!silent) this.toast.push('Risk limits loaded', 'success');
    } catch (err) {
      this.handleError('Failed to load risk limits', err);
    } finally {
      this.loadingLimits = false;
      this.limitsForm.enable();
    }
  }

  async save() {
    this.loadingLimits = true;
    this.limitsForm.disable();
    try {
      await this.api.setRiskLimits(this.limitsForm.value);
      this.toast.push('Risk limits saved', 'success');
      await this.refreshLimits(true);
    } catch (err) {
      this.handleError('Failed to save risk limits', err);
    } finally {
      this.loadingLimits = false;
      this.limitsForm.enable();
    }
  }

  async unlock() {
    try {
      await this.api.unlockRisk();
      this.toast.push('Risk unlocked', 'success');
      await this.refreshStatus(true);
    } catch (err) {
      this.handleError('Failed to unlock risk', err);
    }
  }
}
