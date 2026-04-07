/**
 * Utilidad de validación de signos vitales.
 * Rangos clínicos globales (no por especie).
 *
 * NORMAL    → dentro del rango funcional
 * ALERTA    → ligeramente fuera del rango (posible problema)
 * EMERGENCIA → valores extremos (riesgo de muerte)
 */

export type VitalStatus = 'NORMAL' | 'ALERTA' | 'EMERGENCIA';

export interface VitalResult {
  status: VitalStatus;
  label: string;
  emoji: string;
  color: string;
}

const RESULT: Record<VitalStatus, VitalResult> = {
  NORMAL:     { status: 'NORMAL',     label: 'Normal',     emoji: '✅', color: '#22A06B' },
  ALERTA:     { status: 'ALERTA',     label: 'Alerta',     emoji: '⚠️', color: '#F59E0B' },
  EMERGENCIA: { status: 'EMERGENCIA', label: 'Emergencia', emoji: '🚨', color: '#DC2626' },
};

export function evaluarTemperatura(valor: number | null): VitalResult | null {
  if (valor === null || valor === undefined) return null;
  if (valor < 32 || valor > 41) return RESULT.EMERGENCIA;
  if ((valor >= 32 && valor <= 34.9) || (valor >= 40 && valor <= 41)) return RESULT.ALERTA;
  return RESULT.NORMAL; // 35 – 39.9
}

export function evaluarFrecuenciaCardiaca(valor: number | null): VitalResult | null {
  if (valor === null || valor === undefined) return null;
  if (valor < 30 || valor > 250) return RESULT.EMERGENCIA;
  if ((valor >= 30 && valor <= 39) || (valor >= 181 && valor <= 250)) return RESULT.ALERTA;
  return RESULT.NORMAL; // 40 – 180
}

export function evaluarFrecuenciaRespiratoria(valor: number | null): VitalResult | null {
  if (valor === null || valor === undefined) return null;
  if (valor < 6 || valor > 60) return RESULT.EMERGENCIA;
  if ((valor >= 6 && valor <= 7) || (valor >= 41 && valor <= 60)) return RESULT.ALERTA;
  return RESULT.NORMAL; // 8 – 40
}

export function evaluarPeso(valor: number | null): VitalResult | null {
  if (valor === null || valor === undefined) return null;
  if (valor < 0.02) return RESULT.EMERGENCIA;
  return RESULT.NORMAL;
}
