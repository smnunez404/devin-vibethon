/**
 * Reloj de canción basado en performance.now(): independiente de la
 * frecuencia de inferencia de pose. El tiempo de canción es negativo
 * durante el lead-in (cuenta atrás).
 */
export class SongClock {
  private audio: HTMLAudioElement;
  private startWall = 0;
  private running = false;
  readonly leadInMs = 2000;

  constructor(src: string) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = 0.5;
    this.audio.preload = 'auto';
  }

  private pausedAt = 0;
  private paused = false;

  async start(): Promise<void> {
    this.audio.currentTime = 0;
    await this.audio.play();
    this.startWall = performance.now();
    this.running = true;
    this.paused = false;
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.pausedAt = performance.now();
    this.audio.pause();
    this.paused = true;
  }

  async resume(): Promise<void> {
    if (!this.paused) return;
    await this.audio.play();
    this.startWall += performance.now() - this.pausedAt;
    this.paused = false;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** ms en la canción; < 0 durante la cuenta atrás. */
  songTime(): number {
    if (!this.running) return -this.leadInMs;
    const now = this.paused ? this.pausedAt : performance.now();
    return now - this.startWall - this.leadInMs;
  }

  /** Convierte un timestamp de performance.now() a tiempo de canción. */
  toSongTime(wallTs: number): number {
    return wallTs - this.startWall - this.leadInMs;
  }

  stop(): void {
    this.audio.pause();
    this.running = false;
  }

  get playing(): boolean {
    return this.running;
  }
}
