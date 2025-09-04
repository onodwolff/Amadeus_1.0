
import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [NgIf],
  template: `
    <button type="button" (click)="theme.toggle()" class="toggle">
      🌓 <span *ngIf="theme.current==='dark'">Dark</span><span *ngIf="theme.current==='light'">Light</span>
    </button>
  `,
  styles: [`
    .toggle {
      background: var(--surface);
      color: var(--text-0);
      border: 1px solid var(--gridline);
      border-radius: 10px;
      padding: 6px 10px;
    }
  `]
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}
