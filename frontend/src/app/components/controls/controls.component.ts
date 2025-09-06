import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss']
})
export class ControlsComponent implements OnDestroy {
  running = false;
  busy = false;
  sub?: Subscription;
  autoRefreshSub?: Subscription;
  botId?: string;

  constructor(private api: ApiService, private toast: ToastService) {
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
    try {
      const res: any = await this.api.startBot({
        strategy_id: 'sample_ema',
        exchange: 'mock',
        symbol: 'BTCUSDT',
      });
      this.botId = res?.id;
      this.api.setRunning(true);
      this.running = true;
      this.toast.push('Старт', 'success');
    } catch (err: any) {
      this.toast.push(`Ошибка старта: ${err?.error?.error || err?.message || 'unknown'}`, 'error');
    } finally {
      this.busy = false;
    }
  }

  async doStop() {
    if (this.busy || !this.running) return;
    if (!this.botId) return;
    this.busy = true;
    try {
      await this.api.stopBot(this.botId);
      this.api.setRunning(false);
      this.running = false;
      this.toast.push('Стоп', 'success');
      this.botId = undefined;
    } catch (err: any) {
      this.toast.push(`Ошибка остановки: ${err?.error?.error || err?.message || 'unknown'}`, 'error');
    } finally {
      this.busy = false;
    }
  }
}
