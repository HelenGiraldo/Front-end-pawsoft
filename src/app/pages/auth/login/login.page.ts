import {Component, inject, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem, IonLabel } from '@ionic/angular/standalone';
import { OtpModalComponent } from '../../../component/otp-modal/otp-modal.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonContent,
    IonInput,
    IonButton,
    IonItem,
    IonLabel,
    OtpModalComponent,
  ]
})
export class LoginPage {

  private router = inject(Router);

  @ViewChild(OtpModalComponent) otpModal!: OtpModalComponent;

  mostrarOtp    = false;
  correoUsuario = '';



  login() {
    // ── SIMULACIÓN TEMPORAL ──
    this.correoUsuario = 'usuario@ejemplo.com';
    this.mostrarOtp = true;
  }

  handleOtpValidado(code: string) {
    if (code === '123456') {
      this.otpModal.showSuccess();
    } else {
      this.otpModal.showError();
    }
  }

  handleSuccessRedirect() {
    this.mostrarOtp = false;
    // this.router.navigate(['/inicio']);
  }

  handleOtpCerrado() {
    this.mostrarOtp = false;
  }

  handleReenvio() {
    console.log('Reenviar código a:', this.correoUsuario);
  }

  recuperarContrasena() {
    this.router.navigate(['/forgot-password']);
  }

  irRegistro() {
    console.log('Ir a registro clickeado');
    this.router.navigate(['/register']);
  }
}

