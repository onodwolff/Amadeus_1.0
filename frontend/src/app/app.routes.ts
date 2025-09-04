import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MarketComponent } from './features/market/market.component';
import { StrategiesComponent } from './features/strategies/strategies.component';
import { RiskComponent } from './features/risk/risk.component';
import { OrdersComponent } from './features/orders/orders.component';
import { PortfolioComponent } from './features/portfolio/portfolio.component';
import { BacktestComponent } from './features/backtest/backtest.component';
import { KeysComponent } from './features/keys/keys.component';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { AuditComponent } from './features/audit/audit.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'market', component: MarketComponent },
  { path: 'strategies', component: StrategiesComponent },
  { path: 'risk', component: RiskComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: 'backtest', component: BacktestComponent },
  { path: 'keys', component: KeysComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'audit', component: AuditComponent },
];
