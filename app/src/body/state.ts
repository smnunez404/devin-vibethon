import { LM, type Landmark } from '../types';
import type { BodyMetrics } from './calibration';

export type Lean = 'left' | 'right' | null;

/** Estado corporal sostenido por frame — para obstáculos que se mantienen. */
export interface BodyState {
  lean: Lean;
  ducking: boolean;
  jumping: boolean;
}

export function computeBodyState(lms: Landmark[] | null, m: BodyMetrics): BodyState {
  if (!lms) return { lean: null, ducking: false, jumping: false };
  const ls = lms[LM.leftShoulder];
  const rs = lms[LM.rightShoulder];
  const lh = lms[LM.leftHip];
  const rh = lms[LM.rightHip];
  const nose = lms[LM.nose];
  const vis = Math.min(
    ls.visibility ?? 0,
    rs.visibility ?? 0,
    lh.visibility ?? 0,
    rh.visibility ?? 0,
  );

  // Coordenadas de imagen: inclinarse o desplazarse a la izquierda propia mueve
  // hombros/cabeza/torso hacia +x de imagen (en la vista espejo se ve a la izquierda).
  const shoulderCenterX = (ls.x + rs.x) / 2;
  const torsoX = (ls.x + rs.x + lh.x + rh.x) / 4;
  const headBias = (nose?.visibility ?? 0) >= 0.4 ? (nose.x - m.torsoCenterX) * 0.35 : 0;
  const effectiveX = shoulderCenterX * 0.65 + torsoX * 0.35 + headBias;
  const leanOff = 0.22 * m.shoulderWidth;
  const lean: Lean =
    vis < 0.35
      ? null
      : effectiveX > m.torsoCenterX + leanOff
        ? 'left'
        : effectiveX < m.torsoCenterX - leanOff
          ? 'right'
          : null;

  // Agacharse: los hombros bajan respecto a su altura calibrada.
  const shoulderY = (ls.y + rs.y) / 2;
  const ducking = vis >= 0.35 && shoulderY > m.shoulderY + 0.32 * m.torsoHeight;

  // Salto sostenido: ambos tobillos suben o el torso/hombros se elevan claramente.
  const la = lms[LM.leftAnkle];
  const ra = lms[LM.rightAnkle];
  const anklesUp =
    (la?.visibility ?? 0) >= 0.35 &&
    (ra?.visibility ?? 0) >= 0.35 &&
    la.y < m.leftAnkleY - Math.max(0.025, m.torsoHeight * 0.08) &&
    ra.y < m.rightAnkleY - Math.max(0.025, m.torsoHeight * 0.08);
  const torsoUp = vis >= 0.4 && shoulderY < m.shoulderY - Math.max(0.03, m.torsoHeight * 0.11);
  const jumping = anklesUp || torsoUp;

  return { lean, ducking, jumping };
}
