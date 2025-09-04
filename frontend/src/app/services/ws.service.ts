import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WsService {
  private socket?: WebSocket;

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

  connect(path: string = ''): WebSocket {
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
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof obj === 'string' ? obj : JSON.stringify(obj));
    }
  }

  close() {
    if (this.socket) {
      try { this.socket.close(); } finally { this.socket = undefined; }
    }
  }
}
