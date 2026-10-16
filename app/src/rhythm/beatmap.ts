import type { Hand } from '../types';

/** Carriles: 0 pie izq · 1 mano izq · 2 mano der · 3 pie der. */
export type Lane = 0 | 1 | 2 | 3;

/**
 * Tipos de nota:
 * - 'hand' | 'foot': golpes instantáneos por carril.
 * - 'wall-left' | 'wall-right': pared → esquiva sostenida hacia ese lado.
 * - 'duck': valla alta → agacharse en la ventana.
 * - 'jump': valla baja → saltar en la ventana.
 */
export type NoteKind = 'hand' | 'foot' | 'wall-left' | 'wall-right' | 'duck' | 'jump';

export interface Note {
  id: number;
  kind: NoteKind;
  /** -1 para obstáculos que ocupan toda la pista. */
  lane: Lane | -1;
  hand: Hand;
  /** ms en la canción en que debe resolverse. */
  time: number;
  state: 'pending' | 'hit' | 'missed';
}

export const LANE_OF: Record<'hand' | 'foot', Record<Hand, Lane>> = {
  foot: { left: 0, right: 3 },
  hand: { left: 1, right: 2 },
};

export function laneFor(kind: 'hand' | 'foot', hand: Hand): Lane {
  return LANE_OF[kind][hand];
}

export const OBSTACLE_IMAGE: Record<string, string> = {
  'wall-left': 'obstacles/wall-cue-left.png',
  'wall-right': 'obstacles/wall-cue-right.png',
  duck: 'obstacles/hurdle-high-duck.png',
  jump: 'obstacles/hurdle-low-jump.png',
};

/** Silueta guía asociada a cada obstáculo. */
export const OBSTACLE_POSE: Record<string, string> = {
  'wall-left': 'guides/pose-lean-left.png',
  'wall-right': 'guides/pose-lean-right.png',
  duck: 'guides/pose-duck.png',
  jump: 'guides/pose-jump.png',
};

const isObstacle = (k: NoteKind) => k !== 'hand' && k !== 'foot';

export interface BeatmapOptions {
  /** Pares simultáneos de puños en ciertos beats. */
  pairs?: boolean;
  /** Un obstáculo por compás de 8, rotando tipos. */
  obstacles?: boolean;
}

const OBSTACLE_CYCLE: NoteKind[] = ['wall-left', 'wall-right', 'duck', 'jump'];

/**
 * Beatmap provisional a 120 BPM. Patrón por compás de 8:
 * - beats 2 y 6 → pies (alternando lado)
 * - resto → manos alternas (a partir del beat 32 también pares)
 * - último beat del compás → obstáculo rotando (pared, agacharse, salto)
 */
export function generateBeatmap(bpm = 120, beats = 32, opts: BeatmapOptions = {}): Note[] {
  const beatMs = 60000 / bpm;
  const notes: Note[] = [];
  const withObstacles = opts.obstacles ?? true;
  const withPairs = opts.pairs ?? beats > 32;
  let id = 0;
  const push = (kind: 'hand' | 'foot', hand: Hand, time: number) =>
    notes.push({ id: id++, kind, hand, lane: laneFor(kind, hand), time, state: 'pending' });

  for (let b = 0; b < beats; b++) {
    const time = b * beatMs;
    const pos = b % 8;
    const bar = Math.floor(b / 8);
    if (withObstacles && pos === 7) {
      const kind = OBSTACLE_CYCLE[bar % OBSTACLE_CYCLE.length];
      notes.push({ id: id++, kind, lane: -1, hand: 'left', time, state: 'pending' });
      continue;
    }
    if (pos === 2 || pos === 6) {
      push('foot', pos === 2 ? 'left' : 'right', time);
      continue;
    }
    // Pares de puños cada segundo compás, en el beat 4.
    if (withPairs && pos === 4 && bar % 2 === 1) {
      push('hand', 'left', time);
      push('hand', 'right', time);
      continue;
    }
    push('hand', b % 2 === 0 ? 'left' : 'right', time);
  }
  return notes;
}

export { isObstacle };
