import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonButton, IonIcon, IonSpinner,} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, alertCircleOutline, closeOutline, checkmarkCircleOutline } from 'ionicons/icons';

/**
 * OTP Modal — Módulo general reutilizable para Login y Registro.
 *
 * USO EN LOGIN:
 *   <app-otp-modal
 *     [isVisible]="mostrarOtp"
 *     [email]="correoUsuario"
 *     (validate)="handleOtpValidado($event)"
 *     (closed)="mostrarOtp = false"
 *     (resend)="reenviarCodigoOtp()">
 *   </app-otp-modal>
 *
 * FLUJO ESPERADO:
 *  1. El padre valida credenciales con el backend.
 *  2. Si son correctas → [isVisible]="true" para mostrar el modal.
 *  3. El usuario ingresa el código de 6 dígitos.
 *  4. Al presionar "Validar" → emite (validate) con el código.
 *  5. El padre llama al backend:
 *     - Correcto   → llama this.otpModal.showSuccess() → redirige automáticamente
 *     - Incorrecto → llama this.otpModal.showError()
 */
@Component({
  selector: 'app-otp-modal',
  templateUrl: './otp-modal.component.html',
  styleUrls: ['./otp-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonSpinner],
})
export class OtpModalComponent implements OnInit, OnDestroy {

  /** Controla la visibilidad del modal */
  @Input() isVisible = false;

  /** Correo del usuario (se enmascara para mostrar en pantalla) */
  @Input() email = '';

  /** Emite el código OTP completo cuando el usuario presiona "Validar" */
  @Output() validate = new EventEmitter<string>();

  /** Emite cuando el usuario cierra el modal */
  @Output() closed = new EventEmitter<void>();

  /** Emite cuando el usuario solicita reenviar el código */
  @Output() resend = new EventEmitter<void>();

  /** Emite cuando el modal termina de mostrar el éxito y hay que navegar */
  @Output() successRedirect = new EventEmitter<void>();

  @ViewChildren('otpInputs') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  otpValues: string[] = ['', '', '', '', '', ''];
  hasError  = false;
  isLoading = false;
  isSuccess = false;
  countdown = 60;

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    addIcons({ mailOutline, alertCircleOutline, closeOutline, checkmarkCircleOutline });
  }

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  // ─────────────────────────────────────────────
  //  Computed
  // ─────────────────────────────────────────────

  /** Enmascara el correo: ejem****@correo.com */
  get maskedEmail(): string {
    if (!this.email) return '';
    const [local, domain] = this.email.split('@');
    const visible = local.slice(0, 4);
    return `${visible}****@${domain}`;
  }

  /** Verdadero cuando los 6 dígitos están completos */
  get isComplete(): boolean {
    return this.otpValues.every(v => v !== '');
  }

  // ─────────────────────────────────────────────
  //  Interacción con inputs
  // ─────────────────────────────────────────────

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length > 1) {
      input.value = value[0];
    }

    this.otpValues[index] = value[0] ?? '';
    input.value = this.otpValues[index];
    this.hasError = false;

    if (this.otpValues[index] && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.otpValues[index]) {
        this.otpValues[index] = '';
      } else if (index > 0) {
        this.otpValues[index - 1] = '';
        this.focusInput(index - 1);
      }
    }

    if (event.key === 'ArrowLeft'  && index > 0) this.focusInput(index - 1);
    if (event.key === 'ArrowRight' && index < 5) this.focusInput(index + 1);
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');

    digits.forEach((d, i) => {
      if (i < 6) this.otpValues[i] = d;
    });

    const lastIndex = Math.min(digits.length - 1, 5);
    setTimeout(() => this.focusInput(lastIndex), 0);
  }

  // ─────────────────────────────────────────────
  //  Acciones
  // ─────────────────────────────────────────────

  validar(): void {
    if (!this.isComplete) return;
    this.isLoading = true;
    const code = this.otpValues.join('');
    this.validate.emit(code);
  }

  /**
   * Llama este método desde el padre cuando el backend confirma que
   * el código es CORRECTO. Muestra el estado de éxito y luego emite
   * (successRedirect) para que el padre navegue a inicio.
   */
  showSuccess(): void {
    this.isLoading = false;
    this.isSuccess = true;
    this.clearCountdown();
    // Espera 2 segundos mostrando el éxito y luego avisa al padre
    setTimeout(() => {
      this.successRedirect.emit();
      this.resetModal();
    }, 2000);
  }

  /**
   * Llama este método desde el padre cuando el backend devuelve que
   * el código es INCORRECTO.
   */
  showError(): void {
    this.isLoading = false;
    this.hasError = true;
    this.otpValues = ['', '', '', '', '', ''];
    setTimeout(() => this.focusInput(0), 100);
    setTimeout(() => (this.hasError = false), 3000);
  }

  /** Para detener el spinner manualmente si es necesario */
  stopLoading(): void {
    this.isLoading = false;
  }

  cerrar(): void {
    this.resetModal();
    this.closed.emit();
  }

  reenviarCodigo(): void {
    this.otpValues = ['', '', '', '', '', ''];
    this.hasError = false;
    this.startCountdown();
    this.resend.emit();
    setTimeout(() => this.focusInput(0), 100);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('otp-overlay')) {
      this.cerrar();
    }
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────

  private focusInput(index: number): void {
    const inputs = this.otpInputs?.toArray();
    inputs?.[index]?.nativeElement?.focus();
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.countdown = 60;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) this.clearCountdown();
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private resetModal(): void {
    this.otpValues = ['', '', '', '', '', ''];
    this.hasError  = false;
    this.isLoading = false;
    this.isSuccess = false;
  }
}
