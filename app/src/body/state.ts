import { LM, type Landmark } from '../types';
import type { BodyMetrics } from './calibration';

export type Lean = 'left' | 'right' | null;

/** Estado corporal sostenido por frame — para obstáculos que se mantienen. */
export interface BodyState {
  lean: Lean;
  ducking: boolean;
}

export function computeBodyState(lms: Landmark[] | null, m: BodyMetrics): BodyState {
  if (!lms) return { lean: null, ducking: false };
  const ls = lms[LM.leftShoulder];
  const rs = lms[LM.rightShoulder];
  const lh = lms[LM.leftHip];
  const rh = lms[LM.rightHip];
  const vis = Math.min(
    ls.visibility ?? 0,
    rs.visibility ?? 0,
    lh.visibility ?? 0,
    rh.visibility ?? 0,
  );

  // Coordenadas de imagen: inclinarse a la izquierda propia desplaza el
  // torso hacia +x de imagen (en la vista espejo se ve a la izquierda).
  const centerX = (ls.x + rs.x + lh.x + rh.x) / 4;
  const leanOff = 0.3 * m.shoulderWidth;
  const lean: Lean =
    vis < 0.4 ? null : centerX > m.torsoCenterX + leanOff ? 'left' : centerX < m.torsoCenterX - leanOff ? 'right' : null;

  // Agacharse: los hombros bajan respecto a su altura calibrada.
  const shoulderY = (ls.y + rs.y) / 2;
  const ducking = vis >= 0.4 && shoulderY > m.shoulderY + 0.45 * m.torsoHeight;

  return { lean, ducking };
}
