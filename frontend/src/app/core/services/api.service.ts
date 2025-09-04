import { Injectable } from '@angular/core';

export interface Candle { ts:number; o:number; h:number; l:number; c:number; v:number; tf:string; symbol:string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  base = (window as any).__API__ || 'http://localhost:8000/api';
  token = (window as any).__TOKEN__ || '';

  private headers() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  async getOHLCV(symbol: string, tf = '1m', limit = 200): Promise<Candle[]> {
    const url = `${this.base}/market/ohlcv?symbol=${encodeURIComponent(symbol)}&tf=${tf}&limit=${limit}`;
    const r = await fetch(url, { headers: this.headers() });
    return await r.json();
  }

  async listStrategies(): Promise<{id:string; running:boolean}[]> {
    const r = await fetch(`${this.base}/strategies`, { headers: this.headers() });
    return await r.json();
  }
  async getSchema(id: string) {
    const r = await fetch(`${this.base}/strategies/${id}/schema`, { headers: this.headers() });
    return await r.json();
  }
  async startStrategy(id: string, cfg: any) {
    const r = await fetch(`${this.base}/strategies/${id}/start`, {
      method:'POST', headers: { 'Content-Type':'application/json', ...this.headers() }, body: JSON.stringify(cfg)
    });
    return await r.json();
  }
  async stopStrategy(id: string) {
    const r = await fetch(`${this.base}/strategies/${id}/stop`, { method:'POST', headers: this.headers() });
    return await r.json();
  }
}
