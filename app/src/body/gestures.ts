import { LM, type Hand, type Landmark } from '../types';
import type { BodyMetrics } from './calibration';

const VIS_MIN = 0.5;

export interface GestureEvent {
  kind: 'hand-raised' | 'foot-lifted' | 'jumped' | 'punch';
  hand: Hand;
  timestamp: number;
}

interface HandSide {
  wrist: number;
  shoulder: number;
  raised: boolean;
  /** performance.now() desde que se cumple la condición de subida. */
  candidateSince: number;
  lastFire: number;
}

/** El gesto debe sostenerse este tiempo para disparar. */
const HOLD_MS = 100;
/** Mínimo entre disparos de la misma mano. */
const REFRACTORY_MS = 300;

/**
 * Detecta "mano elevada" con histéresis + antirrebote:
 * dispara una vez si la muñeca se sostiene HOLD_MS sobre el umbral alto
 * y se rearma solo al volver a la zona neutral (bajo el hombro).
 */
export class HandRaiseDetector {
  private sides: Record<Hand, HandSide> = {
    left: { wrist: LM.leftWrist, shoulder: LM.leftShoulder, raised: false, candidateSince: 0, lastFire: 0 },
    right: { wrist: LM.rightWrist, shoulder: LM.rightShoulder, raised: false, candidateSince: 0, lastFire: 0 },
  };

  update(lms: Landmark[] | null, metrics: BodyMetrics): GestureEvent[] {
    const events: GestureEvent[] = [];
    const now = performance.now();
    for (const hand of ['left', 'right'] as const) {
      const s = this.sides[hand];
      const wrist = lms?.[s.wrist];
      const shoulder = lms?.[s.shoulder];
      const vis = wrist?.visibility ?? 0;
      if (!wrist || !shoulder || vis < VIS_MIN) continue;

      // Umbral proporcional al torso calibrado: muñeca claramente por encima del hombro.
      const raiseY = metrics.shoulderY - 0.4 * metrics.torsoHeight;
      const neutralY = metrics.shoulderY + 0.1 * metrics.torsoHeight;

      if (wrist.y < raiseY) {
        if (s.candidateSince === 0) s.candidateSince = now;
        if (!s.raised && now - s.candidateSince >= HOLD_MS && now - s.lastFire >= REFRACTORY_MS) {
          s.raised = true;
          s.lastFire = now;
          events.push({ kind: 'hand-raised', hand, timestamp: now });
        }
      } else {
        s.candidateSince = 0;
        if (s.raised && wrist.y > neutralY) s.raised = false;
      }
    }
    return events;
  }

  reset(): void {
    for (const hand of ['left', 'right'] as const) {
      this.sides[hand].raised = false;
      this.sides[hand].candidateSince = 0;
    }
  }
}

interface FootSide {
  ankle: number;
  lifted: boolean;
  candidateSince: number;
  lastFire: number;
}

/**
 * Detecta "pie levantado" (paso): el tobillo sube sobre su baseline
 * calibrado una fracción del torso. Mismo esquema de histéresis y
 * antirrebote que las manos; se rearma al volver al suelo.
 */
export class FootLiftDetector {
  private sides: Record<Hand, FootSide> = {
    left: { ankle: LM.leftAnkle, lifted: false, candidateSince: 0, lastFire: 0 },
    right: { ankle: LM.rightAnkle, lifted: false, candidateSince: 0, lastFire: 0 },
  };

  update(lms: Landmark[] | null, metrics: BodyMetrics): GestureEvent[] {
    const events: GestureEvent[] = [];
    const now = performance.now();
    const baselines: Record<Hand, number> = {
      left: metrics.leftAnkleY,
      right: metrics.rightAnkleY,
    };
    // Umbral: una elevación del ~12% del torso calibrado (un paso real lo supera con creces).
    const lift = Math.max(0.035, metrics.torsoHeight * 0.12);
    for (const foot of ['left', 'right'] as const) {
      const s = this.sides[foot];
      const ankle = lms?.[s.ankle];
      const vis = ankle?.visibility ?? 0;
      if (!ankle || vis < VIS_MIN) continue;

      if (ankle.y < baselines[foot] - lift) {
        if (s.candidateSince === 0) s.candidateSince = now;
        if (!s.lifted && now - s.candidateSince >= HOLD_MS && now - s.lastFire >= REFRACTORY_MS) {
          s.lifted = true;
          s.lastFire = now;
          events.push({ kind: 'foot-lifted', hand: foot, timestamp: now });
        }
      } else {
        s.candidateSince = 0;
        if (s.lifted && ankle.y > baselines[foot] - lift * 0.4) s.lifted = false;
      }
    }
    return events;
  }

