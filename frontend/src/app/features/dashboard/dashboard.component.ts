import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  template: `
  <div class="p-4">
    <h2 class="text-xl font-semibold">Dashboard</h2>
    <p class="text-sm text-gray-600">PNL, equity, margin, active strategies — WIP</p>
  </div>`
})
export class DashboardComponent {}
