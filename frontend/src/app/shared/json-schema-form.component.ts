import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Schema = any;

@Component({
  standalone: true,
  selector: 'app-json-schema-form',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="grid gap-3" *ngIf="schema">
    <ng-container *ngFor="let key of keys()">
      <label class="block text-sm mb-1">{{ key }}</label>
      <ng-container [ngSwitch]="typeOf(key)">
        <input *ngSwitchCase="'string'" class="border rounded p-2 w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()" />
        <input *ngSwitchCase="'number'" type="number" class="border rounded p-2 w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()" />
        <input *ngSwitchCase="'integer'" type="number" class="border rounded p-2 w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()" />
        <input *ngSwitchCase="'boolean'" type="checkbox" class="mr-2" [(ngModel)]="model[key]" (ngModelChange)="emit()" />
        <select *ngSwitchCase="'enum'" class="border rounded p-2 w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()">
          <option *ngFor="let v of schema.properties[key].enum" [value]="v">{{ v }}</option>
        </select>
        <input *ngSwitchDefault class="border rounded p-2 w-full" [(ngModel)]="model[key]" (ngModelChange)="emit()" />
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
