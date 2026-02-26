import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  alertCircleOutline,
  closeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

/**
 * Componente modal reutilizable para verificación OTP (2FA).
 *
 * Flujo esperado:
 * 1. El padre muestra el modal con [isVisible]="true".
 * 2. El usuario ingresa el código de 6 dígitos.
 * 3. Al presionar Validar, emite (validate) con el código.
 * 4. El padre llama al backend y según la respuesta:
 *    - Correcto            → llama showSuccess()
 *    - Incorrecto con N intentos restantes → llama showErrorConIntentos(N)
 *    - Incorrecto sin info → llama showError()
 *    - Bloqueado           → llama showLocked(segundos)
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

  /** Correo del usuario — se enmascara en pantalla */
  @Input() email = '';

  /** Emite el código OTP completo al presionar Validar */
  @Output() validate = new EventEmitter<string>();

  /** Emite cuando el usuario cierra el modal */
  @Output() closed = new EventEmitter<void>();

  /** Emite cuando el usuario solicita reenviar el código */
  @Output() resend = new EventEmitter<void>();

  /** Emite cuando termina la animación de éxito y hay que navegar */
  @Output() successRedirect = new EventEmitter<void>();

  @ViewChildren('otpInputs') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  otpValues: string[] = ['', '', '', '', '', ''];
  hasError  = false;
  isLoading = false;
  isSuccess = false;
  isLocked  = false;

  /** Mensaje de error dinámico — muestra intentos restantes si el backend los envía */
  errorMessage = 'Código incorrecto. Intenta de nuevo.';

  countdown   = 60;
  lockSeconds = 0;

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private lockInterval:      ReturnType<typeof setInterval> | null = null;

  constructor() {
    addIcons({ mailOutline, alertCircleOutline, closeOutline, checkmarkCircleOutline });
  }

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
    this.clearLock();
  }

  // ─── Computed ───────────────────────────────────────────

  /** Enmascara el correo: ejem****@correo.com */
  get maskedEmail(): string {
    if (!this.email) return '';
    const [local, domain] = this.email.split('@');
    return `${local.slice(0, 4)}****@${domain}`;
  }

  /** Verdadero cuando los 6 dígitos están completos */
  get isComplete(): boolean {
    return this.otpValues.every(v => v !== '');
  }

  // ─── Interacción con inputs ──────────────────────────────

  onDigitInput(event: Event, index: number): void {
    if (this.isLocked) return;

    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length > 1) input.value = value[0];

    this.otpValues[index] = value[0] ?? '';
    input.value = this.otpValues[index];
    this.hasError = false;

    if (this.otpValues[index] && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (this.isLocked) return;

    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (this.otpValues[index]) {
        this.otpValues[index] = '';
        input.value = '';
      } else if (index > 0) {
        this.otpValues[index - 1] = '';
        this.setInputValue(index - 1, '');
        this.focusInput(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft'  && index > 0) this.focusInput(index - 1);
    if (event.key === 'ArrowRight' && index < 5) this.focusInput(index + 1);
  }

  onPaste(event: ClipboardEvent): void {
    if (this.isLocked) return;

    event.preventDefault();
    const digits = (event.clipboardData?.getData('text') ?? '')
      .replace(/\D/g, '').slice(0, 6).split('');

    digits.forEach((d, i) => { if (i < 6) this.otpValues[i] = d; });
    this.syncInputsFromValues();

    setTimeout(() => this.focusInput(Math.min(digits.length - 1, 5)), 0);
  }

  // ─── Acciones ────────────────────────────────────────────

  validar(): void {
    if (this.isLocked || !this.isComplete || this.isLoading) return;
    this.isLoading = true;
    const code = this.otpValues.join('');
    this.validate.emit(code);
  }

  /**
   * Llamar desde el padre cuando el backend confirma código CORRECTO.
   * Muestra animación de éxito y emite successRedirect tras 2 segundos.
   */
  showSuccess(): void {
    this.isLoading = false;
    this.isSuccess = true;
    this.clearCountdown();
    this.clearLock();

    setTimeout(() => {
      this.successRedirect.emit();
      this.resetModal();
    }, 2000);
  }

  /**
   * Llamar desde el padre cuando el código es INCORRECTO
   * y el backend no informa cuántos intentos quedan.
   */
  showError(): void {
    this.errorMessage = 'Código incorrecto. Intenta de nuevo.';
    this.aplicarError();
  }

  /**
   * Llamar desde el padre cuando el código es INCORRECTO
   * y el backend informa cuántos intentos quedan.
   *
   * @param restantes número de intentos restantes que devuelve el backend
   */
  showErrorConIntentos(restantes: number): void {
    this.errorMessage = `Código incorrecto. Intentos restantes: ${restantes}`;
    this.aplicarError();
  }

  /**
   * Llamar desde el padre cuando la cuenta queda bloqueada temporalmente.
   *
   * @param seconds segundos de bloqueo
   */
  showLocked(seconds: number): void {
    this.isLoading = false;
    this.isLocked  = true;

    this.otpValues = ['', '', '', '', '', ''];
    this.syncInputsFromValues();

    this.lockSeconds = Math.max(1, Math.floor(seconds));
    this.clearLock();

    this.lockInterval = setInterval(() => {
      this.lockSeconds--;
      if (this.lockSeconds <= 0) {
        this.clearLock();
        this.isLocked = false;
      }
    }, 1000);
  }

  stopLoading(): void {
    this.isLoading = false;
  }

  cerrar(): void {
    this.resetModal();
    this.closed.emit();
  }

  reenviarCodigo(): void {
    if (this.isLocked) return;

    this.otpValues = ['', '', '', '', '', ''];
    this.syncInputsFromValues();

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

  // ─── Helpers privados ────────────────────────────────────

  /**
   * Lógica común para mostrar estado de error en los inputs.
   * Se llama desde showError() y showErrorConIntentos().
   */
  private aplicarError(): void {
    this.isLoading = false;
    this.hasError  = true;

    this.otpValues = ['', '', '', '', '', ''];
    this.syncInputsFromValues();

    setTimeout(() => this.focusInput(0), 100);
    setTimeout(() => (this.hasError = false), 3000);
  }

  private focusInput(index: number): void {
    const el = this.otpInputs?.toArray()?.[index]?.nativeElement;
    el?.focus();
    el?.select?.();
  }

  private setInputValue(index: number, value: string): void {
    const el = this.otpInputs?.toArray()?.[index]?.nativeElement;
    if (el) el.value = value;
  }

  private syncInputsFromValues(): void {
    (this.otpInputs?.toArray() ?? []).forEach((ref, i) => {
      ref.nativeElement.value = this.otpValues[i] ?? '';
    });
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

  private clearLock(): void {
    if (this.lockInterval) {
      clearInterval(this.lockInterval);
      this.lockInterval = null;
    }
  }

  private resetModal(): void {
    this.otpValues    = ['', '', '', '', '', ''];
    this.hasError     = false;
    this.isLoading    = false;
    this.isSuccess    = false;
    this.isLocked     = false;
    this.lockSeconds  = 0;
    this.errorMessage = 'Código incorrecto. Intenta de nuevo.';
    this.syncInputsFromValues();
    this.clearLock();
  }
}
