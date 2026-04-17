import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { tokenInterceptor } from './app/interceptors/token.interceptor';
import { tokenRefreshInterceptor } from './app/interceptors/token-refresh.interceptor';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { importProvidersFrom } from '@angular/core';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor, tokenRefreshInterceptor])),
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
});
