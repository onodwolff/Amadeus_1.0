import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppShellComponent } from './app/layout/app-shell.component';
import { ThemeService } from './app/core/theme/theme.service';

bootstrapApplication(AppShellComponent, appConfig).then(ref => {
  const theme = ref.injector.get(ThemeService);
  theme.init();
});
