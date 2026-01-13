import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { routes } from './app.routes';
import { vi_VN, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import vi from '@angular/common/locales/vi';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './services/config/auth.interceptor.config';
import AuthGuard from './services/config/auth.guard.config';
import UnauthGuard from './services/config/auth.unguard.config';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReuseStrategyConfig } from './services/config/route-reuse-strategy.config';
import { EnvironmentService } from './services/common/environment.service';
import { APP_INITIALIZER } from '@angular/core';

registerLocaleData(vi);
const icons: IconDefinition[] = Object.values(AllIcons);

export function initApp(envService: EnvironmentService) {
  return () => envService.loadEnvironment();
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: ReuseStrategyConfig },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNzI18n(vi_VN),
    importProvidersFrom(FormsModule),
    provideNzIcons(icons),
    provideAnimationsAsync(),
    // provideNoopAnimations(),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    provideHttpClient(),
    AuthGuard,
    UnauthGuard,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [EnvironmentService],
      multi: true
    },
  ]
};
