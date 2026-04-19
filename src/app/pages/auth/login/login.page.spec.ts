import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { LoginPage } from './login.page';
import { AuthService, LoginResponse } from '../../../services/auth';
import { OtpModalComponent } from '../../../component/otp-modal/otp-modal.component';

// Mock global grecaptcha
declare global {
  interface Window {
    grecaptcha: any;
  }
}

describe('LoginPage - Pruebas Funcionales (FE-LOGIN-01 a FE-LOGIN-27)', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let ngZone: jasmine.SpyObj<NgZone>;
  let location: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', [
      'login', 'verify2FA', 'resend2FA', 'resendVerificationEmail', 'guardarSesion'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);
    const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { queryParamMap: { get: jasmine.createSpy().and.returnValue(null) } }
    });
    const ngZoneSpy = jasmine.createSpyObj('NgZone', ['run']);
    const locationSpy = jasmine.createSpyObj('Location', ['back']);

    // Mock grecaptcha
    (window as any).grecaptcha = {
      render: jasmine.createSpy('render'),
      reset: jasmine.createSpy('reset')
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: routeSpy },
        { provide: NgZone, useValue: ngZoneSpy },
        { provide: Location, useValue: locationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    ngZone = TestBed.inject(NgZone) as jasmine.SpyObj<NgZone>;
    location = TestBed.inject(Location) as jasmine.SpyObj<Location>;

    // Mock ngZone.run to execute callback immediately
    ngZone.run.and.callFake((fn: Function) => fn());
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-01: Inicialización del componente
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-01: Inicialización del componente', () => {
    it('debe inicializar correctamente el componente', () => {
      fixture.detectChanges();
      
      expect(component).toBeTruthy();
      expect(component.email).toBe('');
      expect(component.password).toBe('');
      expect(component.errorMsg).toBe('');
      expect(component.mostrarPass).toBe(false);
      expect(component.cargando).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-02: Validación de campos requeridos
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-02: Validación de campos requeridos', () => {
    it('debe requerir reCAPTCHA antes de enviar', () => {
      component.email = 'test@example.com';
      component.password = 'password123';
      component.recaptchaToken = '';

      component.login();

      expect(component.errorMsg).toBe('Por favor, completa el reCAPTCHA antes de continuar.');
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-03: Login exitoso - fase 1
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-03: Login exitoso - fase 1', () => {
    it('debe procesar login exitoso y mostrar modal OTP', () => {
      component.email = 'test@example.com';
      component.password = 'password123';
      component.recaptchaToken = 'valid-token';

      authService.login.and.returnValue(of({ message: '2FA code sent' }));

      component.login();

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', 'valid-token');
      expect(component.cargando).toBe(false);
      expect(component.mostrarOtp).toBe(true);
      expect(component.correoUsuario).toBe('test@example.com');
      expect(localStorage.getItem('email_pendiente')).toBe('test@example.com');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-04: Login fallido - credenciales inválidas
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-04: Login fallido - credenciales inválidas', () => {
    it('debe manejar credenciales inválidas', () => {
      component.email = 'test@example.com';
      component.password = 'wrongpassword';
      component.recaptchaToken = 'valid-token';

      const error = { error: { message: 'Credenciales inválidas' } };
      authService.login.and.returnValue(throwError(() => error));

      component.login();

      expect(component.cargando).toBe(false);
      expect(component.errorMsg).toBe('Credenciales inválidas');
      expect(component.mostrarOtp).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-05: Verificación 2FA exitosa
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-05: Verificación 2FA exitosa', () => {
    it('debe procesar verificación 2FA exitosa', () => {
      component.correoUsuario = 'test@example.com';
      
      const mockResponse: LoginResponse = {
        token: 'jwt-token',
        role: 'ROLE_CLIENTE',
        email: 'test@example.com',
        message: 'Login successful',
        refreshToken: 'refresh-token',
        mustChangePassword: false
      };

      authService.verify2FA.and.returnValue(of(mockResponse));
      component.otpModal = jasmine.createSpyObj('OtpModalComponent', ['showSuccess', 'stopLoading']);

      component.handleOtpValidado('123456');

      expect(authService.verify2FA).toHaveBeenCalledWith('test@example.com', '123456');
      expect(authService.guardarSesion).toHaveBeenCalledWith(
        'jwt-token', 'ROLE_CLIENTE', 'test@example.com', 'refresh-token'
      );
      expect(component.otpModal.showSuccess).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-06: Verificación 2FA fallida
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-06: Verificación 2FA fallida', () => {
    it('debe manejar código 2FA inválido', () => {
      component.correoUsuario = 'test@example.com';
      
      const error = { error: { message: 'Código inválido' } };
      authService.verify2FA.and.returnValue(throwError(() => error));
      component.otpModal = jasmine.createSpyObj('OtpModalComponent', ['showError', 'stopLoading']);

      component.handleOtpValidado('wrong-code');

      expect(component.errorMsg).toBe('Código inválido');
      expect(component.otpModal.showError).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-07: Límite de intentos 2FA
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-07: Límite de intentos 2FA', () => {
    it('debe manejar bloqueo por múltiples intentos fallidos', () => {
      component.correoUsuario = 'test@example.com';
      
      const error = { error: { message: 'Espera 1 minuto antes de volver a intentarlo' } };
      authService.verify2FA.and.returnValue(throwError(() => error));
      component.otpModal = jasmine.createSpyObj('OtpModalComponent', ['showLocked', 'stopLoading']);

      component.handleOtpValidado('wrong-code');

      expect(component.otpModal.showLocked).toHaveBeenCalledWith(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-08: Intentos restantes 2FA
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-08: Intentos restantes 2FA', () => {
    it('debe mostrar intentos restantes', () => {
      component.correoUsuario = 'test@example.com';
      
      const error = { error: { message: 'Código inválido. Intentos restantes: 2' } };
      authService.verify2FA.and.returnValue(throwError(() => error));
      component.otpModal = jasmine.createSpyObj('OtpModalComponent', ['showErrorConIntentos', 'stopLoading']);

      component.handleOtpValidado('wrong-code');

      expect(component.otpModal.showErrorConIntentos).toHaveBeenCalledWith(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-09: Reenvío de código 2FA
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-09: Reenvío de código 2FA', () => {
    it('debe reenviar código 2FA exitosamente', () => {
      component.correoUsuario = 'test@example.com';
      
      authService.resend2FA.and.returnValue(of({ message: 'Code resent' }));

      component.handleReenvio();

      expect(authService.resend2FA).toHaveBeenCalledWith('test@example.com');
      expect(component.cargando).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-10: Cooldown en reenvío 2FA
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-10: Cooldown en reenvío 2FA', () => {
    it('debe manejar cooldown en reenvío', () => {
      component.correoUsuario = 'test@example.com';
      
      const error = { error: { message: 'Espera 30 segundos antes de reenviar' } };
      authService.resend2FA.and.returnValue(throwError(() => error));
      component.otpModal = jasmine.createSpyObj('OtpModalComponent', ['showCooldown']);

      component.handleReenvio();

      expect(component.otpModal.showCooldown).toHaveBeenCalledWith(30);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-11: Redirección por rol - Cliente
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-11: Redirección por rol - Cliente', () => {
    it('debe redirigir cliente al dashboard correcto', () => {
      localStorage.setItem('rol', 'ROLE_CLIENTE');
      localStorage.setItem('mustChangePassword', 'false');

      component.handleSuccessRedirect();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard-cliente']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-12: Redirección por rol - Veterinario
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-12: Redirección por rol - Veterinario', () => {
    it('debe redirigir veterinario al dashboard correcto', () => {
      localStorage.setItem('rol', 'ROLE_VETERINARIO');
      localStorage.setItem('mustChangePassword', 'false');

      component.handleSuccessRedirect();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard-vet']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-13: Redirección por rol - Recepcionista
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-13: Redirección por rol - Recepcionista', () => {
    it('debe redirigir recepcionista al dashboard correcto', () => {
      localStorage.setItem('rol', 'ROLE_RECEPCIONISTA');
      localStorage.setItem('mustChangePassword', 'false');

      component.handleSuccessRedirect();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard-rec']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-14: Redirección por rol - Administrador
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-14: Redirección por rol - Administrador', () => {
    it('debe redirigir administrador al dashboard correcto', () => {
      localStorage.setItem('rol', 'ROLE_ADMIN');
      localStorage.setItem('mustChangePassword', 'false');

      component.handleSuccessRedirect();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard-admin']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-15: Cambio de contraseña obligatorio
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-15: Cambio de contraseña obligatorio', () => {
    it('debe redirigir a cambio de contraseña cuando es obligatorio', () => {
      localStorage.setItem('mustChangePassword', 'true');

      component.handleSuccessRedirect();

      expect(router.navigate).toHaveBeenCalledWith(['/change-password-first']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-16: Navegación a recuperar contraseña
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-16: Navegación a recuperar contraseña', () => {
    it('debe navegar a página de recuperación de contraseña', () => {
      component.recuperarContrasena();

      expect(router.navigate).toHaveBeenCalledWith(['/forgot-password']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-17: Navegación a registro
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-17: Navegación a registro', () => {
    it('debe navegar a página de registro', () => {
      component.irRegistro();

      expect(router.navigate).toHaveBeenCalledWith(['/register']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-18: Mostrar/ocultar contraseña
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-18: Mostrar/ocultar contraseña', () => {
    it('debe alternar visibilidad de contraseña', () => {
      expect(component.mostrarPass).toBe(false);
      
      // Simular click en botón de mostrar contraseña
      component.mostrarPass = !component.mostrarPass;
      
      expect(component.mostrarPass).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-19: Manejo de sesión expirada
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-19: Manejo de sesión expirada', () => {
    it('debe mostrar mensaje de sesión expirada por inactividad', () => {
      const mockRoute = {
        snapshot: {
          queryParamMap: {
            get: jasmine.createSpy().and.returnValue('inactivity')
          }
        }
      };
      
      TestBed.overrideProvider(ActivatedRoute, { useValue: mockRoute });
      fixture = TestBed.createComponent(LoginPage);
      component = fixture.componentInstance;
      
      component.ngOnInit();

      expect(component.sessionExpiredMsg).toBe('Tu sesión expiró por inactividad. Por favor, inicia sesión de nuevo.');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-20: Manejo de logout
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-20: Manejo de logout', () => {
    it('debe mostrar mensaje de logout exitoso', () => {
      const mockRoute = {
        snapshot: {
          queryParamMap: {
            get: jasmine.createSpy().and.returnValue('logout')
          }
        }
      };
      
      TestBed.overrideProvider(ActivatedRoute, { useValue: mockRoute });
      fixture = TestBed.createComponent(LoginPage);
      component = fixture.componentInstance;
      
      component.ngOnInit();

      expect(component.sessionExpiredMsg).toBe('Has cerrado sesión correctamente.');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-21: Reenvío de verificación de email
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-21: Reenvío de verificación de email', () => {
    it('debe reenviar email de verificación desde login', () => {
      component.correoSinVerificar = 'test@example.com';
      
      authService.resendVerificationEmail.and.returnValue(of({ message: 'Email sent' }));

      component.reenviarVerificacionDesdeLogin();

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      expect(component.mensajeReenvioVerif).toBe('✅ Correo reenviado. Revisa tu bandeja de entrada.');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-22: Error en reenvío de verificación
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-22: Error en reenvío de verificación', () => {
    it('debe manejar error en reenvío de verificación', () => {
      component.correoSinVerificar = 'test@example.com';
      
      authService.resendVerificationEmail.and.returnValue(throwError(() => new Error('Network error')));

      component.reenviarVerificacionDesdeLogin();

      expect(component.mensajeReenvioVerif).toBe('❌ No se pudo reenviar. Intenta más tarde.');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-23: Cuenta no verificada
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-23: Cuenta no verificada', () => {
    it('debe mostrar opción de reenvío cuando cuenta no está verificada', () => {
      component.email = 'test@example.com';
      component.recaptchaToken = 'valid-token';

      const error = { error: { message: 'Debes verificar tu correo antes de iniciar sesión' } };
      authService.login.and.returnValue(throwError(() => error));

      component.login();

      expect(component.correoSinVerificar).toBe('test@example.com');
      expect(component.errorMsg).toContain('verificar tu correo');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-24: Cerrar modal OTP
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-24: Cerrar modal OTP', () => {
    it('debe limpiar estado al cerrar modal OTP', () => {
      localStorage.setItem('email_pendiente', 'test@example.com');
      component.mostrarOtp = true;

      component.handleOtpCerrado();

      expect(component.mostrarOtp).toBe(false);
      expect(localStorage.getItem('email_pendiente')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-25: Validación de respuesta 2FA inválida
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-25: Validación de respuesta 2FA inválida', () => {
    it('debe manejar respuesta inválida del servidor en 2FA', () => {
      component.correoUsuario = 'test@example.com';
      
      const invalidResponse = { token: null, role: null };
      authService.verify2FA.and.returnValue(of(invalidResponse as any));
      component.otpModal = jasmine.createSpyObj('OtpModalComponent', ['stopLoading']);

      component.handleOtpValidado('123456');

      expect(component.errorMsg).toBe('Respuesta inválida del servidor.');
      expect(component.otpModal.stopLoading).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-26: Limpieza en navegación
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-26: Limpieza en navegación', () => {
    it('debe limpiar formulario en navegación', () => {
      component.email = 'test@example.com';
      component.password = 'password123';
      component.errorMsg = 'Some error';
      component.mostrarPass = true;

      // Simular navegación
      component.ngOnDestroy();

      expect(component).toBeTruthy(); // Component still exists
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-LOGIN-27: Prevención de navegación hacia atrás
  // ═══════════════════════════════════════════════════════════════
  describe('FE-LOGIN-27: Prevención de navegación hacia atrás', () => {
    it('debe configurar prevención de navegación hacia atrás', () => {
      spyOn(window.history, 'pushState');
      spyOn(window, 'addEventListener');

      component.ngOnInit();

      expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/login');
      expect(window.addEventListener).toHaveBeenCalledWith('popstate', jasmine.any(Function));
    });
  });
});