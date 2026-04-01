import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

let isRefreshing = false;

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // No interceptar rutas de autenticación
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = authService.getToken();
  const refreshToken = authService.getRefreshToken();
  
  if (!token || !refreshToken) {
    return next(req);
  }

  // Verificar si el token expira en menos de 5 minutos
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Si el token expira en menos de 5 minutos, refrescarlo
    if (exp - now < fiveMinutes && !isRefreshing) {
      isRefreshing = true;
      
      return authService.refreshToken().pipe(
        switchMap((response) => {
          isRefreshing = false;
          authService.guardarSesion(response.token, response.role, response.email, response.refreshToken);
          
          const clonedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${response.token}` }
          });
          return next(clonedReq);
        }),
        catchError((error) => {
          isRefreshing = false;
          localStorage.clear();
          router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
          return throwError(() => error);
        })
      );
    }
  } catch (e) {
    // Error al decodificar el token
  }

  // Manejar errores 403 (token expirado)
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403 && !isRefreshing && refreshToken) {
        isRefreshing = true;
        
        return authService.refreshToken().pipe(
          switchMap((response) => {
            isRefreshing = false;
            authService.guardarSesion(response.token, response.role, response.email, response.refreshToken);
            
            const clonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.token}` }
            });
            return next(clonedReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            localStorage.clear();
            router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
            return throwError(() => refreshError);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};
