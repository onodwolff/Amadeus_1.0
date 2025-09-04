import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Schema = any;

@Component({
  standalone: true,
  selector: 'app-json-schema-form',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="grid gap-3">
    @for (key of keys(); track key) {
      <div>
        <label class="block text-sm mb-1">{{ key }}</label>
        @if (schema.properties[key].type === 'string') {
          <input class="border rounded p-2 w-full" [(ngModel)]="model[key]">
        } @else if (schema.properties[key].type === 'number' || schema.properties[key].type === 'integer') {
          <input type="number" class="border rounded p-2 w-full" [(ngModel)]="model[key]">
        } @else if (schema.properties[key].type === 'boolean') {
          <input type="checkbox" [(ngModel)]="model[key]">
        } @else {
          <input class="border rounded p-2 w-full" [(ngModel)]="model[key]">
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
