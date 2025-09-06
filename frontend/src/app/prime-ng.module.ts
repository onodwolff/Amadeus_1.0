import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';

@NgModule({
  exports: [
    ButtonModule,
    CardModule,
    TableModule,
    DropdownModule,
    DialogModule,
    ToastModule,
    BadgeModule,
    InputTextModule,
    FileUploadModule,
    MessagesModule,
    MessageModule,
    InputNumberModule,
    InputSwitchModule
  ]
})
export class PrimeNgModule {}
