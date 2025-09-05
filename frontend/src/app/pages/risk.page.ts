import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AppMaterialModule } from '../app.module';
import { RiskStatus } from '../models';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-risk',
  standalone: true,
  imports: [CommonModule, AppMaterialModule, ReactiveFormsModule],
  template: `
    <h1>Risk</h1>

    <div class="card" style="padding:12px;margin-top:8px;">
      <div *ngIf="loadingStatus">Загрузка статуса...</div>
      <ng-container *ngIf="!loadingStatus">
        <div class="row">
          <div class="chip" [class.on]="status?.allowed">Entries: {{ status?.allowed ? 'ALLOWED' : 'BLOCKED' }}</div>
          <button mat-stroked-button (click)="refreshStatus()">Обновить</button>
          <button mat-stroked-button color="warn" (click)="unlock()" *ngIf="!status?.allowed">Снять блокировки</button>
        </div>
        <div class="muted" *ngIf="status?.reason">Reason: {{ status?.reason }}</div>
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
          <button mat-raised-button color="primary" type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  `
})
export class RiskPage {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  status: RiskStatus | null = null;
  loadingStatus = true;

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
    alert(message);
  }

  ngOnInit() {
    this.refreshStatus();
    this.refreshLimits();
  }

  async refreshStatus() {
    this.loadingStatus = true;
    try {
      this.status = await this.api.getRiskStatus();
    } catch (err) {
      this.handleError('Failed to load risk status', err);
    } finally {
      this.loadingStatus = false;
    }
  }

  async refreshLimits() {
    this.loadingLimits = true;
    try {
      const limits = await this.api.getRiskLimits();
      this.limitsForm.patchValue(limits || {});
    } catch (err) {
      this.handleError('Failed to load risk limits', err);
    } finally {
      this.loadingLimits = false;
    }
  }

  async save() {
    this.loadingLimits = true;
    try {
      await this.api.setRiskLimits(this.limitsForm.value);
      await this.refreshLimits();
    } catch (err) {
      this.handleError('Failed to save risk limits', err);
    } finally {
      this.loadingLimits = false;
    }
  }

  async unlock() {
    try {
      await this.api.unlockRisk();
      await this.refreshStatus();
    } catch (err) {
      this.handleError('Failed to unlock risk', err);
    }
  }
}
