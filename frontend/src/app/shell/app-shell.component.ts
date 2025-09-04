import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, NgClass],
  template: `
  <div class="min-h-screen grid grid-cols-[260px_1fr] lg:grid-cols-[80px_1fr]">
    <aside class="bg-[#0d1116] border-r border-[#1b2026] p-3">
      <div class="flex items-center gap-2 mb-6 px-1">
        <button class="btn" (click)="collapsed=!collapsed">☰</button>
        <div class="text-sm text-text-muted" *ngIf="!collapsed">Amadeus</div>
      </div>
      <nav class="flex flex-col gap-1">
        <a routerLink="/dashboard" routerLinkActive="bg-[#151a20]" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#141820]">🏠 <span *ngIf="!collapsed">Dashboard</span></a>
        <a routerLink="/market" routerLinkActive="bg-[#151a20]" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#141820]">📈 <span *ngIf="!collapsed">Market</span></a>
        <a routerLink="/strategies" routerLinkActive="bg-[#151a20]" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#141820]">🤖 <span *ngIf="!collapsed">Strategies</span></a>
        <a routerLink="/riskx" routerLinkActive="bg-[#151a20]" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#141820]">🛡 <span *ngIf="!collapsed">Risk</span></a>
        <a routerLink="/trades" routerLinkActive="bg-[#151a20]" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#141820]">📜 <span *ngIf="!collapsed">Trades</span></a>
      </nav>
    </aside>

    <main>
      <header class="flex items-center justify-between px-4 h-14 border-b border-[#1b2026] bg-[#0d1116]">
        <div class="text-sm text-text-muted">v13 UI</div>
        <div class="flex items-center gap-2">
          <button class="btn" (click)="toggleTheme()" title="Toggle theme">Dark</button>
        </div>
      </header>
      <section class="p-4">
        <router-outlet></router-outlet>
      </section>
    </main>
  </div>`
})
export class AppShellComponent {
  collapsed = False = false;
  toggleTheme(){ document.documentElement.classList.toggle('dark'); }
}
