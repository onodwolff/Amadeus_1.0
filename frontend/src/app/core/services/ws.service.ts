import { Injectable, signal } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({ providedIn: 'root' })
export class WsService {
  private sockets = new Map<string, WebSocketSubject<any>>();
  public lastMessage = signal<any | null>(null);

  subscribe(url: string, onMessage: (msg:any)=>void) {
    let sock = this.sockets.get(url);
    if (!sock) {
      sock = webSocket({ url });
      this.sockets.set(url, sock);
      sock.subscribe({
        next: (msg) => { this.lastMessage.set(msg); onMessage(msg); },
        error: () => { /* noop */ },
        complete: () => { /* noop */ },
      });
    }
    return () => { sock?.complete(); this.sockets.delete(url); };
  }
}
