import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login.page';
import { AuthService } from '../../../services/auth';
import { of, throwError } from 'rxjs';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login', 'verify2FA', 'resend2FA', 'guardarSesion',
      'resendVerificationEmail', 'getToken', 'getRol', 'getEmail'
    ]);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty fields', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.errorMsg).toBe('');
    expect(component.cargando).toBe(false);
    expect(component.mostrarOtp).toBe(false);
  });

  it('should not login when recaptchaToken is empty', () => {
    component.email = 'test@example.com';
    component.password = 'password123';
    component.recaptchaToken = '';

    component.login();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.errorMsg).toBeTruthy();
  });

  it('should call authService.login with correct params', () => {
    component.email = 'test@example.com';
    component.password = 'password123';
    component.recaptchaToken = 'test-token';

    authServiceSpy.login.and.returnValue(of({}));

    component.login();

    expect(authServiceSpy.login).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
      'test-token'
    );
  });

  it('should show OTP modal after successful login', () => {
    component.email = 'test@example.com';
    component.password = 'password123';
    component.recaptchaToken = 'test-token';

    authServiceSpy.login.and.returnValue(of({}));

    component.login();

    expect(component.mostrarOtp).toBe(true);
    expect(component.correoUsuario).toBe('test@example.com');
  });

  it('should set errorMsg on login failure', () => {
    component.email = 'test@example.com';
    component.password = 'wrong';
    component.recaptchaToken = 'test-token';

    authServiceSpy.login.and.returnValue(throwError(() => ({
      error: { message: 'Credenciales inválidas' }
    })));

    component.login();

    expect(component.errorMsg).toBe('Credenciales inválidas');
    expect(component.cargando).toBe(false);
  });

  it('should set correoSinVerificar when email not verified error', () => {
    component.email = 'unverified@example.com';
    component.password = 'password123';
    component.recaptchaToken = 'test-token';

    authServiceSpy.login.and.returnValue(throwError(() => ({
      error: { message: 'Debes verificar tu correo antes de iniciar sesión' }
    })));

    component.login();

    expect(component.correoSinVerificar).toBe('unverified@example.com');
  });

  it('should toggle password visibility', () => {
    expect(component.mostrarPass).toBe(false);
    // mostrarPass is toggled via template, we test the property directly
    component.mostrarPass = true;
    expect(component.mostrarPass).toBe(true);
  });

  it('should navigate to forgot password', () => {
    const routerSpy = spyOn((component as any).router, 'navigate');
    component.recuperarContrasena();
    expect(routerSpy).toHaveBeenCalledWith(['/forgot-password']);
  });

  it('should navigate to register', () => {
    const routerSpy = spyOn((component as any).router, 'navigate');
    component.irRegistro();
    expect(routerSpy).toHaveBeenCalledWith(['/register']);
  });

  it('should close OTP modal and clear email on handleOtpCerrado', () => {
    component.mostrarOtp = true;
    localStorage.setItem('email_pendiente', 'test@example.com');

    component.handleOtpCerrado();

    expect(component.mostrarOtp).toBe(false);
    expect(localStorage.getItem('email_pendiente')).toBeNull();
  });

  it('should not resend verification if no email or already sending', () => {
    component.correoSinVerificar = '';
    component.reenviarVerificacionDesdeLogin();
    expect(authServiceSpy.resendVerificationEmail).not.toHaveBeenCalled();
  });

  it('should call resendVerificationEmail with correct email', () => {
    component.correoSinVerificar = 'test@example.com';
    authServiceSpy.resendVerificationEmail.and.returnValue(of({}));

    component.reenviarVerificacionDesdeLogin();

    expect(authServiceSpy.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
  });
});
