import { Component } from '@angular/core';

@Component({
  selector: 'app-logs',
  standalone: true,
  template: `
    <h1>Logs</h1>
    <div class="card" style="padding:12px;margin-top:8px;">Системные логи/уведомления (стаб).</div>
  `
})
export class LogsPage {}
