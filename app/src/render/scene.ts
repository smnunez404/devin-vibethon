import { BONES, type Landmark } from '../types';
import { isObstacle, OBSTACLE_IMAGE, OBSTACLE_POSE, type Note } from '../rhythm/beatmap';
import type { Rating } from '../rhythm/judgement';

export const PAD_COLORS = ['cyan', 'pink', 'purple', 'yellow'] as const;
type PadColor = (typeof PAD_COLORS)[number];
const PAD_HEX: Record<PadColor, string> = {
  cyan: '#29e6ff',
  pink: '#ff3ec8',
  purple: '#a05dff',
  yellow: '#ffd23e',
};

/** Imagen de nota por carril: 0 pie izq, 1 mano izq, 2 mano der, 3 pie der. */
const LANE_NOTE: Record<number, string> = {
  0: 'note-foot-left-cyan',
  1: 'note-fist-left-pink',
  2: 'note-fist-right-purple',
  3: 'note-foot-right-yellow',
};

export interface GameView {
  notes: Note[];
  songTime: number;
  travelMs: number;
  rating: Rating | null;
  ratingUntil: number;
  combo: number;
  /** Duración de la sesión para la barra de progreso. */
  durationMs?: number;
  paused?: boolean;
}

export interface ResultsView {
  perfect: number;
  great: number;
  nice: number;
  miss: number;
  maxCombo: number;
  total: number;
}

export interface PadHit {
  /** Índices de pads a iluminar (0-3). */
  pads: number[];
  color: PadColor;
}

interface Ring {
  x: number;
  y: number;
  color: PadColor;
  start: number;
}

interface Frag {
  x: number;
  y: number;
  color: PadColor;
  start: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

export class Scene {
  private ctx: CanvasRenderingContext2D;
  private images = new Map<string, HTMLImageElement>();
  private rings: Ring[] = [];
  private frags: Frag[] = [];
  private padFlash = new Map<number, number>(); // pad -> timestamp de expiración
  private drawRect = { x: 0, y: 0, w: 0, h: 0 };
  /** Fondo del modo juego (loop MP4 con pista). Si está, la cámara va a PiP. */
  private bgVideo: HTMLVideoElement | null = null;

  setBackground(bg: HTMLVideoElement | null): void {
    this.bgVideo = bg;
  }

  private pipRect(): { x: number; y: number; w: number; h: number } {
    const w = this.canvas.width * 0.16;
    return { x: 16, y: this.canvas.height - w * 0.5625 - 16, w, h: w * 0.5625 };
  }

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    this.ctx = ctx;
  }

  async loadAssets(): Promise<void> {
    const base = `${import.meta.env.BASE_URL}assets/v001`;
    const jobs: Array<[string, string]> = [
      ['pad-idle', `${base}/pads/pad-idle.png`],
      ['combo-label', `${base}/hud/combo-label.png`],
    ];
    for (const c of PAD_COLORS) {
      jobs.push([`pad-${c}`, `${base}/pads/pad-active-${c}.png`]);
      jobs.push([`ring-${c}`, `${base}/effects/impact-ring-${c}.png`]);
      jobs.push([`frags-${c}`, `${base}/effects/impact-fragments-${c}.png`]);
    }
    for (const [lane, name] of Object.entries(LANE_NOTE)) {
      jobs.push([`note-${lane}`, `${base}/notes/${name}.png`]);
    }
    for (const r of ['perfect', 'great', 'nice', 'miss']) {
      jobs.push([`rating-${r}`, `${base}/hud/rating-${r}.png`]);
    }
    for (let d = 0; d <= 9; d++) {
      jobs.push([`digit-${d}`, `${base}/hud/digit-${d}.png`]);
    }
    for (const [kind, rel] of Object.entries(OBSTACLE_IMAGE)) {
      jobs.push([`obs-${kind}`, `${base}/${rel}`]);
    }
    jobs.push(['guide-panel', `${base}/guides/guide-panel.png`]);
    jobs.push(['results-panel', `${base}/interface/results-panel.png`]);
    jobs.push(['progress-rail', `${base}/hud/progress-rail.png`]);
    jobs.push(['progress-fill', `${base}/hud/progress-fill.png`]);
    for (const [kind, rel] of Object.entries(OBSTACLE_POSE)) {
      jobs.push([`pose-${kind}`, `${base}/${rel}`]);
    }
    await Promise.all(
      jobs.map(async ([key, src]) => {
        this.images.set(key, await loadImage(src));
      }),
    );
  }

