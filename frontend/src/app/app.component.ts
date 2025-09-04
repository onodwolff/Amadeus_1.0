import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
  <nav>
    <a routerLink="/">Dashboard</a> | <a routerLink="/market">Market</a> | <a routerLink="/strategies">Strategies</a>
  </nav>
  <router-outlet></router-outlet>
  `
})
export class AppComponent {}
