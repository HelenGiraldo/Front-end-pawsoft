import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { tokenRefreshInterceptor } from './token-refresh.interceptor';
import { AuthService, LoginResponse } from '../services/auth';

describe('TokenRefreshInterceptor - Pruebas Funcionales (FE-INT-01 a FE-INT-11)', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', [
      'getToken', 'getRefreshToken', 'refreshToken', 'guardarSesion'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // Helper para crear token JWT mock
  function createMockJWT(expirationMinutes: number): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (expirationMinutes * 60);
    const payload = { exp, sub: 'user123' };
    const encodedPayload = btoa(JSON.stringify(payload));
    return `header.${encodedPayload}.signature`;
  }

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-01: Petición sin token - debe pasar sin interceptar
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-01: Petición sin token', () => {
    it('debe permitir peticiones cuando no hay token', () => {
      authService.getToken.and.returnValue(null);
      authService.getRefreshToken.and.returnValue(null);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.method).toBe('GET');
      req.flush({ data: 'test' });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-02: Petición a endpoint de auth - debe pasar sin interceptar
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-02: Petición a endpoint de auth', () => {
    it('debe permitir peticiones a /auth/ sin interceptar', () => {
      authService.getToken.and.returnValue('valid-token');
      authService.getRefreshToken.and.returnValue('refresh-token');

      httpClient.post('/api/auth/login', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-03: Token válido - debe pasar sin renovar
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-03: Token válido', () => {
    it('debe permitir peticiones con token válido sin renovar', () => {
      const validToken = createMockJWT(30); // Expira en 30 minutos
      authService.getToken.and.returnValue(validToken);
      authService.getRefreshToken.and.returnValue('refresh-token');

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.method).toBe('GET');
      expect(authService.refreshToken).not.toHaveBeenCalled();
      req.flush({ data: 'test' });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-04: Token próximo a expirar - renovación proactiva
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-04: Token próximo a expirar', () => {
    it('debe renovar token proactivamente cuando expira en menos de 5 minutos', () => {
      const expiringToken = createMockJWT(3); // Expira en 3 minutos
      const newToken = createMockJWT(60); // Nuevo token válido por 1 hora
      
      authService.getToken.and.returnValue(expiringToken);
      authService.getRefreshToken.and.returnValue('refresh-token');
      
      const refreshResponse: LoginResponse = {
        token: newToken,
        role: 'ROLE_CLIENTE',
        email: 'user@test.com',
        message: 'Token refreshed',
        refreshToken: 'new-refresh-token',
        mustChangePassword: false
      };
      
      authService.refreshToken.and.returnValue(of(refreshResponse));

      httpClient.get('/api/test').subscribe();

      // Primero debe llamar al refresh
      const refreshReq = httpMock.expectOne('/api/auth/refresh');
      expect(refreshReq.request.method).toBe('POST');
      refreshReq.flush(refreshResponse);

      // Luego debe hacer la petición original con el nuevo token
      const originalReq = httpMock.expectOne('/api/test');
      expect(originalReq.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      originalReq.flush({ data: 'test' });

      expect(authService.guardarSesion).toHaveBeenCalledWith(
        newToken, 'ROLE_CLIENTE', 'user@test.com', 'new-refresh-token'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-05: Error 403 con token expirado - renovación reactiva
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-05: Error 403 con token expirado', () => {
    it('debe renovar token cuando recibe 403 por token expirado', () => {
      const expiredToken = createMockJWT(-10); // Token ya expirado
      const newToken = createMockJWT(60);
      
      authService.getToken.and.returnValue(expiredToken);
      authService.getRefreshToken.and.returnValue('refresh-token');
      
      const refreshResponse: LoginResponse = {
        token: newToken,
        role: 'ROLE_CLIENTE',
        email: 'user@test.com',
        message: 'Token refreshed',
        refreshToken: 'new-refresh-token',
        mustChangePassword: false
      };
      
      authService.refreshToken.and.returnValue(of(refreshResponse));

      httpClient.get('/api/test').subscribe({
        next: (response) => {
          expect(response).toEqual({ data: 'test' });
        }
      });

      // Primera petición falla con 403
      const firstReq = httpMock.expectOne('/api/test');
      firstReq.flush(
        { message: 'JWT token expired' },
        { status: 403, statusText: 'Forbidden' }
      );

      // Debe llamar al refresh
      const refreshReq = httpMock.expectOne('/api/auth/refresh');
      refreshReq.flush(refreshResponse);

      // Reintenta la petición original con nuevo token
      const retryReq = httpMock.expectOne('/api/test');
      expect(retryReq.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      retryReq.flush({ data: 'test' });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-06: Error 403 por permisos (RBAC) - no debe renovar
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-06: Error 403 por permisos RBAC', () => {
    it('no debe renovar token cuando 403 es por falta de permisos', () => {
      const validToken = createMockJWT(30);
      
      authService.getToken.and.returnValue(validToken);
      authService.getRefreshToken.and.returnValue('refresh-token');

      httpClient.get('/api/admin/users').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          expect(error.error.message).toBe('Access denied - insufficient permissions');
        }
      });

      const req = httpMock.expectOne('/api/admin/users');
      req.flush(
        { message: 'Access denied - insufficient permissions' },
        { status: 403, statusText: 'Forbidden' }
      );

      expect(authService.refreshToken).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-07: Fallo en renovación de token - logout automático
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-07: Fallo en renovación de token', () => {
    it('debe hacer logout cuando falla la renovación de token', () => {
      const expiredToken = createMockJWT(-10);
      
      authService.getToken.and.returnValue(expiredToken);
      authService.getRefreshToken.and.returnValue('invalid-refresh-token');
      authService.refreshToken.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
      );

      httpClient.get('/api/test').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      // Primera petición falla con 403
      const firstReq = httpMock.expectOne('/api/test');
      firstReq.flush(
        { message: 'JWT token expired' },
        { status: 403, statusText: 'Forbidden' }
      );

      // Intenta refresh pero falla
      const refreshReq = httpMock.expectOne('/api/auth/refresh');
      refreshReq.flush(
        { message: 'Invalid refresh token' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(router.navigate).toHaveBeenCalledWith(['/login'], { 
        queryParams: { reason: 'session-expired' } 
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-08: Token malformado - debe pasar sin renovar
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-08: Token malformado', () => {
    it('debe manejar token malformado sin renovar', () => {
      authService.getToken.and.returnValue('invalid.token.format');
      authService.getRefreshToken.and.returnValue('refresh-token');

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.method).toBe('GET');
      expect(authService.refreshToken).not.toHaveBeenCalled();
      req.flush({ data: 'test' });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-09: Múltiples peticiones concurrentes - una sola renovación
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-09: Múltiples peticiones concurrentes', () => {
    it('debe renovar token solo una vez para múltiples peticiones concurrentes', () => {
      const expiringToken = createMockJWT(3);
      const newToken = createMockJWT(60);
      
      authService.getToken.and.returnValue(expiringToken);
      authService.getRefreshToken.and.returnValue('refresh-token');
      
      const refreshResponse: LoginResponse = {
        token: newToken,
        role: 'ROLE_CLIENTE',
        email: 'user@test.com',
        message: 'Token refreshed',
        refreshToken: 'new-refresh-token',
        mustChangePassword: false
      };
      
      authService.refreshToken.and.returnValue(of(refreshResponse));

      // Hacer múltiples peticiones concurrentes
      httpClient.get('/api/test1').subscribe();
      httpClient.get('/api/test2').subscribe();
      httpClient.get('/api/test3').subscribe();

      // Solo debe haber una llamada al refresh
      const refreshReq = httpMock.expectOne('/api/auth/refresh');
      refreshReq.flush(refreshResponse);

      // Todas las peticiones originales deben usar el nuevo token
      const req1 = httpMock.expectOne('/api/test1');
      const req2 = httpMock.expectOne('/api/test2');
      const req3 = httpMock.expectOne('/api/test3');

      expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      expect(req3.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);

      req1.flush({ data: 'test1' });
      req2.flush({ data: 'test2' });
      req3.flush({ data: 'test3' });

      expect(authService.refreshToken).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-10: Sin refresh token disponible
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-10: Sin refresh token disponible', () => {
    it('debe pasar petición sin renovar cuando no hay refresh token', () => {
      const expiredToken = createMockJWT(-10);
      
      authService.getToken.and.returnValue(expiredToken);
      authService.getRefreshToken.and.returnValue(null);

      httpClient.get('/api/test').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(
        { message: 'JWT token expired' },
        { status: 403, statusText: 'Forbidden' }
      );

      expect(authService.refreshToken).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-INT-11: Limpieza de localStorage en logout automático
  // ═══════════════════════════════════════════════════════════════
  describe('FE-INT-11: Limpieza de localStorage', () => {
    it('debe limpiar localStorage cuando falla la renovación', () => {
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('refreshToken', 'invalid-refresh');
      localStorage.setItem('rol', 'ROLE_CLIENTE');
      localStorage.setItem('email', 'user@test.com');

      const expiredToken = createMockJWT(-10);
      
      authService.getToken.and.returnValue(expiredToken);
      authService.getRefreshToken.and.returnValue('invalid-refresh-token');
      authService.refreshToken.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401 }))
      );

      httpClient.get('/api/test').subscribe({
        error: () => {
          // Error esperado
        }
      });

      const firstReq = httpMock.expectOne('/api/test');
      firstReq.flush({ message: 'JWT expired' }, { status: 403, statusText: 'Forbidden' });

      const refreshReq = httpMock.expectOne('/api/auth/refresh');
      refreshReq.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });

      // Verificar que localStorage se limpió
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('rol')).toBeNull();
      expect(localStorage.getItem('email')).toBeNull();
    });
  });
});