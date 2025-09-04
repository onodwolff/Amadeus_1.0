import { Injectable, signal } from '@angular/core';

export interface BookLevel { price:number; size:number; }
export interface BookMsg { ts:number; symbol:string; bids:BookLevel[]; asks:BookLevel[]; }
export interface TradeMsg { ts:number; symbol:string; price:number; size:number; side:'buy'|'sell'; }

@Injectable({ providedIn: 'root' })
export class MarketStore {
  symbol = signal('BTCUSDT');
  book = signal<BookMsg | null>(null);
  trades = signal<TradeMsg[]>([]);

  pushBook(m: BookMsg) { this.book.set(m); }
  pushTrade(t: TradeMsg) { this.trades.update(arr => (arr.length>200? arr.slice(-200):arr).concat(t)); }
}
