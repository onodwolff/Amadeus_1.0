import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';

@NgModule({
  exports: [
    ButtonModule,
    CardModule,
    TableModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    BadgeModule
  ]
})
export class PrimeNgModule {}
