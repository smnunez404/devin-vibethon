/**
 * Reloj de canción continuo a 60/120 FPS con corrección suave de deriva (PLL)
 * frente a `audio.currentTime` + vueltas del loop. Evita micro-congelaciones o
 * saltos bruscos cuando el navegador actualiza `currentTime` a baja frecuencia.
 */
export class SongClock {
  private audio: HTMLAudioElement;
  private running = false;
  private paused = false;
  /** Vueltas completas del loop de audio (32 s = 64 beats a 120 BPM). */
  private loops = 0;
  private lastAudioT = 0;
  private wallStartMs = 0;
  private wallPausedMs = 0;
  private pauseStartWallMs = 0;
  readonly leadInMs = 2000;

  constructor(src: string) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = 0.65;
    this.audio.preload = 'auto';
  }

  async start(): Promise<void> {
    this.audio.currentTime = 0;
    this.loops = 0;
    this.lastAudioT = 0;
    this.wallPausedMs = 0;
    this.pauseStartWallMs = 0;
    this.wallStartMs = performance.now();
    this.running = true;
    this.paused = false;
    try {
      await this.audio.play();
      this.wallStartMs = performance.now();
    } catch {
      // Si el navegador retrasa o bloquea el audio, el reloj visual sigue corriendo.
    }
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.pauseStartWallMs = performance.now();
    this.audio.pause();
    this.paused = true;
  }

  async resume(): Promise<void> {
    if (!this.paused) return;
    const now = performance.now();
    if (this.pauseStartWallMs > 0) {
      this.wallPausedMs += now - this.pauseStartWallMs;
      this.pauseStartWallMs = 0;
    }
    this.paused = false;
    try {
      await this.audio.play();
    } catch {
      // Ignorar bloqueo de autoplay al reanudar.
    }
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** ms en la canción; < 0 durante la cuenta atrás de 4 beats (2000 ms). */
  songTime(): number {
    if (!this.running) return -this.leadInMs;
    const now = this.paused ? this.pauseStartWallMs : performance.now();
    const wallElapsedMs = now - this.wallStartMs - this.wallPausedMs;

    if (!this.paused && !this.audio.paused) {
      const t = this.audio.currentTime;
      const dur = this.audio.duration || 0;
      if (dur > 0 && t < this.lastAudioT - 0.5) {
        this.loops++;
      }
      if (t !== this.lastAudioT && t > 0) {
        this.lastAudioT = t;
        const audioElapsedMs = (this.loops * dur + t) * 1000;
        const drift = wallElapsedMs - audioElapsedMs;
        // Corrección gradual sin saltos bruscos de fotograma.
        if (Math.abs(drift) > 90 && Math.abs(drift) < 5000) {
          this.wallStartMs += drift * 0.2;
        }
      }
    }

    const effectiveElapsedMs = now - this.wallStartMs - this.wallPausedMs;
    return effectiveElapsedMs - this.leadInMs;
  }

  /** Convierte un timestamp de performance.now() a tiempo de canción sincronizado. */
  toSongTime(wallTs: number): number {
    const current = this.songTime();
    if (this.paused) return current;
    const delta = Math.max(-250, Math.min(45, wallTs - performance.now()));
    return current + delta;
  }

  stop(): void {
    this.audio.pause();
    this.running = false;
    this.paused = false;
  }

  get playing(): boolean {
    return this.running;
  }
}
