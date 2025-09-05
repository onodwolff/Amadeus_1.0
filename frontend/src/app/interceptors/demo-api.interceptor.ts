import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../environments/environment';

function json(body: any, status = 200) {
  return new HttpResponse({ status, body });
}

export const demoApiInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  if (!environment || !(environment as any).demo) return next(req);

  const url = req.url.replace(/https?:\/\/[^/]+/, '');
  const method = req.method.toUpperCase();
  const lag = 200;

    if (method === 'GET' && url.endsWith('/status')) {
      return of(json({ ok: true, running: true, ts: Date.now(), version: 'v0.1.0-demo' })).pipe(delay(lag));
    }
    if (method === 'GET' && url.endsWith('/dashboard/summary')) {
      return of(json({
        equity: 125000,
        delta: 2.35,
        pnl: 1432.12,
        sharpe: 1.82,
        strategies: 3,
        open_orders: 12,
        fill_ratio: 0.73,
      })).pipe(delay(lag));
    }
    if (method === 'POST' && url.endsWith('/start')) return of(json({ ok: true, started: true })).pipe(delay(lag));
  if (method === 'POST' && url.endsWith('/stop'))  return of(json({ ok: true, stopped: true })).pipe(delay(lag));
  if (method === 'POST' && url.endsWith('/cmd'))   return of(json({ ok: true, result: 'ack' })).pipe(delay(lag));

  if (method === 'GET' && url.endsWith('/config')) {
    return of(json({
      exchange: 'binance',
      symbol: 'BTCUSDT',
      timeframes: ['1m','5m','15m'],
      strategy: { id: 'sample_ema_crossover', fast: 12, slow: 26 },
      risk: { maxLeverage: 2, maxPos: 0.5, ddDaily: 0.05 }
    })).pipe(delay(lag));
  }
  if (method === 'PUT' && url.endsWith('/config')) return of(json({ ok: true })).pipe(delay(lag));
  if (method === 'GET' && url.endsWith('/config/default')) {
    return of(json({
      exchange: 'bybit',
      symbol: 'ETHUSDT',
      timeframes: ['1m','3m','15m'],
      strategy: { id: 'mean_reversion', lookback: 100, threshold: 1.5 },
      risk: { maxLeverage: 1, maxPos: 1.0, ddDaily: 0.03 }
    })).pipe(delay(lag));
  }
  if (method === 'POST' && url.endsWith('/config/restore')) return of(json({ ok: true, restored: true })).pipe(delay(lag));

  if (method === 'GET' && url.startsWith('/history/stats')) {
    return of(json({ pnl: 1423.54, sharpe: 1.82, maxDD: -0.071, trades: 321, winRate: 0.56, exposure: 0.42 })).pipe(delay(lag));
  }
  if (method === 'GET' && url.startsWith('/history/trades')) {
    const items = Array.from({length: 25}).map((_,i)=>({ id:i+1, ts: Date.now()-i*60000, side: i%2?'sell':'buy', price: 50000 + (i-12)*10, qty: +(Math.random()*0.5+0.01).toFixed(3) }));
    return of(json({ items, total: 25 })).pipe(delay(lag));
  }
  if (method === 'GET' && url.startsWith('/history/orders')) {
    const items = Array.from({length: 20}).map((_,i)=>({ id:i+1, ts: Date.now()-i*90000, type: i%3? 'limit':'market', price: 50000 + (i-10)*8, qty: +(Math.random()*0.8+0.05).toFixed(3), status: i%4? 'filled':'canceled' }));
    return of(json({ items, total: 20 })).pipe(delay(lag));
  }
  if (method === 'POST' && url.startsWith('/history/clear')) return of(json({ ok: true })).pipe(delay(lag));

  if (method === 'GET' && url.endsWith('/risk/status')) return of(json({ locked: false, limits: { maxPos: 1.0, ddDaily: 0.05 }, breaches: [] })).pipe(delay(lag));
  if (method === 'POST' && url.endsWith('/risk/unlock')) return of(json({ ok: true, locked: false })).pipe(delay(lag));

  if (method === 'POST' && url.endsWith('/scan')) {
    return of(json({ ok: true, signals: [{ symbol:'BTCUSDT', score: 0.73 }, { symbol:'SOLUSDT', score: -0.21 }] })).pipe(delay(lag));
  }

  return next(req);
};
