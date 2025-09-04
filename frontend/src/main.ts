import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { demoApiInterceptor } from './app/interceptors/demo-api.interceptor';

import { AppRootComponent } from './app/app-root.component';
import { environment } from './environments/environment';

const httpProviders = environment.demo
  ? [provideHttpClient(withInterceptors([demoApiInterceptor]))]
  : [provideHttpClient()];

bootstrapApplication(AppRootComponent, {
  providers: [
    provideRouter(routes),
    ...httpProviders,
  ],
}).catch(err => console.error(err));
