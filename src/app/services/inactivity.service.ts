import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

/**
 * InactivityService — Pawsoft
 *
 * Detecta inactividad real del usuario (mouse, teclado, scroll, touch)
 * y ejecuta logout automático tras X minutos sin actividad.
 *
 * ── Integración con el guard ─────────────────────────────────────────────────
 * Este servicio NO duplica la lógica del authGuard.
 * Solo limpia el token y navega a /login — el guard ya protege el resto.
 *
 * ── Uso ──────────────────────────────────────────────────────────────────────
 * 1. Inyectar en AppComponent (o en el layout protegido) y llamar:
 *      this.inactivityService.startWatching();
 * 2. Al hacer logout manual, llamar:
 *      this.inactivityService.stopWatching();
 *
 * ── Eventos que resetean el timer ────────────────────────────────────────────
 *   mousemove · mousedown · keydown · touchstart · touchmove · scroll · wheel
 *
 * Proyecto: Pawsoft — Universidad del Quindío — Software III
 * Autoras: Valentina Porras Salazar · Helen Xiomara Giraldo Libreros
 */
@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {

  /** Minutos de inactividad antes de hacer logout automático */
  private readonly TIMEOUT_MINUTES = 3;

  private readonly TIMEOUT_MS = this.TIMEOUT_MINUTES * 60 * 1000;

  /** Eventos del DOM que se consideran "actividad del usuario" */
  private readonly ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'touchmove',
    'scroll',
    'wheel',
    'pointerdown',
    'pointermove',
  ];

  private timeoutRef: ReturnType<typeof setTimeout> | null = null;
  private boundReset!: () => void;
  private boundVisibility!: () => void;
  private isWatching = false;
  /** Timestamp de la última actividad detectada (ms) */
  private lastActivityAt = 0;

  constructor(
    private readonly router: Router,
    private readonly ngZone: NgZone,
  ) {}

  ngOnDestroy(): void {
    this.stopWatching();
  }

  // ── API pública ───────────────────────────────────────────────────────────

  /**
   * Inicia la escucha de eventos de actividad y el timer de inactividad.
   * Llamar cuando el usuario inicia sesión correctamente.
   *
   * Es idempotente: si ya está corriendo, no registra listeners duplicados.
   */
  startWatching(): void {
    if (this.isWatching) return;
    this.isWatching = true;

    this.boundReset = this.resetTimer.bind(this);
    this.boundVisibility = this.onVisibilityChange.bind(this);

    this.ngZone.runOutsideAngular(() => {
      // Escucha en window Y en document para cubrir Ionic/Capacitor en móvil
      this.ACTIVITY_EVENTS.forEach(event => {
        window.addEventListener(event, this.boundReset, { passive: true });
        document.addEventListener(event as any, this.boundReset, { passive: true });
      });
      // Detecta cuando el usuario vuelve a la app desde background
      document.addEventListener('visibilitychange', this.boundVisibility);
    });

    this.resetTimer();
  }

  /**
   * Detiene el timer y remueve todos los listeners.
   * Llamar al hacer logout manual para evitar memory leaks.
   */
  stopWatching(): void {
    if (!this.isWatching) return;
    this.isWatching = false;

    this.clearTimer();

    if (this.boundReset) {
      this.ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, this.boundReset);
        document.removeEventListener(event as any, this.boundReset);
      });
    }
    if (this.boundVisibility) {
      document.removeEventListener('visibilitychange', this.boundVisibility);
    }
  }

  // ── Lógica interna ────────────────────────────────────────────────────────

  /**
   * Reinicia el timer cada vez que se detecta actividad del usuario.
   * Corre fuera de la zona Angular — NO trigger detección de cambios.
   */
  private resetTimer(): void {
    this.lastActivityAt = Date.now();
    this.clearTimer();

    this.timeoutRef = setTimeout(() => {
      this.ngZone.run(() => this.onTimeout());
    }, this.TIMEOUT_MS);
  }

  /**
   * Se ejecuta cuando el timer expira (inactividad real).
   * Limpia la sesión y delega la redirección al router.
   * El authGuard protegerá automáticamente cualquier ruta posterior.
   */
  private onTimeout(): void {
    this.stopWatching();
    localStorage.removeItem('token');

    // replaceUrl: true evita que el botón "atrás" regrese a una ruta protegida
    this.router.navigate(['/login'], {
      replaceUrl: true,
      state: { reason: 'inactivity' },
    });
  }

  /**
   * Se ejecuta cuando el documento vuelve a ser visible (app en primer plano).
   * Si el timer ya expiró mientras la app estaba en background, hace logout.
   */
  private onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      if (!localStorage.getItem('token')) return;

      const elapsed = Date.now() - this.lastActivityAt;
      if (elapsed >= this.TIMEOUT_MS) {
        // El tiempo de inactividad ya pasó mientras la app estaba en background
        this.ngZone.run(() => this.onTimeout());
      } else {
        // Aún dentro del tiempo — reinicia el timer con el tiempo restante
        this.clearTimer();
        const remaining = this.TIMEOUT_MS - elapsed;
        this.timeoutRef = setTimeout(() => {
          this.ngZone.run(() => this.onTimeout());
        }, remaining);
      }
    }
  }

  private clearTimer(): void {
    if (this.timeoutRef !== null) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
    }
  }
}
