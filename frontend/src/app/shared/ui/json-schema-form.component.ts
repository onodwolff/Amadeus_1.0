import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '../../prime-ng.module';

type Schema = any;

@Component({
  standalone: true,
  selector: 'app-json-schema-form',
  imports: [CommonModule, FormsModule, PrimeNgModule],
  template: `
  <div class="grid gap-3">
    @for (key of keys(); track key) {
      <div>
        <label class="block text-sm mb-1">{{ key }}</label>
        @if (schema.properties[key].type === 'string') {
          <p-inputText class="w-full" [(ngModel)]="model[key]"></p-inputText>
        } @else if (schema.properties[key].type === 'number' || schema.properties[key].type === 'integer') {
          <p-inputNumber class="w-full" [(ngModel)]="model[key]"></p-inputNumber>
        } @else if (schema.properties[key].type === 'boolean') {
          <p-inputSwitch [(ngModel)]="model[key]"></p-inputSwitch>
        } @else if (schema.properties[key].enum) {
          <p-dropdown class="w-full" [options]="schema.properties[key].enum.map(v => ({label: v, value: v}))" [(ngModel)]="model[key]"></p-dropdown>
        } @else {
          <p-inputText class="w-full" [(ngModel)]="model[key]"></p-inputText>
        }
      </div>
    }
  </div>
  `
})
export class JsonSchemaFormComponent {
  @Input() schema: Schema = { type:'object', properties:{} };
  @Input() model: any = {};
  @Output() modelChange = new EventEmitter<any>();

  keys() {
    return Object.keys(this.schema?.properties || {});
  }
}
