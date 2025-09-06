import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ThemeService } from './theme.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [NgIf, ButtonModule],
  template: `
    <p-button type="button" (onClick)="theme.toggle()" class="toggle" [label]="theme.current==='dark' ? '🌓 Dark' : '🌓 Light'"></p-button>
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
