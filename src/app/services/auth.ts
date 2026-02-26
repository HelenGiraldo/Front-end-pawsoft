import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  register(name: string, email: string, password: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/register`, { name, email, password });
  }

  login(email: string, password: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
  }

  /**
   * Fase 2: valida el código OTP.
   * shareReplay(1) garantiza que aunque haya múltiples suscriptores,
   * la petición HTTP se ejecuta una sola vez.
   */
  verify2FA(email: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/verify-2fa?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
      {}
    ).pipe(shareReplay(1));
  }

  resend2FA(email: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/auth/resend-2fa?email=${encodeURIComponent(email)}`,
      {}
    );
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${environment.apiUrl}/auth/password-reset/confirm`, {
      token,
      newPassword
    });
  }

  requestPasswordReset(email: string) {
    return this.http.post(
      `${this.apiUrl}/auth/password-reset/request`,
      { email }
    );
  }

  guardarSesion(token: string, rol: string, email: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('email', email);
  }

  logout(): void { localStorage.clear(); }
  getToken(): string | null { return localStorage.getItem('token'); }
  getRol(): string | null { return localStorage.getItem('rol'); }
}
