import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '../../prime-ng.module';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Config, ConfigGetResponse, ConfigResponse, PairScore, ScanResponse } from '../../models';

@Component({
    selector: 'app-scanner',
    standalone: true,
    imports: [CommonModule, FormsModule, PrimeNgModule],
    templateUrl: './scanner.component.html',
    styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent {
    cfg: any = {
        quote: 'USDT',
        min_price: 0.0001,
        min_vol_usdt_24h: 3000000,
        top_by_volume: 120,
        max_pairs: 60,
        min_spread_bps: 5.0,
        vol_bars: 0,
    };
    loading = false;
    err = '';
    best?: PairScore;
    top: PairScore[] = [];

    constructor(private api: ApiService, private toast: ToastService) {}

    ngOnInit() {
        const isCfgResp = (r: ConfigGetResponse): r is ConfigResponse => (r as ConfigResponse).cfg !== undefined;
        this.api.getConfig().subscribe({
            next: (res: ConfigGetResponse) => {
                const cfg: Config = isCfgResp(res) ? res.cfg : res;
                this.cfg = { ...this.cfg, ...(cfg.scanner || {}) };
            },
            error: _ => {}
        });
    }

    scan() {
        this.loading = true; this.err = '';
        this.api.scan({ scanner: this.cfg }).subscribe({
            next: (res: ScanResponse) => {
                this.best = res.best;
                this.top = Array.isArray(res.top) ? res.top : [];
                this.loading = false;
                this.toast.push('Scan complete', 'success');
            },
            error: (e: unknown) => {
                const errObj = e as { error?: { detail?: string }; message?: string };
                this.err = String(errObj.error?.detail || errObj.message || e);
                this.loading = false;
            }
        });
    }
}
