import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, alertCircleOutline } from 'ionicons/icons';
import { OtpModalComponent } from '../../../component/otp-modal/otp-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonIcon,
    OtpModalComponent,
  ],
})
export class RegisterPage {

  private router = inject(Router);

  @ViewChild(OtpModalComponent) otpModal!: OtpModalComponent;

  nombre      = '';
  correo      = '';
  contrasena  = '';
  mostrarPass = false;
  mostrarError = false;
  mensajeError = '';
  mostrarOtp  = false;

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline, alertCircleOutline });
  }

  // ─── Indicador de fuerza ─────────────────────────────────────

  get fuerzaPct(): string {
    const len = this.contrasena.length;
    if (len === 0) return '0%';
    if (len < 6)   return '25%';
    if (len < 8)   return '50%';
    const hasUpper   = /[A-Z]/.test(this.contrasena);
    const hasNumber  = /[0-9]/.test(this.contrasena);
    const hasSpecial = /[^A-Za-z0-9]/.test(this.contrasena);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score === 3) return '100%';
    if (score === 2) return '75%';
    return '50%';
  }

  get fuerzaClase(): string {
    const pct = this.fuerzaPct;
    if (pct === '100%') return 'fuerte';
    if (pct === '75%')  return 'buena';
    if (pct === '50%')  return 'media';
    return 'debil';
  }

  get fuerzaTexto(): string {
    const map: Record<string, string> = {
      fuerte: 'Contraseña fuerte',
      buena:  'Contraseña buena',
      media:  'Contraseña media',
      debil:  'Contraseña débil',
    };
    return map[this.fuerzaClase];
  }

  // ─── Registro ────────────────────────────────────────────────

  registrar() {
    // Validaciones
    if (!this.nombre.trim()) {
      this.setError('Ingresa tu nombre completo.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.correo || !emailRegex.test(this.correo)) {
      this.setError('Ingresa un correo válido.');
      return;
    }
    if (this.contrasena.length < 8) {
      this.setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    // ── SIMULACIÓN TEMPORAL (borrar cuando conectes el backend) ──
    // this.authService.register({ nombre, correo, contrasena }).subscribe(() => {
    //   this.mostrarOtp = true;  // backend envía el código al correo
    // });
    this.mostrarOtp = true;
    // ─────────────────────────────────────────────────────────────
  }

  handleOtpValidado(code: string) {
    // ── SIMULACIÓN TEMPORAL (código correcto de prueba: 123456) ──
    if (code === '123456') {
      this.otpModal.showSuccess();
    } else {
      this.otpModal.showError();
    }
    // ── Reemplazar con llamada al backend ──
    // this.authService.verificarOtp(code).subscribe(res => {
    //   res.ok ? this.otpModal.showSuccess() : this.otpModal.showError();
    // });
  }

  handleSuccessRedirect() {
    this.mostrarOtp = false;
    // Al registrarse exitosamente va al login para que ingrese
    this.router.navigate(['/login']);
  }

  handleReenvio() {
    // this.authService.reenviarOtp(this.correo).subscribe();
    console.log('Reenviar código a:', this.correo);
  }

  irLogin() {
    this.router.navigate(['/login']);
  }

  private setError(msg: string) {
    this.mensajeError = msg;
    this.mostrarError = true;
    setTimeout(() => (this.mostrarError = false), 3500);
  }
}
