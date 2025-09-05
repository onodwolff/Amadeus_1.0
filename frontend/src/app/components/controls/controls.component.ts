import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMaterialModule } from '../../app.module';
import { ApiService } from '../../core/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule, AppMaterialModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss']
})
export class ControlsComponent implements OnDestroy {
  running = false;
  busy = false;
  sub?: Subscription;
  autoRefreshSub?: Subscription;

  constructor(private api: ApiService, private snack: MatSnackBar) {
    // глобальный стейт запуска бота
    this.sub = this.api.running$.subscribe(v => this.running = !!v);
    // статус сервера временно недоступен
    this.autoRefreshSub = timer(0, 5000).subscribe(_ => this.refresh());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.autoRefreshSub?.unsubscribe();
  }

  refresh() {
    // статус эндпоинт отключён
  }

  async doStart() {
    if (this.busy || this.running) return;
    this.busy = true;
    this.api.start().subscribe({
      next: _ => {
        this.api.setRunning(true);
        this.running = true;
        this.snack.open('Старт', 'OK', { duration: 1200 });
      },
      error: err => {
        this.snack.open(`Ошибка старта: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
      },
      complete: () => { this.busy = false; }
    });
  }

  async doStop() {
    if (this.busy || !this.running) return;
    this.busy = true;
    this.api.stop().subscribe({
      next: _ => {
        this.api.setRunning(false);
        this.running = false;
        this.snack.open('Стоп', 'OK', { duration: 4000 });
      },
      error: err => {
        this.snack.open(`Ошибка остановки: ${err?.error?.error || err?.message || 'unknown'}`, 'OK', { duration: 2500 });
      },
      complete: () => { this.busy = false; }
    });
  }
}
