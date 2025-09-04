import { Routes } from '@angular/router';
import { AppShellComponent } from './shell/app-shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MarketComponent } from './features/market/market.component';
import { StrategiesModernComponent } from './features/strategies/strategies-modern.component';
export const routes: Routes = [
  { path: '', component: AppShellComponent, children: [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'market', component: MarketComponent },
    { path: 'strategies', component: StrategiesModernComponent },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  ]},
];
