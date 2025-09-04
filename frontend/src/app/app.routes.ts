import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { MarketViewComponent } from './pages/market.component';
import { StrategiesComponent } from './pages/strategies.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'market', component: MarketViewComponent },
  { path: 'strategies', component: StrategiesComponent },
];
