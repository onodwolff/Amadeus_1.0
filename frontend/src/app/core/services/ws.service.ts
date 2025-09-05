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
      'http://127.0.0.1:8100/api';

    const apiRoot = String(httpBase).replace(/\/$/, '');
    const derived =
      apiRoot
        .replace(/\/api(?:\/.*)?$/, '') +
      '/api/ws';
    const wsBase = this.win.__WS__ || derived;
    return String(wsBase).replace(/\/$/, '');
  }

  setBaseUrl(url: string) {
    this.baseOverride = url ? String(url).replace(/\/$/, '') : undefined;
  }

  connect(channel: string = ''): WebSocket | undefined {
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

    const adj = channel ? '/' + String(channel).replace(/^\//, '') : '';
    const base = this.baseUrl.replace(/^http/, 'ws');
    const url = base + adj;

    if (this.socket) {
      try { this.socket.close(); } catch {}
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      const evt = new Event('error');
      this.stream$.next(evt);
      this.messages$.next({ type: 'error', message: 'WebSocket connection failed', error: err });
      return undefined;
    }
    this.socket = ws;

    ws.onopen = (evt) => this.stream$.next(evt);
    ws.onclose = (evt) => {
      this.stream$.next(evt);
      if (!evt.wasClean) {
        this.messages$.next({ type: 'error', message: `WebSocket closed: ${evt.code}` });
      }
    };
    ws.onerror = (evt) => {
      this.stream$.next(evt as any);
      this.messages$.next({ type: 'error', message: 'Connection lost. Please retry.', event: evt });
    };
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
