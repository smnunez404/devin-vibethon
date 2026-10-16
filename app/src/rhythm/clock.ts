/**
 * Reloj de canción basado en el propio audio (audio.currentTime + vueltas
 * del loop). performance.now() deriva respecto a la reproducción real y en
 * sesiones largas las notas acabarían desincronizadas del beat; el tiempo
 * de la canción es negativo durante el lead-in (cuenta atrás).
 */
export class SongClock {
  private audio: HTMLAudioElement;
  private running = false;
  private paused = false;
  /** Vueltas completas del loop de audio (16 s). */
  private loops = 0;
  private lastAudioT = 0;
  readonly leadInMs = 2000;

  constructor(src: string) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = 0.5;
    this.audio.preload = 'auto';
  }

  async start(): Promise<void> {
    this.audio.currentTime = 0;
    this.loops = 0;
    this.lastAudioT = 0;
    await this.audio.play();
    this.running = true;
    this.paused = false;
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.audio.pause();
    this.paused = true;
  }

  async resume(): Promise<void> {
    if (!this.paused) return;
    await this.audio.play();
    this.paused = false;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** ms en la canción; < 0 durante la cuenta atrás. */
  songTime(): number {
    if (!this.running) return -this.leadInMs;
    const t = this.audio.currentTime;
    const dur = this.audio.duration || 0;
    // El loop vuelve a 0: contar la vuelta para que el tiempo siga creciendo.
    if (dur > 0 && t < this.lastAudioT - 0.5) this.loops++;
    this.lastAudioT = t;
    return (this.loops * dur + t) * 1000 - this.leadInMs;
  }

  /** Timestamp de performance.now() → tiempo de canción actual. */
  toSongTime(_wallTs: number): number {
    return this.songTime();
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
