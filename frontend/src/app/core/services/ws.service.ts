import { Injectable } from '@angular/core';
import { Subject, interval, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WsService {
  private socket?: WebSocket;
  private stop$ = new Subject<void>();
  private baseOverride?: string;

  public messages$ = new Subject<any>();
  public stream$ = new Subject<Event>();

  private get baseUrl(): string {
    if (this.baseOverride) return this.baseOverride;

    return String((environment as any).api || 'http://127.0.0.1:8100/api')
      .replace(/\/$/, '')
      .replace(/^http/, 'ws')
      .replace(/\/api(?:\/.*)?$/, '/api/ws/');
  }

  setBaseUrl(url: string) {
    this.baseOverride = url
      ? String(url)
          .replace(/\/$/, '')
          .replace(/^http/, 'ws')
          .replace(/\/api(?:\/.*)?$/, '/api/ws/')
      : undefined;
  }

  connect(channel: string = ''): WebSocket | undefined {
    this.stop$.next();

    if ((environment as any).demo) {
      queueMicrotask(() => this.stream$.next(new Event('open')));
      let last = 50000;
      interval(800).pipe(takeUntil(this.stop$)).subscribe(() => {
        const chg = (Math.random() - 0.5) * 20;
        last = Math.max(100, last + chg);
        const msg = {
          type: 'trade',
          symbol: 'BTCUSDT',
          ts: Date.now(),
          side: chg >= 0 ? 'buy' : 'sell',
          price: +last.toFixed(2),
          qty: +(Math.random() * 0.5 + 0.01).toFixed(3),
        };
        this.messages$.next(msg);
      });
      return undefined;
    }

    // reset subjects on reconnect so errors propagate again
    if (this.messages$.isStopped) this.messages$ = new Subject<any>();
    if (this.stream$.isStopped) this.stream$ = new Subject<Event>();

    const url = this.baseUrl + channel;

    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      this.stream$.error(err as any);
      this.messages$.error(err);
      return undefined;
    }
    this.socket = ws;

    ws.onopen = (evt) => this.stream$.next(evt);
    ws.onclose = (evt) => {
      if (evt.wasClean) this.stream$.next(evt);
      else {
        this.stream$.error(evt as any);
        this.messages$.error(new Error(`WebSocket closed: ${evt.code}`));
      }
    };
    ws.onerror = (evt) => {
      this.stream$.error(evt as any);
      this.messages$.error(new Error('Connection lost. Please retry.'));
    };
    ws.onmessage = (evt) => {
      this.stream$.next(evt);
      try {
        this.messages$.next(JSON.parse(evt.data));
      } catch {
        this.messages$.next(evt.data);
      }
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
    if (this.socket) {
      try {
        this.socket.close();
      } finally {
        this.socket = undefined;
      }
    }
  }
}
