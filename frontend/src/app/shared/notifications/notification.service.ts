import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private toast: MessageService) {}
  success(detail:string, summary='Успех'){ this.toast.add({ severity:'success', summary, detail }); }
  warn(detail:string, summary='Внимание'){ this.toast.add({ severity:'warn', summary, detail }); }
  error(detail:string, summary='Ошибка'){ this.toast.add({ severity:'error', summary, detail }); }
  info(detail:string, summary='Инфо'){ this.toast.add({ severity:'info', summary, detail }); }
}
