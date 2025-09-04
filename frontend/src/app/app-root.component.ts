import { Component } from '@angular/core';
import { AppShellComponent } from './shell/app-shell.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [AppShellComponent],
  template: `<app-shell></app-shell>`
})
export class AppRootComponent {}
