import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  keyOutline,
  eyeOutline,
  eyeOffOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
  ],
})
export class ResetPasswordPage {

  private router = inject(Router);

  nuevaPass     = '';
  confirmarPass = '';
  mostrarPass1  = false;
  mostrarPass2  = false;
  mostrarError  = false;
  mensajeError  = '';
  cambiado      = false;

  constructor() {
    addIcons({ keyOutline, eyeOutline, eyeOffOutline, alertCircleOutline, checkmarkCircleOutline });
  }

  // ─── Indicador de fuerza ─────────────────────────────────────

  get fuerzaPct(): string {
    const len = this.nuevaPass.length;
    if (len === 0) return '0%';
    if (len < 6)   return '25%';
    if (len < 8)   return '50%';
    const hasUpper   = /[A-Z]/.test(this.nuevaPass);
    const hasNumber  = /[0-9]/.test(this.nuevaPass);
    const hasSpecial = /[^A-Za-z0-9]/.test(this.nuevaPass);
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

  // ─── Acción principal ────────────────────────────────────────

  cambiarContrasena() {
    if (this.nuevaPass.length < 8) {
      this.setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.nuevaPass !== this.confirmarPass) {
      this.setError('Las contraseñas no coinciden.');
      return;
    }

    // ── SIMULACIÓN TEMPORAL (borrar cuando conectes el backend) ──
    // const token = this.route.snapshot.queryParams['token'];
    // this.authService.resetPassword(token, this.nuevaPass).subscribe(() => {
    //   this.cambiado = true;
    // });
    this.cambiado = true;
    // ─────────────────────────────────────────────────────────────
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
