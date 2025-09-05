import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ToastModule, ButtonModule, TableModule, InputTextModule],
  providers: [MessageService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  rows = [
    { symbol: 'BTCUSDT', price: 67890.12, vol24h: '3.2B' },
    { symbol: 'ETHUSDT', price: 3120.55, vol24h: '1.1B' },
    { symbol: 'BNBUSDT', price: 540.21, vol24h: '250M' }
  ];

  constructor(private toast: MessageService) {}

  ping() {
    this.toast.add({ severity: 'success', summary: 'UI OK', detail: 'PrimeNG + Tailwind up and running' });
  }
}
