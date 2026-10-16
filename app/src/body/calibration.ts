import { LM, type Landmark } from '../types';

const VIS_OK = 0.5;

export interface BodyMetrics {
  /** Distancia hombro-hombro en coords normalizadas. */
  shoulderWidth: number;
  /** Distancia hombros-cadera (vertical aproximada). */
  torsoHeight: number;
  /** Altura media de hombros (y normalizada). */
  shoulderY: number;
  /** Altura media de cadera. */
  hipY: number;
  /** Centro horizontal del torso en posición neutral. */
  torsoCenterX: number;
  /** Altura baseline de tobillos en posición neutral (suelo). */
  leftAnkleY: number;
  rightAnkleY: number;
  /** Visibilidad media por grupo durante la calibración. */
  visibility: { hands: number; feet: number };
}

const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);
const visible = (lm: Landmark | undefined) => (lm?.visibility ?? 0) >= VIS_OK;

export function extractMetrics(lms: Landmark[]): Omit<BodyMetrics, 'visibility'> {
  const ls = lms[LM.leftShoulder];
  const rs = lms[LM.rightShoulder];
  const lh = lms[LM.leftHip];
  const rh = lms[LM.rightHip];
  const shoulderWidth = Math.max(dist(ls, rs), 1e-4);
  const shoulderY = (ls.y + rs.y) / 2;
  const hipY = (lh.y + rh.y) / 2;
  const torsoHeight = Math.max(Math.abs(hipY - shoulderY), 1e-4);
  return {
    shoulderWidth,
    torsoHeight,
    shoulderY,
    hipY,
    torsoCenterX: (ls.x + rs.x + lh.x + rh.x) / 4,
    leftAnkleY: lms[LM.leftAnkle].y,
    rightAnkleY: lms[LM.rightAnkle].y,
  };
}

/** Comprueba si manos y pies están visibles y dentro del encuadre. */
export function framingReport(lms: Landmark[]): {
  handsVisible: boolean;
  feetVisible: boolean;
  warnings: string[];
} {
  const inFrame = (lm: Landmark) => lm.x >= 0.02 && lm.x <= 0.98 && lm.y >= 0.02 && lm.y <= 0.98;
  const check = (idx: number) => {
    const lm = lms[idx];
    return visible(lm) && inFrame(lm);
  };
  const leftHand = check(LM.leftWrist);
  const rightHand = check(LM.rightWrist);
  const leftFoot = check(LM.leftAnkle) || check(LM.leftFootIndex);
  const rightFoot = check(LM.rightAnkle) || check(LM.rightFootIndex);
  const warnings: string[] = [];
  if (!leftHand) warnings.push('mano izquierda fuera de encuadre');
  if (!rightHand) warnings.push('mano derecha fuera de encuadre');
  if (!leftFoot) warnings.push('pie izquierdo fuera de encuadre');
  if (!rightFoot) warnings.push('pie derecho fuera de encuadre');
  return { handsVisible: leftHand && rightHand, feetVisible: leftFoot && rightFoot, warnings };
}

/** Acumula frames durante la calibración y promedia métricas. */
export class Calibrator {
  private samples: Omit<BodyMetrics, 'visibility'>[] = [];
  private handVis: number[] = [];
  private footVis: number[] = [];
  private frames = 0;
  private framesWithPose = 0;

  constructor(private readonly targetFrames = 60) {}

  get progress(): number {
    return Math.min(this.frames / this.targetFrames, 1);
  }

  /** Devuelve métricas al completar, null mientras calibra. */
  addFrame(lms: Landmark[] | null): BodyMetrics | null {
    this.frames++;
    if (lms) {
      this.framesWithPose++;
      this.samples.push(extractMetrics(lms));
      const hv = ((lms[LM.leftWrist].visibility ?? 0) + (lms[LM.rightWrist].visibility ?? 0)) / 2;
      const fv = ((lms[LM.leftFootIndex].visibility ?? 0) + (lms[LM.rightFootIndex].visibility ?? 0)) / 2;
      this.handVis.push(hv);
      this.footVis.push(fv);
    }
    if (this.frames < this.targetFrames) return null;
    if (this.samples.length === 0) {
      return {
        shoulderWidth: 0.2,
        torsoHeight: 0.3,
        shoulderY: 0.4,
        hipY: 0.7,
        torsoCenterX: 0.5,
        leftAnkleY: 0.95,
        rightAnkleY: 0.95,
        visibility: { hands: 0, feet: 0 },
      };
    }
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    return {
      shoulderWidth: avg(this.samples.map((s) => s.shoulderWidth)),
      torsoHeight: avg(this.samples.map((s) => s.torsoHeight)),
      shoulderY: avg(this.samples.map((s) => s.shoulderY)),
      hipY: avg(this.samples.map((s) => s.hipY)),
      torsoCenterX: avg(this.samples.map((s) => s.torsoCenterX)),
      leftAnkleY: avg(this.samples.map((s) => s.leftAnkleY)),
      rightAnkleY: avg(this.samples.map((s) => s.rightAnkleY)),
      visibility: { hands: avg(this.handVis), feet: avg(this.footVis) },
    };
  }

  /** Fracción de frames con pose detectada durante la captura. */
  get poseCoverage(): number {
    return this.frames > 0 ? this.framesWithPose / this.frames : 0;
  }
}