  reset(): void {
    for (const foot of ['left', 'right'] as const) {
      this.sides[foot].lifted = false;
      this.sides[foot].candidateSince = 0;
    }
  }
}

/**
 * Detecta salto: ambos tobillos por encima del baseline a la vez,
 * sostenido un instante. Se rearma cuando los dos vuelven al suelo.
 */
export class JumpDetector {
  private airborne = false;
  private candidateSince = 0;
  private lastFire = 0;

  update(lms: Landmark[] | null, metrics: BodyMetrics): GestureEvent[] {
    const now = performance.now();
    const la = lms?.[LM.leftAnkle];
    const ra = lms?.[LM.rightAnkle];
    if (!la || !ra || (la.visibility ?? 0) < VIS_MIN || (ra.visibility ?? 0) < VIS_MIN) {
      return [];
    }
    const lift = Math.max(0.03, metrics.torsoHeight * 0.1);
    const bothUp = la.y < metrics.leftAnkleY - lift && ra.y < metrics.rightAnkleY - lift;

    if (bothUp) {
      if (this.candidateSince === 0) this.candidateSince = now;
      if (!this.airborne && now - this.candidateSince >= 80 && now - this.lastFire >= REFRACTORY_MS) {
        this.airborne = true;
        this.lastFire = now;
        return [{ kind: 'jumped', hand: 'left', timestamp: now }];
      }
    } else {
      this.candidateSince = 0;
      this.airborne = false;
    }
    return [];
  }

  reset(): void {
    this.airborne = false;
    this.candidateSince = 0;
  }
}

/**
 * Detecta puñetazo hacia la cámara (experimental): la muñeca se acerca
 * mucho más que el hombro en z (negativo = hacia la cámara), manteniéndose
 * a la altura del pecho — para no confundirlo con una mano elevada.
 * La coordenada z de MediaPipe es ruidosa; umbral conservador.
 */
export class PunchDetector {
  private sides: Record<Hand, { punching: boolean; candidateSince: number; lastFire: number }> = {
    left: { punching: false, candidateSince: 0, lastFire: 0 },
    right: { punching: false, candidateSince: 0, lastFire: 0 },
  };

  update(lms: Landmark[] | null, metrics: BodyMetrics): GestureEvent[] {
    const events: GestureEvent[] = [];
    const now = performance.now();
    for (const hand of ['left', 'right'] as const) {
      const s = this.sides[hand];
      const wrist = lms?.[hand === 'left' ? LM.leftWrist : LM.rightWrist];
      const shoulder = lms?.[hand === 'left' ? LM.leftShoulder : LM.rightShoulder];
      if (!wrist || !shoulder || (wrist.visibility ?? 0) < VIS_MIN) continue;

      const depth = wrist.z - shoulder.z; // muy negativo = puño hacia la cámara
      const chestLevel = Math.abs(wrist.y - shoulder.y) < 0.4 * metrics.torsoHeight;
      const punching = chestLevel && depth < -0.25 * metrics.shoulderWidth * 4;

      if (punching) {
        if (s.candidateSince === 0) s.candidateSince = now;
        if (!s.punching && now - s.candidateSince >= 80 && now - s.lastFire >= REFRACTORY_MS) {
          s.punching = true;
          s.lastFire = now;
          events.push({ kind: 'punch', hand, timestamp: now });
        }
      } else {
        s.candidateSince = 0;
        s.punching = false;
      }
    }
    return events;
  }

  reset(): void {
    for (const hand of ['left', 'right'] as const) {
      this.sides[hand].punching = false;
      this.sides[hand].candidateSince = 0;
    }
  }
}
