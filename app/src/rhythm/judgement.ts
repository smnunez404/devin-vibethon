export type Rating = 'perfect' | 'great' | 'nice' | 'miss';

/** Ventanas simétricas alrededor del tiempo objetivo de la nota (ms). */
export const WINDOWS = { perfect: 100, great: 180, nice: 280 } as const;

/** delta = tiempoDelGesto - tiempoDeLaNota. null = fuera de ventana. */
export function rate(deltaMs: number): Rating | null {
  const d = Math.abs(deltaMs);
  if (d <= WINDOWS.perfect) return 'perfect';
  if (d <= WINDOWS.great) return 'great';
  if (d <= WINDOWS.nice) return 'nice';
  return null;
}

export const RATING_LABEL: Record<Rating, string> = {
  perfect: 'PERFECT',
  great: 'GREAT',
  nice: 'NICE',
  miss: 'MISS',
};
