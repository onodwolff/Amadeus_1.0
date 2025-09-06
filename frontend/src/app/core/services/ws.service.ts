import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WsService {
  private socket?: WebSocket;
  private baseOverride?: string;

  public messages$ = new Subject<any>();
  public stream$ = new Subject<Event>();
  public errors$ = new Subject<any>();
  public status$ = new BehaviorSubject<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  private computeBase(url?: string): string {
    return String(url || 'http://127.0.0.1:8100/api')
      .replace(/\/$/, '')
      .replace(/^http/, 'ws') + '/ws';
  }

  private get baseUrl(): string {
    return this.baseOverride || this.computeBase((environment as any).api);
  }

  setBaseUrl(url: string) {
    this.baseOverride = url ? this.computeBase(url) : undefined;
  }

  connect(channel = ''): WebSocket | undefined {
    if (this.socket) {
      try { this.socket.close(); } catch {}
      this.socket = undefined;
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}${channel ? '/' + channel.replace(/^\//, '') : ''}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      this.status$.next('error');
      this.errors$.next(err);
      return undefined;
    }
    this.socket = ws;
    this.status$.next('connecting');

    ws.onopen = evt => {
      this.status$.next('connected');
      this.stream$.next(evt);
    };
    ws.onclose = evt => {
      this.status$.next('disconnected');
      this.stream$.next(evt);
    };
    ws.onerror = evt => {
      this.status$.next('error');
      this.errors$.next(evt);
      this.stream$.next(evt);
    };
    ws.onmessage = evt => {
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
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof obj === 'string' ? obj : JSON.stringify(obj));
    }
  }

  close() {
    if (this.socket) {
      try {
        this.socket.close();
      } finally {
        this.socket = undefined;
        this.status$.next('disconnected');
      }
    }
  }
}
