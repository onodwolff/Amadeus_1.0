import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AppMaterialModule } from '../app.module';
import { RiskStatus } from '../models';

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

  ngOnInit() {
    // risk endpoints disabled
    this.loadingStatus = false;
    this.loadingLimits = false;
  }

  refreshStatus() {
    console.warn('Risk status endpoint not available');
  }

  async refreshLimits() {
    console.warn('Risk limits endpoint not available');
  }

  async save() {
    console.warn('Risk limits endpoint not available');
  }

  unlock() {
    console.warn('Risk unlock endpoint not available');
  }
}
