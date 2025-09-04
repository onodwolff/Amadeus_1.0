import { Routes } from '@angular/router';
import { TradesComponent } from './features/trades/trades.component';
import { RiskComponent } from './features/risk/risk.component';

export const routes: Routes = [
  { path: 'trades', component: TradesComponent },
  { path: 'riskx', component: RiskComponent },
];
