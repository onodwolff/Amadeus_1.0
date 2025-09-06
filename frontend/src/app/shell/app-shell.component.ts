import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, CommonModule, RouterLinkActive, ButtonModule],
  template: `
  <div class="min-h-screen grid grid-cols-[240px_1fr]">
    <aside class="border-r p-3">
      <div class="flex items-center gap-2 mb-6 px-1">
        <p-button label="☰" (onClick)="collapsed = !collapsed"></p-button>
        <div class="text-sm" *ngIf="!collapsed">Amadeus</div>
      </div>
      <nav class="flex flex-col gap-1">
        <a routerLink="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-xl">🏠 <span *ngIf="!collapsed">Dashboard</span></a>
        <a routerLink="/market" class="flex items-center gap-3 px-3 py-2 rounded-xl">📈 <span *ngIf="!collapsed">Market</span></a>
        <a routerLink="/strategies" class="flex items-center gap-3 px-3 py-2 rounded-xl">🤖 <span *ngIf="!collapsed">Strategies</span></a>
      </nav>
    </aside>

    <main>
      <header class="flex items-center justify-between px-4 h-14 border-b">
        <div class="text-sm">v17 UI</div>
        <div class="flex items-center gap-2">
          <p-button label="Dark" (onClick)="toggleTheme()" title="Toggle theme"></p-button>
        </div>
      </header>
      <section class="p-4">
        <router-outlet></router-outlet>
      </section>
    </main>
  </div>`
})
export class AppShellComponent {
  collapsed = false;
  toggleTheme(){ document.documentElement.classList.toggle('dark'); }
}
