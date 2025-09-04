import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ToastHostComponent } from './shared/ui/toast-host.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ToastHostComponent],
  template: `
  <div class="min-h-screen">
    <header class="border-b">
      <div class="max-w-6xl mx-auto px-4 py-3 flex gap-4 items-center">
        <a routerLink="/" class="font-semibold">Amadeus</a>
        <nav class="flex gap-4 text-sm">
          <a routerLink="/market">Market</a>
          <a routerLink="/strategies">Strategies</a>
          <a routerLink="/portfolio">Portfolio</a>
          <a routerLink="/orders">Orders</a>
          <a routerLink="/backtest">Backtest</a>
          <a routerLink="/risk">Risk</a>
          <a routerLink="/keys">Keys</a>
          <a routerLink="/analytics">Analytics</a>
        </nav>
      </div>
    </header>
    <main class="max-w-6xl mx-auto px-4 py-6">
      <router-outlet></router-outlet>
    </main>
    <toast-host></toast-host>
  </div>
  `
})
export class AppComponent {}
