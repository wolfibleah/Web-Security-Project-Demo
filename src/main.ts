import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Register } from './app/register/register';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';
import 'zone.js';

bootstrapApplication(App, {
  providers: [provideRouter(routes), provideHttpClient()],
});
