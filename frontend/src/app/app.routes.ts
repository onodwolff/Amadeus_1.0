
import { Routes } from '@angular/router';
import { MarketPage } from './market/market.page';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'market', pathMatch: 'full' },
  { path: 'market', component: MarketPage },
];
