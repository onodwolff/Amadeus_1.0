import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AppMaterialModule } from '../app.module';
import { RiskStatus } from '../models';
import { ApiService } from '../core/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
          <button mat-raised-button color="primary" type="submit" [disabled]="loadingLimits">Сохранить</button>
        </div>
      </form>
    </div>
  `
})
export class RiskPage {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

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
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  ngOnInit() {
    this.refreshStatus(true);
    this.refreshLimits(true);
  }

  async refreshStatus(silent = false) {
    this.loadingStatus = true;
    try {
      this.status = await this.api.getRiskStatus();
      if (!silent) this.snackBar.open('Risk status loaded', 'Close', { duration: 3000 });
    } catch (err) {
      this.handleError('Failed to load risk status', err);
    } finally {
      this.loadingStatus = false;
    }
  }

  async refreshLimits(silent = false) {
    this.loadingLimits = true;
    this.limitsForm.disable();
    try {
      const limits = await this.api.getRiskLimits();
      this.limitsForm.patchValue(limits || {});
      if (!silent) this.snackBar.open('Risk limits loaded', 'Close', { duration: 3000 });
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
      this.snackBar.open('Risk limits saved', 'Close', { duration: 3000 });
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
      this.snackBar.open('Risk unlocked', 'Close', { duration: 3000 });
      await this.refreshStatus(true);
    } catch (err) {
      this.handleError('Failed to unlock risk', err);
    }
  }
}
