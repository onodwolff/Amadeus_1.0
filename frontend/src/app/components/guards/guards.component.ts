import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
    selector: 'app-guards',
    standalone: true,
    imports: [CommonModule, PrimeNgModule],
    templateUrl: './guards.component.html',
    styleUrls: ['./guards.component.scss']
})
export class GuardsComponent {
    data: any = null;
    loading = false;
    error = '';

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