  /** Dispara el efecto de acierto en los pads indicados. */
  triggerHit(hit: PadHit): void {
    const now = performance.now();
    for (const i of hit.pads) {
      this.padFlash.set(i, now + 300);
      const p = this.padCenter(i);
      this.rings.push({ x: p.x, y: p.y, color: hit.color, start: now });
      this.frags.push({ x: p.x, y: p.y, color: hit.color, start: now });
    }
  }

  private padRect(i: number): { x: number; y: number; w: number; h: number } {
    const { width, height } = this.canvas;
    const padW = width * 0.11;
    const padH = padW * 0.62;
    const gap = width * 0.035;
    const total = padW * 4 + gap * 3;
    const x = (width - total) / 2 + i * (padW + gap);
    const y = height - padH - height * 0.05;
    return { x, y, w: padW, h: padH };
  }

  private padCenter(i: number): { x: number; y: number } {
    const r = this.padRect(i);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }

  draw(
    video: HTMLVideoElement | null,
    landmarks: Landmark[] | null,
    warnings: string[],
    overlayText: string | null,
    game?: GameView,
  ): void {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, W, H);

    // Fondo del modo juego: loop MP4 (ya incluye la pista).
    if (this.bgVideo && this.bgVideo.readyState >= 2) {
      this.drawVideoCover(this.bgVideo, { x: 0, y: 0, w: W, h: H }, false, 1);
    }

    // Cámara: a pantalla completa (calibración) o en PiP (juego).
    const camRect = this.bgVideo ? this.pipRect() : null;
    if (video && video.videoWidth > 0) {
      const rect = camRect ?? { x: 0, y: 0, w: W, h: H };
      this.drawVideoCover(video, rect, true, camRect ? 0.9 : 0.85);
      if (camRect) {
        ctx.strokeStyle = 'rgba(41,230,255,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      }
      this.drawRect = this.fitRect(video, rect);
    }

    // Guía de posicionamiento (solo con cámara a pantalla completa, fuera del juego).
    if (!camRect && video) this.drawPositionGuide(landmarks);
    // Esqueleto sobre el espacio de la cámara (fullscreen o PiP).
    if (landmarks && video) this.drawSkeleton(landmarks);
    if (camRect) {
      // En modo juego las notas y obstáculos van sobre el fondo.
      if (game) this.drawNotes(game);
    } else if (game) {
      this.drawNotes(game);
    }
    this.drawPads();
    this.drawRings();
    this.drawFrags();
    if (game) {
      this.drawGuide(game);
      this.drawRating(game);
      this.drawCombo(game.combo);
      this.drawProgress(game);
    }
    this.drawHudText(warnings, overlayText);
  }

