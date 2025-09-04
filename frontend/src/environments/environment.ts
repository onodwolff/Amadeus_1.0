export const environment = {
  production: false,
  api: (window as any).__API__ || 'http://localhost:8000/api',
  ws:  (window as any).__WS__  || 'ws://localhost:8000/api/market/ws',
};
