import { Injectable } from '@angular/core';
import { Subject, interval, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WsService {
  private socket?: WebSocket;
  private stop$ = new Subject<void>();

  // Parsed JSON messages
  public readonly messages$ = new Subject<any>();
  // Raw events (open/close/error/message Event objects)
  public readonly stream$ = new Subject<Event>();

  private buildBase(): string {
    const envAny: any = environment as any;
    const apiConf = envAny.api;
    const httpBase: string =
      (typeof apiConf === 'string' ? apiConf : apiConf?.baseUrl) ||
      'http://127.0.0.1:8100';

    const base = envAny.ws
      ? String(envAny.ws).replace(/\/$/, '')
      : String(httpBase).replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';

    return base;
  }

  connect(path: string = ''): WebSocket | undefined {
    this.stop$.next();

    // DEMO mode: synthesize a feed
    if ((environment as any).demo) {
      // fake open
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

    // REAL WS
    const base = this.buildBase();
    const adj = path ? (path.startsWith('/') ? path : '/' + path) : '';
    const url = base + adj;

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
      try {
        const data = JSON.parse(evt.data);
        this.messages$.next(data);
      } catch {
        this.messages$.next(evt.data);
      }
    };

    return ws;
  }

  send(obj: any) {
    if ((environment as any).demo) return; // no-op in demo
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof obj === 'string' ? obj : JSON.stringify(obj));
    }
  }

  close() {
    this.stop$.next();
    if (this.socket) {
      try { this.socket.close(); } finally { this.socket = undefined; }
    }
  }
}
