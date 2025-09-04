import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private key: 'theme' = 'theme';
  current: 'dark' | 'light' = 'dark';

  init() {
    const saved = (localStorage.getItem(this.key) as 'dark'|'light') || 'dark';
    this.apply(saved);
  }
  toggle() { this.apply(this.current === 'dark' ? 'light' : 'dark'); }

  private apply(t: 'dark'|'light') {
    this.current = t;
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('app-dark', t === 'dark'); // для PrimeNG dark mode
    localStorage.setItem(this.key, t);
  }
}
