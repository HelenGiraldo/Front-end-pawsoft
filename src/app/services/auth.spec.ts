import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';
import { InactivityService } from './inactivity.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let inactivitySpy: jasmine.SpyObj<InactivityService>;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    inactivitySpy = jasmine.createSpyObj('InactivityService', ['startWatching', 'stopWatching']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        provideRouter([]),
        { provide: InactivityService, useValue: inactivitySpy }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST to /auth/login with correct params', () => {
      const mockResponse = { message: 'OTP sent' };

      service.login('test@example.com', 'password123', 'recaptcha-token').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
        recaptchaToken: 'recaptcha-token'
      });
      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      service.login('test@example.com', 'wrong', 'token').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err.status).toBe(401)
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('verify2FA', () => {
    it('should POST to /auth/verify-2fa with email and code as query params', () => {
      const mockResponse = {
        token: 'mock-token',
        refreshToken: 'mock-refresh',
        role: 'ROLE_CLIENTE',
        email: 'test@example.com',
        message: '',
        mustChangePassword: false
      };

      service.verify2FA('test@example.com', '123456').subscribe(res => {
        expect(res.token).toBe('mock-token');
        expect(res.role).toBe('ROLE_CLIENTE');
      });

      const req = httpMock.expectOne(
        `${apiUrl}/auth/verify-2fa?email=test%40example.com&code=123456`
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle invalid 2FA code', () => {
      service.verify2FA('test@example.com', 'wrong').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err.status).toBe(400)
      });

      const req = httpMock.expectOne(
        `${apiUrl}/auth/verify-2fa?email=test%40example.com&code=wrong`
      );
      req.flush({ message: 'Invalid code' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('register', () => {
    it('should POST to /auth/register with correct params', () => {
      const mockResponse = { message: 'Registered successfully' };

      service.register('Juan Pérez', 'juan@example.com', 'Password1!', '3001234567', 'token').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'Password1!',
        phone: '3001234567',
        recaptchaToken: 'token'
      });
      req.flush(mockResponse);
    });

    it('should handle registration error', () => {
      service.register('Juan Pérez', 'existing@example.com', 'Password1!', '3001234567', 'token').subscribe({
        next: () => fail('Should have failed'),
        error: (err) => expect(err.status).toBe(409)
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/register`);
      req.flush({ message: 'Email already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('resend2FA', () => {
    it('should POST to /auth/resend-2fa', () => {
      service.resend2FA('test@example.com').subscribe();

      const req = httpMock.expectOne(
        `${apiUrl}/auth/resend-2fa?email=test%40example.com`
      );
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('requestPasswordReset', () => {
    it('should POST to /auth/password-reset/request', () => {
      service.requestPasswordReset('test@example.com').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/password-reset/request`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com' });
      req.flush({ message: 'Email sent' });
    });
  });

  describe('resetPassword', () => {
    it('should POST to /auth/password-reset/confirm', () => {
      service.resetPassword('reset-token', 'NewPassword1!').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/password-reset/confirm`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'reset-token', newPassword: 'NewPassword1!' });
      req.flush({ message: 'Password reset' });
    });
  });

  describe('verifyEmail', () => {
    it('should GET /auth/verify-email with token', () => {
      service.verifyEmail('verify-token').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/verify-email?token=verify-token`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'Email verified' });
    });
  });

  describe('resendVerificationEmail', () => {
    it('should POST to /auth/resend-verification', () => {
      service.resendVerificationEmail('test@example.com').subscribe();

      const req = httpMock.expectOne(
        `${apiUrl}/auth/resend-verification?email=test%40example.com`
      );
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('refreshToken', () => {
    it('should POST to /auth/refresh with stored refresh token', () => {
      localStorage.setItem('refreshToken', 'stored-refresh-token');

      const mockResponse = {
        token: 'new-token',
        refreshToken: 'new-refresh',
        role: 'ROLE_CLIENTE',
        email: 'test@example.com',
        message: '',
        mustChangePassword: false
      };

      service.refreshToken().subscribe(res => {
        expect(res.token).toBe('new-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'stored-refresh-token' });
      req.flush(mockResponse);
    });

    it('should throw when no refresh token in localStorage', () => {
      localStorage.removeItem('refreshToken');
      expect(() => service.refreshToken()).toThrow();
    });
  });

  describe('guardarSesion', () => {
    it('should store token, rol and email in localStorage', () => {
      service.guardarSesion('my-token', 'ROLE_CLIENTE', 'user@example.com', 'my-refresh');

      expect(localStorage.getItem('token')).toBe('my-token');
      expect(localStorage.getItem('rol')).toBe('ROLE_CLIENTE');
      expect(localStorage.getItem('email')).toBe('user@example.com');
      expect(localStorage.getItem('refreshToken')).toBe('my-refresh');
      expect(inactivitySpy.startWatching).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null when no token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return rol from localStorage', () => {
      localStorage.setItem('rol', 'ROLE_ADMIN');
      expect(service.getRol()).toBe('ROLE_ADMIN');
    });

    it('should return email from localStorage', () => {
      localStorage.setItem('email', 'test@example.com');
      expect(service.getEmail()).toBe('test@example.com');
    });

    it('should return refreshToken from localStorage', () => {
      localStorage.setItem('refreshToken', 'my-refresh');
      expect(service.getRefreshToken()).toBe('my-refresh');
    });
  });
});
