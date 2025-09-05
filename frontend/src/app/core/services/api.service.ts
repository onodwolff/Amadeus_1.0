import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RiskStatus } from '../../models';

export interface Candle { ts:number; o:number; h:number; l:number; c:number; v:number; tf:string; symbol:string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private win: any = (globalThis as any);

  private get baseRoot(): string {
    const envAny: any = environment as any;
    const apiConf = envAny.api;
    const httpBase: string =
      this.win.__API__ ||
      (typeof apiConf === 'string' ? apiConf : apiConf?.baseUrl) ||
      'http://localhost:8000/api';
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

  get<T = any>(path: string): Observable<T>    { return this.http.get<T>(this.url(path), { headers: this.headers() }); }
  post<T = any>(path: string, body: any): Observable<T> { return this.http.post<T>(this.url(path), body, { headers: this.headers() }); }
  put<T = any>(path: string, body: any): Observable<T>  { return this.http.put<T>(this.url(path), body, { headers: this.headers() }); }
  delete<T = any>(path: string): Observable<T>          { return this.http.delete<T>(this.url(path), { headers: this.headers() }); }

  running$ = new BehaviorSubject<boolean>(false);
  setRunning(v: boolean) { this.running$.next(!!v); }

  // status endpoint not available yet
  start(body?: any) { return this.post('/start', body ?? {}); }
  stop()  { return this.post('/stop', {}); }
  cmd(command: string, payload: any = {}) { return this.post('/cmd', { cmd: command, ...payload }); }

  getConfig()         { return this.get('/config'); }
  putConfig(cfg: any) { return this.put('/config', cfg); }
  getDefaultConfig()  { return this.get('/config/default'); }
  restoreConfig()     { return this.post('/config/restore', {}); }

  scan(body: any)     { return this.post('/scan', body); }

  // history and risk endpoints are disabled until backend support

  // Methods returning Promises
  getOHLCV(symbol: string, tf = '1m', limit = 200, exchange='mock', category='spot'): Promise<Candle[]> {
    const url = this.url(`/market/ohlcv?exchange=${exchange}&category=${category}&symbol=${encodeURIComponent(symbol)}&tf=${tf}&limit=${limit}`);
    return firstValueFrom(this.http.get<Candle[]>(url, { headers: this.headers() }));
  }

  listStrategies(): Promise<{id:string; running:boolean}[]> {
    const url = this.url('/strategies');
    return firstValueFrom(this.http.get<{id:string; running:boolean}[]>(url, { headers: this.headers() }));
  }

  getSchema(id: string) {
    const url = this.url(`/strategies/${id}/schema`);
    return firstValueFrom(this.http.get(url, { headers: this.headers() }));
  }

  startStrategy(id: string, cfg: any) {
    const url = this.url(`/strategies/${id}/start`);
    return firstValueFrom(this.http.post(url, cfg, { headers: this.headers() }));
  }

  stopStrategy(id: string) {
    const url = this.url(`/strategies/${id}/stop`);
    return firstValueFrom(this.http.post(url, {}, { headers: this.headers() }));
  }

  getStrategyReport(id: string, exchange: string, category: string, symbol: string) {
    const url = this.url(`/strategy/${id}/report?exchange=${exchange}&category=${category}&symbol=${symbol}`);
    return firstValueFrom(this.http.get<{report: any}>(url, { headers: this.headers() }));
  }

  getStrategyFills(id: string, exchange: string, category: string, symbol: string) {
    const url = this.url(`/strategy/${id}/fills?exchange=${exchange}&category=${category}&symbol=${symbol}`);
    return firstValueFrom(this.http.get<{items: any[]}>(url, { headers: this.headers() }));
  }

  // ---- risk endpoints ----

  getRiskStatus(): Promise<RiskStatus> {
    const url = this.url('/risk/status');
    return firstValueFrom(this.http.get<RiskStatus>(url, { headers: this.headers() }));
  }

  getRiskLimits() {
    const url = this.url('/risk/limits');
    return firstValueFrom(this.http.get(url, { headers: this.headers() }));
  }

  setRiskLimits(body: any) {
    const url = this.url('/risk/limits');
    return firstValueFrom(this.http.post(url, body, { headers: this.headers() }));
  }

  unlockRisk() {
    const url = this.url('/risk/unlock');
    return firstValueFrom(this.http.post(url, {}, { headers: this.headers() }));
  }

  getBalances() {
    const url = this.url('/portfolio/balances');
    return firstValueFrom(this.http.get(url, { headers: this.headers() }));
  }

  getPositions() {
    const url = this.url('/portfolio/positions');
    return firstValueFrom(this.http.get(url, { headers: this.headers() }));
  }

  getOrders(limit=100) {
    const url = this.url(`/orders?limit=${limit}`);
    return firstValueFrom(this.http.get(url, { headers: this.headers() }));
  }

  getFills(limit=200) {
    const url = this.url(`/orders/fills?limit=${limit}`);
    return firstValueFrom(this.http.get(url, { headers: this.headers() }));
  }

  runBacktest(cfg: any) {
    const url = this.url('/backtest/run');
    return firstValueFrom(this.http.post(url, cfg, { headers: this.headers() }));
  }

  saveKeys(body: any) {
    const url = this.url('/keys');
    return firstValueFrom(this.http.post(url, body, { headers: this.headers() }));
  }

  getKeys(exchange: string, category: string) {
    const url = this.url(`/keys?exchange=${exchange}&category=${category}`);
    return firstValueFrom(this.http.get(url, { headers: this.headers() }));
  }

  // dashboard summary endpoint not available yet
}

