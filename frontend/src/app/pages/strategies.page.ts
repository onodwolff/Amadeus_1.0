import { Component } from '@angular/core';
import { StrategiesModernComponent } from '../features/strategies/strategies-modern.component';

@Component({
  selector: 'app-strategies',
  standalone: true,
  imports: [StrategiesModernComponent],
  template: `
    <div class="p-4">
      <app-strategies-modern (create)="onCreate()" (importCfg)="onImport()"></app-strategies-modern>
    </div>
  `
})
export class StrategiesPage {
  onCreate() {
    console.log('Create strategy');
  }

  onImport() {
    console.log('Import strategy config');
  }
}
