import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  api = inject(ApiService);
  role = signal<'admin'|'trader'|'viewer'|'dev'>('dev');

  async whoami() {
    try {
      const j: any = await firstValueFrom(this.api.get('/auth/whoami'));
      if (j?.role) this.role.set(j.role);
    } catch {}
  }
}
