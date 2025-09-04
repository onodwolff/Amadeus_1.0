import { Routes } from '@angular/router';
import { MarketPage } from './market/market.page';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'market', pathMatch: 'full' },
  { path: 'market', component: MarketPage },
  // Заглушки под будущее:
  // { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage) },
  // { path: 'strategies', loadComponent: () => import('./strategies/strategies.page').then(m => m.StrategiesPage) },
  // { path: 'risk', loadComponent: () => import('./risk/risk.page').then(m => m.RiskPage) },
  // { path: 'history', loadComponent: () => import('./history/history.page').then(m => m.HistoryPage) },
  // { path: 'logs', loadComponent: () => import('./logs/logs.page').then(m => m.LogsPage) },
];
