import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner
} from '@ionic/angular/standalone';

import { HttpErrorResponse } from '@angular/common/http';

import { AuthService, LoginResponse } from '../../../services/auth';
import { OtpModalComponent } from '../../../component/otp-modal/otp-modal.component';

/**
 * Página de inicio de sesión.
 *
 * Flujo:
 * 1) El usuario envía credenciales → el backend envía un OTP al correo.
 * 2) El usuario ingresa OTP → se valida contra el backend y se guarda sesión.
 * 3) Se redirige según el rol.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    OtpModalComponent
  ]
})
export class LoginPage implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMsg = '';
  cargando = false;

  mostrarOtp = false;
  correoUsuario = '';

  @ViewChild(OtpModalComponent) otpModal!: OtpModalComponent;

  private subscriptions: Subscription[] = [];

  login(): void {
    this.errorMsg = '';
    this.cargando = true;

    const sub = this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.correoUsuario = this.email;
        localStorage.setItem('email_pendiente', this.email);
        this.limpiarPassword();
        this.mostrarOtp = true;
      },
      error: (err: unknown) => {
        this.cargando = false;
        this.limpiarPassword();
        this.errorMsg =
          this.extraerMensajeError(err) ?? 'Credenciales inválidas o error de conexión';
      }
    });

    this.subscriptions.push(sub);
  }

  private limpiarPassword(): void {
    this.password = '';
  }

  private limpiarFormulario(): void {
    this.email = '';
    this.password = '';
  }

  handleOtpValidado(code: string): void {
    // Cancela suscripciones previas para evitar llamadas duplicadas
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    this.errorMsg = '';

    const sub = this.authService.verify2FA(this.correoUsuario, code).subscribe({
      next: (response: LoginResponse) => {
        if (response?.token && response?.rol) {
          this.authService.guardarSesion(response.token, response.rol, this.correoUsuario);
        }
        this.otpModal?.showSuccess();
      },
      error: (err: unknown) => {
        const msg =
          this.extraerMensajeError(err) ?? 'Código inválido, expirado o error en el servidor';

        this.errorMsg = msg;

        const msgLower = msg.toLowerCase();
        const esBloqueo =
          msgLower.includes('espera 1 minuto') ||
          msgLower.includes('intenta nuevamente en 1 minuto') ||
          msgLower.includes('antes de volver a intentarlo');

        if (esBloqueo) {
          this.otpModal?.showLocked(60);
          return;
        }

        const match = msg.match(/intentos restantes[:\s]+(\d+)/i);
        if (match) {
          this.otpModal?.showErrorConIntentos(parseInt(match[1], 10));
        } else {
          this.otpModal?.showError();
        }
      }
    });

    this.subscriptions.push(sub);
  }

  handleSuccessRedirect(): void {
    let rol = localStorage.getItem('rol');

    if (!rol) {
      rol = 'ROLE_CLIENTE';
      localStorage.setItem('rol', rol);
    }

    switch (rol) {
      case 'ROLE_VETERINARIO':
        this.router.navigate(['/dashboard-vet']);
        break;

      case 'ROLE_RECEPCIONISTA':
        this.router.navigate(['/dashboard-recep']);
        break;

      case 'ROLE_ADMIN':
        this.router.navigate(['/dashboard-admin']);
        break;

      case 'ROLE_CLIENTE':
      default:
        this.router.navigate(['/dashboard-cliente']);
        break;
    }
  }

  handleOtpCerrado(): void {
    this.mostrarOtp = false;
    localStorage.removeItem('email_pendiente');
  }

  handleReenvio(): void {
    if (!this.correoUsuario) return;

    this.errorMsg = '';
    this.cargando = true;

    const sub = this.authService.resend2FA(this.correoUsuario).subscribe({
      next: () => {
        this.cargando = false;
      },
      error: (err: unknown) => {
        this.cargando = false;
        this.errorMsg =
          this.extraerMensajeError(err) ?? 'Error al reenviar el código. Intenta más tarde.';
      }
    });

    this.subscriptions.push(sub);
  }

  recuperarContrasena(): void {
    void this.router.navigate(['/forgot-password']);
  }

  irRegistro(): void {
    void this.router.navigate(['/register']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Extrae el mensaje de error del backend.
   * Soporta respuestas JSON ({ message }) y texto plano (string).
   */
  private extraerMensajeError(err: unknown): string | null {
    const anyErr = err as { error?: unknown; message?: unknown } | null;

    const backend = anyErr?.error;

    if (backend && typeof backend === 'object') {
      const msg = (backend as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim()) return msg;
    }

    if (typeof backend === 'string' && backend.trim()) return backend;

    if (typeof anyErr?.message === 'string' && anyErr.message.trim()) return anyErr.message;

    return null;
  }
}
