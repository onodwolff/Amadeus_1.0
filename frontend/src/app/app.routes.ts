import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MarketComponent } from './features/market/market.component';
import { StrategiesComponent } from './features/strategies/strategies.component';
import { RiskComponent } from './features/risk/risk.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'market', component: MarketComponent },
  { path: 'strategies', component: StrategiesComponent },
  { path: 'risk', component: RiskComponent },
];