  /** Barra de progreso de la sesión, arriba al centro. */
  private drawProgress(game: GameView): void {
    if (!game.durationMs) return;
    const { ctx, canvas } = this;
    const rail = this.images.get('progress-rail');
    const fill = this.images.get('progress-fill');
    const w = canvas.width * 0.42;
    const h = canvas.height * 0.022;
    const x = (canvas.width - w) / 2;
    const y = 14;
    const p = Math.min(Math.max(game.songTime / game.durationMs, 0), 1);
    if (rail) {
      const rw = h * (rail.width / rail.height);
      ctx.drawImage(rail, x - (rw - w) / 2, y, rw, h);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x, y, w, h);
    }
    if (fill && p > 0) {
      const iw = fill.width * p;
      ctx.drawImage(fill, 0, 0, iw, fill.height, x, y, w * p, h);
    }
    if (game.paused) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '700 34px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffd23e';
      ctx.fillText('PAUSA', canvas.width / 2, canvas.height * 0.45);
      ctx.restore();
    }
  }

  /** Panel de resultados al terminar la sesión. */
  drawResults(res: ResultsView): void {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(5,5,10,0.72)';
    ctx.fillRect(0, 0, W, H);
    const panel = this.images.get('results-panel');
    const pw = W * 0.5;
    if (panel) {
      const ph = pw * (panel.height / panel.width);
      ctx.drawImage(panel, (W - pw) / 2, H * 0.18, pw, ph);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '700 44px "Segoe UI", sans-serif';
    ctx.fillText('SESIÓN COMPLETA', W / 2, H * 0.32);
    ctx.font = '600 26px "Segoe UI", sans-serif';
    const rows: Array<[string, string]> = [
      ['PERFECT', String(res.perfect)],
      ['GREAT', String(res.great)],
      ['NICE', String(res.nice)],
      ['MISS', String(res.miss)],
      ['COMBO MÁX', String(res.maxCombo)],
      ['PRECISIÓN', `${Math.round(((res.perfect + res.great + res.nice) / Math.max(res.total, 1)) * 100)}%`],
    ];
    let y = H * 0.42;
    for (const [k, v] of rows) {
      ctx.fillStyle = '#9a9ab0';
      ctx.textAlign = 'right';
      ctx.fillText(k, W / 2 - 16, y);
      ctx.fillStyle = '#29e6ff';
      ctx.textAlign = 'left';
      ctx.fillText(v, W / 2 + 16, y);
      y += 40;
    }
    ctx.textAlign = 'center';
    ctx.font = '600 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#9a9ab0';
    ctx.fillText('Pulsa JUGAR para repetir · CALIBRAR para reajustar', W / 2, y + 20);
    ctx.restore();
  }

  /** Video "cover" dentro de un rect; mirror opcional. */
  private drawVideoCover(
    video: HTMLVideoElement,
    rect: { x: number; y: number; w: number; h: number },
    mirror: boolean,
    alpha: number,
  ): void {
    const { ctx } = this;
    const scale = Math.max(rect.w / video.videoWidth, rect.h / video.videoHeight);
    const dw = video.videoWidth * scale;
    const dh = video.videoHeight * scale;
    const dx = rect.x + (rect.w - dw) / 2;
    const dy = rect.y + (rect.h - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (mirror) {
      ctx.translate(rect.x + rect.w, 0);
      ctx.scale(-1, 1);
      ctx.translate(-rect.x, 0);
    }
    ctx.globalAlpha = alpha;
    ctx.drawImage(video, dx, dy, dw, dh);
    ctx.restore();
  }

  private fitRect(video: HTMLVideoElement, rect: { x: number; y: number; w: number; h: number }) {
    const scale = Math.max(rect.w / video.videoWidth, rect.h / video.videoHeight);
    const dw = video.videoWidth * scale;
    const dh = video.videoHeight * scale;
    return { x: rect.x + (rect.w - dw) / 2, y: rect.y + (rect.h - dh) / 2, w: dw, h: dh };
  }

  /**
   * Guía de posicionamiento: zona delimitada + silueta de referencia + marcas
   * de cabeza/manos/pies que se ponen en verde cuando estás en su sitio.
   */
  private drawPositionGuide(landmarks: Landmark[] | null): void {
    const { ctx } = this;
    const { x: ox, y: oy, w: dw, h: dh } = this.drawRect;
    if (dw <= 0) return;
    const W = this.canvas.width;
    const X = (nx: number) => W - (ox + nx * dw); // espejo
    const Y = (ny: number) => oy + ny * dh;

    // Zona donde debe permanecer la persona (coords normalizadas de video).
    const zone = { x0: 0.2, x1: 0.8, y0: 0.05, y1: 0.96 };
    const zx0 = X(zone.x1);
    const zx1 = X(zone.x0);
    const zy0 = Y(zone.y0);
    const zy1 = Y(zone.y1);

    // Marcas objetivo: landmark, posición esperada y radio de tolerancia.
    const targets = [
      { idx: 0, tx: 0.5, ty: 0.15, r: 0.075, label: 'CABEZA' },
      { idx: 15, tx: 0.34, ty: 0.58, r: 0.07, label: 'MANO' },
      { idx: 16, tx: 0.66, ty: 0.58, r: 0.07, label: 'MANO' },
      { idx: 27, tx: 0.44, ty: 0.88, r: 0.06, label: 'PIE' },
      { idx: 28, tx: 0.56, ty: 0.88, r: 0.06, label: 'PIE' },
    ];
    const status = targets.map((t) => {
      const lm = landmarks?.[t.idx];
      if (!lm || (lm.visibility ?? 0) < 0.4) return 'off';
      return Math.hypot(lm.x - t.tx, lm.y - t.ty) <= t.r ? 'in' : 'near';
    });
    const allIn = status.every((s) => s === 'in');
    const zoneColor = allIn ? '#3eff8a' : '#29e6ff';

    ctx.save();
    // Marco de la zona (discontinuo) + esquinas tipo viewfinder.
    ctx.strokeStyle = zoneColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.globalAlpha = allIn ? 0.9 : 0.55;
    ctx.strokeRect(zx0, zy0, zx1 - zx0, zy1 - zy0);
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 5;
    const c = Math.min(zx1 - zx0, zy1 - zy0) * 0.09;
    for (const [cx, cy, sx, sy] of [
      [zx0, zy0, 1, 1],
      [zx1, zy0, -1, 1],
      [zx0, zy1, 1, -1],
      [zx1, zy1, -1, -1],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(cx + c * sx, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + c * sy);
      ctx.stroke();
    }
    ctx.restore();

    // Silueta de referencia (pose neutra) dentro de la zona.
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.lineCap = 'round';
    const bone = (ax: number, ay: number, bx: number, by: number) => {
      ctx.beginPath();
      ctx.moveTo(X(ax), Y(ay));
      ctx.lineTo(X(bx), Y(by));
      ctx.stroke();
    };
    ctx.lineWidth = dw * 0.038;
    bone(0.5, 0.22, 0.5, 0.56); // torso
    ctx.lineWidth = dw * 0.03;
    bone(0.37, 0.3, 0.63, 0.3); // hombros
    bone(0.42, 0.56, 0.58, 0.56); // cadera
    ctx.lineWidth = dw * 0.022;
    bone(0.37, 0.3, 0.33, 0.44); // brazo der. (video)
    bone(0.33, 0.44, 0.34, 0.58);
    bone(0.63, 0.3, 0.67, 0.44); // brazo izq.
    bone(0.67, 0.44, 0.66, 0.58);
    bone(0.44, 0.56, 0.44, 0.72); // pierna der.
    bone(0.44, 0.72, 0.44, 0.9);
    bone(0.56, 0.56, 0.56, 0.72); // pierna izq.
    bone(0.56, 0.72, 0.56, 0.9);
    ctx.beginPath(); // cabeza
    ctx.ellipse(X(0.5), Y(0.13), dw * 0.05, dh * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Marcas de posición: círculo discontinuo que se rellena en verde al encajar.
    const labelSize = Math.max(12, dw * 0.022);
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const s = status[i];
      const px = X(t.tx);
      const py = Y(t.ty);
      const r = t.r * dw;
      const col = s === 'in' ? '#3eff8a' : s === 'near' ? '#ffd23e' : '#ff4e5e';
      ctx.save();
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      ctx.setLineDash(s === 'in' ? [] : [8, 6]);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (s === 'in') {
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 0.95;
        ctx.font = `700 ${r * 0.8}px "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', px, py);
      }
      ctx.textBaseline = 'alphabetic';
      ctx.font = `700 ${labelSize}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      // Las marcas de pie van cerca del borde inferior: su etiqueta va arriba.
      const labelY = t.ty > 0.8 ? py - r - 8 : py + r + labelSize + 4;
      ctx.fillText(t.label, px, labelY);
      ctx.restore();
    }

    // Mensaje de estado.
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.max(15, dw * 0.028)}px "Segoe UI", sans-serif`;
    ctx.fillStyle = allIn ? '#3eff8a' : '#e8e8f0';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(
      allIn ? 'POSICIÓN CORRECTA — quédate quieto' : 'Colócate dentro de la zona: lleva cada marca a verde',
      (zx0 + zx1) / 2,
      Math.max(zy0 - 8, labelSize + 6),
    );
    ctx.restore();
  }

  private drawSkeleton(landmarks: Landmark[]): void {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const { x: ox, y: oy, w: dw, h: dh } = this.drawRect;
    const px = (lm: Landmark) => W - (ox + lm.x * dw); // espejo
    const py = (lm: Landmark) => oy + lm.y * dh;

    ctx.save();
    ctx.lineWidth = this.drawRect.w < 400 ? 1.5 : 3;
    for (const [a, b] of BONES) {
      const la = landmarks[a];
      const lb = landmarks[b];
      if ((la.visibility ?? 0) < 0.3 || (lb.visibility ?? 0) < 0.3) continue;
      ctx.strokeStyle = 'rgba(41,230,255,0.8)';
      ctx.beginPath();
      ctx.moveTo(px(la), py(la));
      ctx.lineTo(px(lb), py(lb));
      ctx.stroke();
    }
    for (const lm of landmarks) {
      const v = lm.visibility ?? 0;
      if (v < 0.3) continue;
      ctx.fillStyle = v >= 0.7 ? '#3eff8a' : v >= 0.5 ? '#ffd23e' : '#ff4e5e';
      ctx.beginPath();
      ctx.arc(px(lm), py(lm), 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Punto de fuga donde aparecen las notas. */
  private vanishingPoint(): { x: number; y: number } {
    return { x: this.canvas.width / 2, y: this.canvas.height * 0.42 };
  }

  private drawNotes(game: GameView): void {
    const { ctx } = this;
    const vp = this.vanishingPoint();
    for (const note of game.notes) {
      if (note.state !== 'pending') continue;
      const until = note.time - game.songTime;
      if (until > game.travelMs || until < -300) continue;
      const p = 1 - Math.max(until, 0) / game.travelMs; // 0 lejos → 1 en el pad
      const e = p * p; // aceleración hacia la cámara
      ctx.save();
      ctx.globalAlpha = Math.min(1, p * 4) * (until < 0 ? 0.5 : 1);
      if (isObstacle(note.kind)) {
        const img = this.images.get(`obs-${note.kind}`);
        if (!img) {
          ctx.restore();
          continue;
        }
        if (note.kind === 'wall-left' || note.kind === 'wall-right') {
          // Pared translúcida que cubre medio túnel en su lado.
          const W = this.canvas.width;
          const w = W * 0.5 * (0.25 + 0.75 * e);
          const h = w * (img.height / img.width);
          const cx = note.kind === 'wall-left' ? W * 0.27 : W * 0.73;
          const y = vp.y + (this.padRect(0).y + this.padRect(0).h * 0.4 - vp.y) * e;
          ctx.globalAlpha *= 0.85;
          ctx.drawImage(img, cx - w / 2, y - h * 0.6, w, h);
        } else {
          // Valla: barrera baja/ancha centrada en la pista.
          const w = this.canvas.width * 0.42 * (0.25 + 0.9 * e);
          const h = w * (img.height / img.width);
          const y = vp.y + (this.padRect(0).y + this.padRect(0).h * 0.3 - vp.y) * e;
          ctx.drawImage(img, this.canvas.width / 2 - w / 2, y - h, w, h);
        }
      } else {
        const target = this.padCenter(note.lane);
        const pad = this.padRect(note.lane as number);
        const x = vp.x + (target.x - vp.x) * e;
        if (note.kind === 'hand') {
          // Puños: viajan elevados a ~pecho, no aterrizan en el pad.
          const y = vp.y + (pad.y - pad.h * 0.4 - vp.y) * e;
          const size = pad.h * (0.25 + 0.95 * e);
          const img = this.images.get(`note-${note.lane}`);
          if (img) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        } else {
          // Pies: placa acostada sobre la pista (achatada en y).
          const y = vp.y + (target.y - vp.y) * e;
          const size = pad.h * (0.3 + 1.1 * e);
          const img = this.images.get(`note-${note.lane}`);
          if (img) ctx.drawImage(img, x - size / 2, y - size * 0.32, size, size * 0.64);
        }
      }
      ctx.restore();
    }
  }

  /** Panel guía enmarcado con la silueta del próximo obstáculo, a la izquierda. */
  private drawGuide(game: GameView): void {
    const { ctx, canvas } = this;
    const next = game.notes.find(
      (n) => n.state === 'pending' && isObstacle(n.kind) && n.time - game.songTime < game.travelMs,
    );
    if (!next) return;
    const pose = this.images.get(`pose-${next.kind}`);
    const panel = this.images.get('guide-panel');
    const until = next.time - game.songTime;
    const pulse = until < 800 ? 0.75 + 0.25 * Math.sin(performance.now() / 80) : 0.55;
    const pw = canvas.width * 0.16;
    const px = canvas.width * 0.03;
    const py = canvas.height * 0.2;
    ctx.save();
    ctx.globalAlpha = Math.min(1, pulse);
    if (panel) {
      const ph = pw * (panel.height / panel.width);
      ctx.drawImage(panel, px, py, pw, ph);
      if (pose) {
        const ih = ph * 0.78;
        const iw = ih * (pose.width / pose.height);
        ctx.drawImage(pose, px + (pw - iw) / 2, py + ph * 0.14, iw, ih);
      }
    } else if (pose) {
      const ih = canvas.height * 0.22;
      ctx.drawImage(pose, px, py, ih * (pose.width / pose.height), ih);
    }
    ctx.restore();
  }

  private drawRating(game: GameView): void {
    if (!game.rating || performance.now() > game.ratingUntil) return;
    const img = this.images.get(`rating-${game.rating}`);
    if (!img) return;
    const w = this.canvas.width * 0.24;
    const h = w * (img.height / img.width);
    const { ctx, canvas } = this;
    ctx.save();
    // Sello inclinado como en la referencia, bajo el combo.
    ctx.translate(canvas.width * 0.72, canvas.height * 0.16);
    ctx.rotate(-0.14);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  private drawCombo(combo: number): void {
    const { ctx, canvas } = this;
    const label = this.images.get('combo-label');
    const h = canvas.height * 0.05;
    if (label) {
      const w = h * (label.width / label.height);
      ctx.drawImage(label, canvas.width - w - 24, 20, w, h);
    }
    const digits = String(combo);
    const dh = canvas.height * 0.09;
    let x = canvas.width - 24 - digits.length * dh * 0.62;
    for (const ch of digits) {
      const img = this.images.get(`digit-${ch}`);
      if (img) {
        const dw = dh * (img.width / img.height);
        ctx.drawImage(img, x, 20 + h + 6, dw, dh);
        x += dh * 0.62;
      }
    }
  }

  private drawPads(): void {
    const { ctx } = this;
    const now = performance.now();
    for (let i = 0; i < 4; i++) {
      const r = this.padRect(i);
      const active = (this.padFlash.get(i) ?? 0) > now;
      const img = active
        ? this.images.get(`pad-${PAD_COLORS[i]}`)
        : this.images.get('pad-idle');
      if (img) ctx.drawImage(img, r.x, r.y, r.w, r.h);
      if (active) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = PAD_HEX[PAD_COLORS[i]];
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.restore();
      }
    }
    // limpiar flashes expirados
    for (const [k, exp] of this.padFlash) if (exp <= now) this.padFlash.delete(k);
  }

  private drawRings(): void {
    const { ctx } = this;
    const now = performance.now();
    const LIFE = 450;
    this.rings = this.rings.filter((r) => now - r.start < LIFE);
    for (const r of this.rings) {
      const t = (now - r.start) / LIFE;
      const size = 60 + t * 200;
      const img = this.images.get(`ring-${r.color}`);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      if (img) ctx.drawImage(img, r.x - size / 2, r.y - size / 2, size, size);
      ctx.restore();
    }
  }

  /** Fragmentos de color que estallan y suben sobre el pad al acertar. */
  private drawFrags(): void {
    const { ctx } = this;
    const now = performance.now();
    const LIFE = 550;
    this.frags = this.frags.filter((f) => now - f.start < LIFE);
    for (const f of this.frags) {
      const t = (now - f.start) / LIFE;
      const size = 40 + t * 120;
      const img = this.images.get(`frags-${f.color}`);
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.9;
      if (img) ctx.drawImage(img, f.x - size / 2, f.y - size / 2 - t * 70, size, size);
      ctx.restore();
    }
  }

  private drawHudText(warnings: string[], overlay: string | null): void {
    const { ctx } = this;
    ctx.save();
    ctx.font = '600 15px "Segoe UI", sans-serif';
    let y = 28;
    for (const w of warnings) {
      ctx.fillStyle = '#ffd23e';
      ctx.fillText(`⚠ ${w}`, 18, y);
      y += 22;
    }
    if (overlay) {
      ctx.textAlign = 'center';
      ctx.font = '700 26px "Segoe UI", sans-serif';
      ctx.fillStyle = '#29e6ff';
      ctx.shadowColor = 'rgba(41,230,255,0.7)';
      ctx.shadowBlur = 18;
      ctx.fillText(overlay, this.canvas.width / 2, 60);
    }
    ctx.restore();
  }
}
