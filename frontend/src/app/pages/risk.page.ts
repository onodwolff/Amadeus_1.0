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

    <div class="card" style="padding:12px;margin-top:8px;">
      <div *ngIf="loadingStatus">Загрузка статуса...</div>
      <ng-container *ngIf="!loadingStatus">
        <div class="row">
          <div class="chip" [class.on]="status?.allowed">Entries: {{ status?.allowed ? 'ALLOWED' : 'BLOCKED' }}</div>
          <button class="btn" (click)="refreshStatus()">Обновить</button>
          <button class="btn warn" (click)="unlock()" *ngIf="!status?.allowed">Снять блокировки</button>
        </div>
        <div class="muted" *ngIf="status?.reason">Reason: {{ status?.reason }}</div>
      </ng-container>
    </div>

    <div class="card" style="padding:12px;margin-top:8px;">
      <div *ngIf="loadingPolicies">Загрузка политик...</div>
      <ng-container *ngIf="!loadingPolicies">
        <form [formGroup]="policiesForm">
          <label>Risk policy
            <select formControlName="policy">
              <option *ngFor="let p of policies" [value]="p">{{ p }}</option>
            </select>
          </label>
        </form>
        <div class="muted" *ngIf="!policies.length">Политики не найдены</div>
        <div class="row" style="margin-top:8px;">
          <button class="btn" type="button" (click)="refreshPolicies()">Обновить</button>
        </div>
      </ng-container>
    </div>

    <div class="card" style="padding:12px;margin-top:8px;">
      <form [formGroup]="limitsForm" (ngSubmit)="save()">
        <div *ngIf="loadingLimits">Загрузка лимитов...</div>
        <div *ngIf="!loadingLimits">
          <div class="grid">
            <label>Max drawdown %
              <input type="number" formControlName="max_drawdown_pct" />
            </label>
            <label>DD window sec
              <input type="number" formControlName="dd_window_sec" />
            </label>
            <label>Stop duration sec
              <input type="number" formControlName="stop_duration_sec" />
            </label>
            <label>Cooldown sec
              <input type="number" formControlName="cooldown_sec" />
            </label>
            <label>Min trades for DD
              <input type="number" formControlName="min_trades_for_dd" />
            </label>
            <label>Max base ratio
              <input type="number" formControlName="max_base_ratio" />
            </label>
            <label>Max loss %
              <input type="number" formControlName="max_loss_pct" />
            </label>
            <label>Max loss USD
              <input type="number" formControlName="max_loss_usd" />
            </label>
          </div>
          <button class="btn primary" type="submit" [disabled]="loadingLimits">Сохранить</button>
        </div>
      </form>
    </div>
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
