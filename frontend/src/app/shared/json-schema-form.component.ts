import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '../prime-ng.module';

type Schema = any;

@Component({
  standalone: true,
  selector: 'app-json-schema-form',
  imports: [CommonModule, FormsModule, PrimeNgModule],
  template: `
  <div class="grid gap-3" *ngIf="schema">
    <ng-container *ngFor="let key of keys()">
      <label class="block text-sm mb-1">{{ key }}</label>
      <ng-container [ngSwitch]="typeOf(key)">
        <p-inputText *ngSwitchCase="'string'" class="w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()"></p-inputText>
        <p-inputNumber *ngSwitchCase="'number'" class="w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()"></p-inputNumber>
        <p-inputNumber *ngSwitchCase="'integer'" class="w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()"></p-inputNumber>
        <p-inputSwitch *ngSwitchCase="'boolean'" [(ngModel)]="model[key]" (ngModelChange)="emit()"></p-inputSwitch>
        <p-dropdown *ngSwitchCase="'enum'" class="w-full" [options]="schema.properties[key].enum.map(v => ({label:v, value:v}))" [(ngModel)]="model[key]" (ngModelChange)="emit()"></p-dropdown>
        <p-inputText *ngSwitchDefault class="w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()"></p-inputText>
      </ng-container>
      <div class="text-xs text-gray-500" *ngIf="schema.properties[key]?.description">{{ schema.properties[key].description }}</div>
    </ng-container>
  </div>
  `
})
export class JsonSchemaFormComponent {
  @Input() schema!: Schema;
  @Input() model: any = {};
  @Output() modelChange = new EventEmitter<any>();

  keys() { return Object.keys(this.schema?.properties || {}); }
  typeOf(k: string) {
    const p = this.schema.properties[k] || {};
    if (p.enum) return 'enum';
    return p.type || 'string';
  }
  ngOnChanges() {
    // set defaults
    for (const [k,p] of Object.entries<any>(this.schema?.properties || {})) {
      if (this.model[k] === undefined && p.default !== undefined) this.model[k] = p.default;
    }
    this.emit();
  }
  emit(){ this.modelChange.emit(this.model); }
}
