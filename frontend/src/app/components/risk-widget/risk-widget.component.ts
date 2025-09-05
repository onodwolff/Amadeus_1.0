import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMaterialModule } from '../../app.module';
import { RiskStatus } from '../../models';

@Component({
    selector: 'app-risk-widget',
    standalone: true,
    imports: [CommonModule, AppMaterialModule],
    templateUrl: './risk-widget.component.html',
    styleUrls: ['./risk-widget.component.scss']
})
export class RiskWidgetComponent {
    loading = true;
    data: RiskStatus | null = null;
    err = '';

    constructor() {}

    ngOnInit() { this.refresh(); }

    refresh() {
        this.loading = false;
        console.warn('Risk status endpoint not available');
    }

    unlock() {
        console.warn('Risk unlock endpoint not available');
    }
}
