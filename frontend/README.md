# Frontend

## API & WebSocket configuration

The Angular services resolve their base URLs at runtime in the following order:

1. The global `window.__API__` variable, if set.
2. The `api` value in `src/environments/environment*.ts`.

`WsService` converts the API base to a WebSocket URL (switching to `ws` and appending `/ws`).
A WebSocket specific endpoint may be supplied via `window.__WS__` or the `ws` value in the environment files.

Both services expose the final base URL without trailing slashes.

### Runtime override

The WebSocket base can be changed after boot by calling `setBaseUrl()`:

```ts
constructor(private ws: WsService) {}

ngOnInit() {
  this.ws.setBaseUrl('wss://example.com/ws');
}
```

This method replaces the derived URL until another value is provided.
