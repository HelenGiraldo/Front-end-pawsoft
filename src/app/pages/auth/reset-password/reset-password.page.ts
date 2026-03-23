import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { AuthService } from 'src/app/services/auth';

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
export class ResetPasswordPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  nuevaPass = '';
  confirmarPass = '';
  mostrarPass1 = false;
  mostrarPass2 = false;
  mostrarError = false;
  mensajeError = '';
  cambiado = false;
  token: string | null = null;
  hintPass = '';

  readonly hintRequisitos = 'Mínimo 8 caracteres, una mayúscula, un número y un carácter especial.';

  constructor() {
    addIcons({
      keyOutline,
      eyeOutline,
      eyeOffOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || null;

      if (!this.token) {
        this.setError('Token inválido o expirado.');
      }
    });
  }

  get fuerzaPct(): string {
    const len = this.nuevaPass.length;
    if (len === 0) return '0%';
    if (len < 6) return '25%';
    if (len < 8) return '50%';

    const hasUpper = /[A-Z]/.test(this.nuevaPass);
    const hasNumber = /[0-9]/.test(this.nuevaPass);
    const hasSpecial = /[^A-Za-z0-9]/.test(this.nuevaPass);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (score === 3) return '100%';
    if (score === 2) return '75%';
    return '50%';
  }

  get fuerzaClase(): string {
    const pct = this.fuerzaPct;
    if (pct === '100%') return 'fuerte';
    if (pct === '75%') return 'buena';
    if (pct === '50%') return 'media';
    return 'debil';
  }

  get fuerzaTexto(): string {
    const map: Record<string, string> = {
      fuerte: 'Contraseña fuerte',
      buena: 'Contraseña buena',
      media: 'Contraseña media',
      debil: 'Contraseña débil',
    };
    return map[this.fuerzaClase];
  }

  cambiarContrasena() {
    if (this.nuevaPass.length < 8) {
      this.setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (this.nuevaPass !== this.confirmarPass) {
      this.setError('Las contraseñas no coinciden.');
      return;
    }

    if (!this.token) {
      this.setError('Token inválido o expirado.');
      return;
    }

    this.authService.resetPassword(this.token, this.nuevaPass).subscribe({
      next: () => {
        this.cambiado = true;
      },
      error: (err) => {
        console.error('Error reset password:', err);
        this.setError('No se pudo cambiar la contraseña.');
      },
    });
  }

  irLogin() {
    this.router.navigate(['/login']);
  }

  onNuevaPassInput(): void {
    const p = this.nuevaPass;
    if (!p) { this.hintPass = ''; return; }
    const faltan: string[] = [];
    if (p.length < 8)             faltan.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(p))         faltan.push('una mayúscula');
    if (!/[0-9]/.test(p))         faltan.push('un número');
    if (!/[^A-Za-z0-9]/.test(p))  faltan.push('un carácter especial');
    this.hintPass = faltan.length ? 'Falta: ' + faltan.join(', ') + '.' : '';
  }

  private setError(msg: string) {
    this.mensajeError = msg;
    this.mostrarError = true;
    setTimeout(() => (this.mostrarError = false), 3500);
  }
}
