import { Routes } from '@angular/router';
import { MarketPage } from './market/market.page';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { StrategiesPage } from './pages/strategies.page';
import { StrategyDetailComponent } from './features/strategy-detail/strategy-detail.component';
import { RiskPage } from './pages/risk.page';
import { HistoryPage } from './pages/history.page';
import { LogsPage } from './pages/logs.page';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'market', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'market', component: MarketPage },
  { path: 'strategies', component: StrategiesPage },
  { path: 'strategies/:sid', component: StrategyDetailComponent },
  { path: 'risk', component: RiskPage },
  { path: 'history', component: HistoryPage },
  { path: 'logs', component: LogsPage },
  { path: '**', redirectTo: 'market' }
];
