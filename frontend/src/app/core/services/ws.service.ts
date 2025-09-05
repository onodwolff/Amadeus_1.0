import { Injectable } from '@angular/core';
import { Subject, interval, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WsService {
  private socket?: WebSocket;
  private stop$ = new Subject<void>();
  private win: any = (globalThis as any);
  private baseOverride?: string;

  public readonly messages$ = new Subject<any>();
  public readonly stream$ = new Subject<Event>();

  private get baseUrl(): string {
    if (this.baseOverride) return this.baseOverride;

    const envAny: any = environment as any;
    const apiConf = envAny.api;
    const httpBase: string =
      this.win.__API__ ||
      (typeof apiConf === 'string' ? apiConf : apiConf?.baseUrl) ||
      'http://127.0.0.1:8100';

    const wsBase = this.win.__WS__ || envAny.ws;
    const base = wsBase
      ? String(wsBase).replace(/\/$/, '')
      : String(httpBase).replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';

    return base;
  }

  setBaseUrl(url: string) {
    this.baseOverride = url ? String(url).replace(/\/$/, '') : undefined;
  }

  connect(path: string = ''): WebSocket | undefined {
    this.stop$.next();

    if ((environment as any).demo) {
      queueMicrotask(() => this.stream$.next(new Event('open')));
      let last = 50000;
      interval(800).pipe(takeUntil(this.stop$)).subscribe(() => {
        const chg = (Math.random() - 0.5) * 20;
        last = Math.max(100, last + chg);
        const msg = { type:'trade', symbol:'BTCUSDT', ts: Date.now(), side: chg >= 0 ? 'buy' : 'sell', price: +last.toFixed(2), qty: +(Math.random()*0.5+0.01).toFixed(3) };
        this.messages$.next(msg);
      });
      return undefined;
    }

    const base = this.baseUrl;
    const adj = path ? (path.startsWith('/') ? path : '/' + path) : '';
    const url = path && path.includes('://') ? path : base + adj;

    if (this.socket) {
      try { this.socket.close(); } catch {}
    }

    const ws = new WebSocket(url);
    this.socket = ws;

    ws.onopen = (evt) => this.stream$.next(evt);
    ws.onclose = (evt) => this.stream$.next(evt);
    ws.onerror = (evt) => this.stream$.next(evt as any);
    ws.onmessage = (evt) => {
      this.stream$.next(evt);
      try { this.messages$.next(JSON.parse(evt.data)); }
      catch { this.messages$.next(evt.data); }
    };

    return ws;
  }

  send(obj: any) {
    if ((environment as any).demo) return;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof obj === 'string' ? obj : JSON.stringify(obj));
    }
  }

  close() {
    this.stop$.next();
    if (this.socket) { try { this.socket.close(); } finally { this.socket = undefined; } }
  }
}
