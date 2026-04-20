import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegisterPage } from './register.page';
import { AuthService } from '../../../services/auth';
import { of, throwError } from 'rxjs';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'register', 'resendVerificationEmail'
    ]);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty fields', () => {
    expect(component.nombre).toBe('');
    expect(component.correo).toBe('');
    expect(component.telefono).toBe('');
    expect(component.contrasena).toBe('');
    expect(component.verificacionPendiente).toBe(false);
  });

  it('should validate nombre - empty', () => {
    component.nombre = '';
    component.validarNombre();
    expect(component.errores.nombre).toBeTruthy();
  });

  it('should validate nombre - single word', () => {
    component.nombre = 'Juan';
    component.validarNombre();
    expect(component.errores.nombre).toBeTruthy();
  });

  it('should validate nombre - valid', () => {
    component.nombre = 'Juan Pérez';
    component.validarNombre();
    expect(component.errores.nombre).toBe('');
  });

  it('should validate correo - invalid', () => {
    component.correo = 'not-an-email';
    component.validarCorreo();
    expect(component.errores.correo).toBeTruthy();
  });

  it('should validate correo - valid', () => {
    component.correo = 'test@example.com';
    component.validarCorreo();
    expect(component.errores.correo).toBe('');
  });

  it('should validate telefono - invalid (not starting with 3)', () => {
    component.telefono = '1234567890';
    component.validarTelefono();
    expect(component.errores.telefono).toBeTruthy();
  });

  it('should validate telefono - valid', () => {
    component.telefono = '3001234567';
    component.validarTelefono();
    expect(component.errores.telefono).toBe('');
  });

  it('should validate contrasena - too short', () => {
    component.contrasena = '123';
    component.validarContrasena();
    expect(component.errores.contrasena).toBeTruthy();
  });

  it('should validate contrasena - valid', () => {
    component.contrasena = 'Password1!';
    component.validarContrasena();
    expect(component.errores.contrasena).toBe('');
  });

  it('should not register when recaptchaToken is empty', () => {
    component.nombre = 'Juan Pérez';
    component.correo = 'test@example.com';
    component.telefono = '3001234567';
    component.contrasena = 'Password1!';
    component.recaptchaToken = '';

    component.registrar();

    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should call authService.register with correct params', () => {
    component.nombre = 'Juan Pérez';
    component.correo = 'test@example.com';
    component.telefono = '3001234567';
    component.contrasena = 'Password1!';
    component.recaptchaToken = 'test-token';

    authServiceSpy.register.and.returnValue(of({}));

    component.registrar();

    expect(authServiceSpy.register).toHaveBeenCalledWith(
      'Juan Pérez',
      'test@example.com',
      'Password1!',
      '3001234567',
      'test-token'
    );
  });

  it('should show verificacionPendiente after successful register', () => {
    component.nombre = 'Juan Pérez';
    component.correo = 'test@example.com';
    component.telefono = '3001234567';
    component.contrasena = 'Password1!';
    component.recaptchaToken = 'test-token';

    authServiceSpy.register.and.returnValue(of({}));

    component.registrar();

    expect(component.verificacionPendiente).toBe(true);
    expect(component.correoRegistrado).toBe('test@example.com');
  });

  it('should set error on register failure', () => {
    component.nombre = 'Juan Pérez';
    component.correo = 'test@example.com';
    component.telefono = '3001234567';
    component.contrasena = 'Password1!';
    component.recaptchaToken = 'test-token';

    authServiceSpy.register.and.returnValue(throwError(() => ({
      error: { message: 'El correo ya está registrado' }
    })));

    component.registrar();

    expect(component.mostrarError).toBe(true);
    expect(component.mensajeError).toBe('El correo ya está registrado');
  });

  it('should return to form on volverEditar', () => {
    component.verificacionPendiente = true;
    component.volverEditar();
    expect(component.verificacionPendiente).toBe(false);
  });

  it('should call resendVerificationEmail on reenviarVerificacion', () => {
    component.correoRegistrado = 'test@example.com';
    authServiceSpy.resendVerificationEmail.and.returnValue(of({}));

    component.reenviarVerificacion();

    expect(authServiceSpy.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
    expect(component.tipoReenvio).toBe('ok');
  });

  it('should handle resend error', () => {
    component.correoRegistrado = 'test@example.com';
    authServiceSpy.resendVerificationEmail.and.returnValue(throwError(() => new Error('error')));

    component.reenviarVerificacion();

    expect(component.tipoReenvio).toBe('error');
  });

  it('should compute fuerzaPct correctly', () => {
    component.contrasena = '';
    expect(component.fuerzaPct).toBe('0%');

    component.contrasena = 'abc';
    expect(component.fuerzaPct).toBe('25%');

    component.contrasena = 'Password1!';
    expect(component.fuerzaPct).toBe('100%');
  });

  it('should navigate to login on irLogin', () => {
    const routerSpy = spyOn((component as any).router, 'navigate');
    component.irLogin();
    expect(routerSpy).toHaveBeenCalledWith(['/login']);
  });
});
