import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  role = signal<'admin'|'trader'|'viewer'|'dev'>('dev');
  base = (window as any).__API__ || 'http://localhost:8000/api';
  token = (window as any).__TOKEN__ || '';

  async whoami() {
    const headers = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    try {
      const r = await fetch(`${this.base}/auth/whoami`, { headers });
      const j = await r.json();
      if (j?.role) this.role.set(j.role);
    } catch {}
  }
}
