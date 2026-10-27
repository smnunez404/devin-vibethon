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
const HOLD_MS = 45;
/** Mínimo entre disparos de la misma extremidad. */
const REFRACTORY_MS = 220;

/**
 * Detecta golpe/elevación de mano con histéresis + antirrebote:
 * dispara cuando el puño sube a la altura de pecho/hombro/cabeza (donde llegan
 * las tarjetas de puño en el referente) y se rearma al bajar hacia posición neutral.
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

      // Las notas de puño llegan a altura de pecho/cara: basta con subir el puño
      // a nivel de hombro/pecho alto, y se rearma al bajar hacia el torso medio.
      const raiseY = metrics.shoulderY + 0.12 * metrics.torsoHeight;
      const neutralY = metrics.shoulderY + 0.36 * metrics.torsoHeight;

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
  knee: number;
  lifted: boolean;
  candidateSince: number;
  lastFire: number;
}

/**
 * Detecta "pie levantado" (paso): el tobillo o la rodilla sube sobre su baseline
 * calibrado una fracción del torso. Incluye respaldo por rodilla para cuando
 * la confianza de tobillo baja en cámara web.
 */
export class FootLiftDetector {
  private sides: Record<Hand, FootSide> = {
    left: { ankle: LM.leftAnkle, knee: LM.leftKnee, lifted: false, candidateSince: 0, lastFire: 0 },
    right: { ankle: LM.rightAnkle, knee: LM.rightKnee, lifted: false, candidateSince: 0, lastFire: 0 },
  };

  update(lms: Landmark[] | null, metrics: BodyMetrics): GestureEvent[] {
    const events: GestureEvent[] = [];
    const now = performance.now();
    const baselines: Record<Hand, number> = {
      left: metrics.leftAnkleY,
      right: metrics.rightAnkleY,
    };
    const lift = Math.max(0.026, metrics.torsoHeight * 0.095);
    const kneeBaseline = (metrics.hipY + (metrics.leftAnkleY + metrics.rightAnkleY) / 2) / 2;
    const kneeLift = Math.max(0.028, metrics.torsoHeight * 0.1);
    for (const foot of ['left', 'right'] as const) {
      const s = this.sides[foot];
      const ankle = lms?.[s.ankle];
      const knee = lms?.[s.knee];
      const ankleOk = ankle && (ankle.visibility ?? 0) >= 0.35;
      const kneeOk = knee && (knee.visibility ?? 0) >= 0.45;
      if (!ankleOk && !kneeOk) continue;

      const isUp =
        (ankleOk && ankle.y < baselines[foot] - lift) ||
        (kneeOk && knee.y < kneeBaseline - kneeLift);
      const isDown =
        (!ankleOk || ankle.y > baselines[foot] - lift * 0.4) &&
        (!kneeOk || knee.y > kneeBaseline - kneeLift * 0.4);

      if (isUp) {
        if (s.candidateSince === 0) s.candidateSince = now;
        if (!s.lifted && now - s.candidateSince >= HOLD_MS && now - s.lastFire >= REFRACTORY_MS) {
          s.lifted = true;
          s.lastFire = now;
          events.push({ kind: 'foot-lifted', hand: foot, timestamp: now });
        }
      } else {
        s.candidateSince = 0;
        if (s.lifted && isDown) s.lifted = false;
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
 * Detecta salto: ambos tobillos se elevan o los hombros/cadera suben juntos
 * sobre su posición calibrada. Se rearma al volver al suelo.
 */
export class JumpDetector {
  private airborne = false;
  private candidateSince = 0;
  private lastFire = 0;

  update(lms: Landmark[] | null, metrics: BodyMetrics): GestureEvent[] {
    if (!lms) return [];
    const now = performance.now();
    const la = lms[LM.leftAnkle];
    const ra = lms[LM.rightAnkle];
    const ls = lms[LM.leftShoulder];
    const rs = lms[LM.rightShoulder];
    const lift = Math.max(0.025, metrics.torsoHeight * 0.085);
    const anklesUp =
      (la?.visibility ?? 0) >= 0.35 &&
      (ra?.visibility ?? 0) >= 0.35 &&
      la.y < metrics.leftAnkleY - lift &&
      ra.y < metrics.rightAnkleY - lift;
    const shoulderY = ((ls?.y ?? 1) + (rs?.y ?? 1)) / 2;
    const torsoUp =
      (ls?.visibility ?? 0) >= 0.45 &&
      (rs?.visibility ?? 0) >= 0.45 &&
      shoulderY < metrics.shoulderY - Math.max(0.028, metrics.torsoHeight * 0.11);
    const bothUp = anklesUp || torsoUp;

    if (bothUp) {
      if (this.candidateSince === 0) this.candidateSince = now;
      if (!this.airborne && now - this.candidateSince >= 55 && now - this.lastFire >= REFRACTORY_MS) {
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
