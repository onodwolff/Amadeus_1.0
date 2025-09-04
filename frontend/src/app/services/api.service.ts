import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private win: any = (globalThis as any);

  private get baseRoot(): string {
    const envAny: any = environment as any;
    const apiConf = envAny.api;
    const httpBase: string =
      (this.win.__API__) ||
      (typeof apiConf === 'string' ? apiConf : apiConf?.baseUrl) ||
      'http://127.0.0.1:8100';
    return String(httpBase).replace(/\/$/, '');
  }

  private get token(): string {
    const envAny: any = environment as any;
    return this.win.__TOKEN__ || envAny.token || envAny.api?.token || '';
  }

  private headers(): HttpHeaders {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return new HttpHeaders(h);
  }

  url(path: string): string {
    if (!path.startsWith('/')) path = '/' + path;
    return this.baseRoot + path;
  }

  // Generic HTTP helpers (Observables, to match .subscribe() usage)
  get<T = any>(path: string): Observable<T>    { return this.http.get<T>(this.url(path), { headers: this.headers() }); }
  post<T = any>(path: string, body: any): Observable<T> { return this.http.post<T>(this.url(path), body, { headers: this.headers() }); }
  put<T = any>(path: string, body: any): Observable<T>  { return this.http.put<T>(this.url(path), body, { headers: this.headers() }); }
  delete<T = any>(path: string): Observable<T>          { return this.http.delete<T>(this.url(path), { headers: this.headers() }); }

  // ---- App-specific API (stubs compatible with existing components) ----
  // runtime state
  running$ = new BehaviorSubject<boolean>(false);
  setRunning(v: boolean) { this.running$.next(!!v); }

  status() { return this.get('/status'); }
  start(body?: any) { return this.post('/start', body ?? {}); }
  stop()  { return this.post('/stop', {}); }
  cmd(command: string, payload: any = {}) { return this.post('/cmd', { cmd: command, ...payload }); }

  // config
  getConfig()         { return this.get('/config'); }
  putConfig(cfg: any) { return this.put('/config', cfg); }
  getDefaultConfig()  { return this.get('/config/default'); }
  restoreConfig()     { return this.post('/config/restore', {}); }

  // scanner
  scan(body: any)     { return this.post('/scan', body); }

  // history
  historyStats()                      { return this.get('/history/stats'); }
  historyTrades(limit = 100, offset = 0) { return this.get(`/history/trades?limit=${limit}&offset=${offset}`); }
  historyOrders(limit = 100, offset = 0) { return this.get(`/history/orders?limit=${limit}&offset=${offset}`); }
  historyClear(kind: string)          { return this.post('/history/clear', { kind }); }
  historyExportUrl(kind: string)      { return this.url(`/history/export?kind=${encodeURIComponent(kind)}`); }

  // risk
  getRiskStatus() { return this.get('/risk/status'); }
  unlockRisk()    { return this.post('/risk/unlock', {}); }
}
