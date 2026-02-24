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
  lockClosedOutline,
  mailOutline,
  alertCircleOutline,
  arrowBackOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
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
export class ForgotPasswordPage {

  private router = inject(Router);

  correo       = '';
  enviado      = false;
  mostrarError = false;

  constructor() {
    addIcons({ lockClosedOutline, mailOutline, alertCircleOutline, arrowBackOutline });
  }

  continuar() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.correo || !emailRegex.test(this.correo)) {
      this.mostrarError = true;
      setTimeout(() => (this.mostrarError = false), 3000);
      return;
    }

    // ── SIMULACIÓN TEMPORAL (borrar cuando conectes el backend) ──
    // this.authService.sendResetLink(this.correo).subscribe(() => {
    //   this.enviado = true;
    // });
    this.enviado = true;
    // ─────────────────────────────────────────────────────────────
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}
