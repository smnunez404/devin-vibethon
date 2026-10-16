import { BONES, LM, type Landmark } from '../types';
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

interface Pt {
  x: number;
  y: number;
}

/** Marca que queda estampada en el pad al acertar una nota (como en la referencia). */
interface Stamp {
  lane: number;
  kind: Note['kind'];
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
  private stamps: Stamp[] = [];
  private padFlash = new Map<number, number>(); // pad -> timestamp de expiración
  private drawRect = { x: 0, y: 0, w: 0, h: 0 };
  /** Fondo del modo juego (loop MP4 con pista). Si está, la cámara va a PiP. */
  private bgVideo: HTMLVideoElement | null = null;
  /** Si existe, el mensaje de estado de la guía se publica aquí en vez de en canvas. */
  statusEl: HTMLElement | null = null;

  setBackground(bg: HTMLVideoElement | null): void {
    this.bgVideo = bg;
  }

  /** Geometría compartida para los dos cuadros verticales de la izquierda (guía arriba, cámara abajo). */
  private sideBoxMetrics(): { x: number; w: number; h: number; topY: number; bottomY: number } {
    const w = this.canvas.width * 0.14;
    const h = w * 1.75; // proporción vertical 320×560 del guide-panel
    const x = this.canvas.width * 0.03;
    const topY = this.canvas.height * 0.04;
    const gap = this.canvas.height * 0.025;
    return { x, w, h, topY, bottomY: topY + h + gap };
  }

  private pipRect(): { x: number; y: number; w: number; h: number } {
    const { x, w, h, bottomY } = this.sideBoxMetrics();
    return { x, y: bottomY, w, h };
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
    jobs.push(['pose-neutral', `${base}/guides/pose-neutral.png`]);
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

  /**
   * Deja la nota estampada un momento (~1.5 s) donde se resolvió para que se
   * vea qué se tocó: los pies sobre su pad, los puños a su altura de llegada.
   * Los obstáculos marcan los pads de su lado con un ✓.
   */
  stampHit(note: Note): void {
    const now = performance.now();
    const lanes = isObstacle(note.kind)
      ? note.kind === 'wall-left'
        ? [0, 1]
        : note.kind === 'wall-right'
          ? [2, 3]
          : [0, 1, 2, 3]
      : [note.lane];
    for (const lane of lanes) {
      this.stamps.push({ lane, kind: note.kind, color: PAD_COLORS[lane], start: now });
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

  /** Altura a la que llegan las notas de puño (cara/pecho), como en la referencia. */
  private handNoteY(): number {
    return this.canvas.height * 0.3;
  }

  /**
   * Trapecio de una placa sobre la pista: el borde frontal avanza a la
   * profundidad `e` (1 = sobre el pad) y el trasero queda recogido hacia el
   * punto de fuga. Como los bordes laterales convergen al vp, la placa se ve
   * inclinada en los carriles de los extremos, igual que en la referencia.
   */
  private floorTileQuad(
    pad: { x: number; y: number; w: number; h: number },
    e: number,
  ): { tl: Pt; tr: Pt; br: Pt; bl: Pt } {
    const vp = this.vanishingPoint();
    const LEN = 0.2; // profundidad de la placa sobre la pista
    const eB = Math.max(0.001, e - LEN);
    const X = (x: number, d: number) => vp.x + (x - vp.x) * d;
    const Y = (d: number) => vp.y + (pad.y + pad.h - vp.y) * d;
    return {
      tl: { x: X(pad.x, eB), y: Y(eB) },
      tr: { x: X(pad.x + pad.w, eB), y: Y(eB) },
      br: { x: X(pad.x + pad.w, e), y: Y(e) },
      bl: { x: X(pad.x, e), y: Y(e) },
    };
  }

  /**
   * Dibuja una imagen dentro de un cuadrilátero dividiéndolo en dos triángulos
   * y aplicando a cada uno el mapeo afín exacto de su triángulo de origen.
   * Sin costuras ni bandas (a diferencia del mapeo por tiras).
   */
  private drawImageQuad(
    img: HTMLImageElement,
    q: { tl: Pt; tr: Pt; br: Pt; bl: Pt },
  ): void {
    const { ctx } = this;
    const iw = img.width;
    const ih = img.height;
    const tris: Array<[Pt, Pt, Pt, Pt, Pt, Pt]> = [
      [q.tl, q.tr, q.br, { x: 0, y: 0 }, { x: iw, y: 0 }, { x: iw, y: ih }],
      [q.tl, q.br, q.bl, { x: 0, y: 0 }, { x: iw, y: ih }, { x: 0, y: ih }],
    ];
    for (const [d0, d1, d2, s0, s1, s2] of tris) {
      const denom = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
      if (!denom) continue;
      const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / denom;
      const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / denom;
      const e =
        (d0.x * (s1.x * s2.y - s2.x * s1.y) +
          d1.x * (s2.x * s0.y - s0.x * s2.y) +
          d2.x * (s0.x * s1.y - s1.x * s0.y)) /
        denom;
      const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / denom;
      const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / denom;
      const f =
        (d0.y * (s1.x * s2.y - s2.x * s1.y) +
          d1.y * (s2.x * s0.y - s0.x * s2.y) +
          d2.y * (s0.x * s1.y - s1.x * s0.y)) /
        denom;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(d0.x, d0.y);
      ctx.lineTo(d1.x, d1.y);
      ctx.lineTo(d2.x, d2.y);
      ctx.closePath();
      ctx.clip();
      ctx.setTransform(a, b, c, d, e, f);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }
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

    // Cámara a pantalla completa (fuera del juego): usa "contain" para no recortar el cuerpo.
    const camRect = this.bgVideo ? this.pipRect() : null;
    if (!camRect && video && video.videoWidth > 0) {
      const rect = { x: 0, y: 0, w: W, h: H };
      this.drawVideoCover(video, rect, true, 0.85, true);
      this.drawRect = this.fitRect(video, rect, true);
      this.drawPositionGuide(landmarks);
      if (landmarks) this.drawSkeleton(landmarks, null);
    } else if (this.statusEl?.textContent) {
      this.statusEl.textContent = '';
      this.statusEl.classList.remove('ok');
    }

    // Los pads van bajo las notas: la placa de pie aterriza sobre su cuadrado.
    this.drawPads();
    if (game) this.drawNotes(game);
    this.drawStamps();
    this.drawRings();
    this.drawFrags();

    // En juego: cámara en vertical (PiP) debajo del cuadro vertical de la silueta guía.
    if (camRect && video && video.videoWidth > 0) {
      this.drawVideoCover(video, camRect, true, 0.92, false);
      this.drawRect = this.fitRect(video, camRect, false);
      if (landmarks) this.drawSkeleton(landmarks, camRect);
      ctx.save();
      ctx.strokeStyle = 'rgba(232,232,240,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(camRect.x, camRect.y, camRect.w, camRect.h);
      ctx.restore();
    }

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

  /** Video dentro de un rect: "cover" (rellena recortando) o "contain" (encaja). Mirror opcional. */
  private drawVideoCover(
    video: HTMLVideoElement,
    rect: { x: number; y: number; w: number; h: number },
    mirror: boolean,
    alpha: number,
    contain = false,
  ): void {
    const { ctx } = this;
    const scale = contain
      ? Math.min(rect.w / video.videoWidth, rect.h / video.videoHeight)
      : Math.max(rect.w / video.videoWidth, rect.h / video.videoHeight);
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

  private fitRect(
    video: HTMLVideoElement,
    rect: { x: number; y: number; w: number; h: number },
    contain = false,
  ) {
    const scale = contain
      ? Math.min(rect.w / video.videoWidth, rect.h / video.videoHeight)
      : Math.max(rect.w / video.videoWidth, rect.h / video.videoHeight);
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
    const X = (nx: number) => ox + (1 - nx) * dw; // espejo dentro de drawRect
    const Y = (ny: number) => oy + ny * dh;

    // Zona donde debe permanecer la persona (coords normalizadas de video).
    const zone = { x0: 0.2, x1: 0.8, y0: 0.02, y1: 0.88 };
    const zx0 = X(zone.x1);
    const zx1 = X(zone.x0);
    const zy0 = Y(zone.y0);
    const zy1 = Y(zone.y1);

    // La silueta va escalada (~75%) con los pies ~en 0.84: figura compacta
    // y un poco más arriba para encajar el cuerpo sin pegarse al borde.
    const S = 0.75;
    const FOOT_Y = 0.66;
    const gx = (nx: number) => 0.5 + (nx - 0.5) * S;
    const gy = (ny: number) => FOOT_Y - (0.9 - ny) * S;

    // Marcas objetivo: landmark, posición esperada y radio de tolerancia.
    // Los índices son anatómicos: en coords de imagen el lado propio izquierdo
    // cae a x > 0.5 (en la vista espejo se ve a la izquierda de pantalla).
    const targets = [
      { idx: LM.nose, tx: 0.5, ty: gy(0.15), r: 0.065, label: 'CABEZA' },
      { idx: LM.leftWrist, tx: gx(0.66), ty: gy(0.58), r: 0.06, label: 'MANO IZQ' },
      { idx: LM.rightWrist, tx: gx(0.34), ty: gy(0.58), r: 0.06, label: 'MANO DER' },
      // Pies: van más abajo que el tobillo de la silueta (personas altas:
      // al encajar torso/brazos, el pie real cae más bajo).
      { idx: LM.leftAnkle, tx: gx(0.56), ty: gy(0.98), r: 0.075, label: 'PIE IZQ', above: true },
      { idx: LM.rightAnkle, tx: gx(0.44), ty: gy(0.98), r: 0.075, label: 'PIE DER', above: true },
    ];
    const status = targets.map((t) => {
      const lm = landmarks?.[t.idx];
      if (!lm || (lm.visibility ?? 0) < 0.4) return 'off';
      // Distancia en píxeles: el círculo dibujado es el área de tolerancia real.
      return Math.hypot((lm.x - t.tx) * dw, (lm.y - t.ty) * dh) <= t.r * dw ? 'in' : 'near';
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
      ctx.moveTo(X(gx(ax)), Y(gy(ay)));
      ctx.lineTo(X(gx(bx)), Y(gy(by)));
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
    bone(0.44, 0.72, 0.44, 1.0); // espinilla más larga
    bone(0.44, 1.0, 0.4, 1.0); // pie der. (hacia fuera)
    bone(0.56, 0.56, 0.56, 0.72); // pierna izq.
    bone(0.56, 0.72, 0.56, 1.0);
    bone(0.56, 1.0, 0.6, 1.0); // pie izq.
    ctx.beginPath(); // cabeza
    ctx.ellipse(X(0.5), Y(gy(0.13)), dw * 0.05 * S, dh * 0.07 * S, 0, 0, Math.PI * 2);
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
      // Las marcas de pie llevan la etiqueta arriba del círculo (zona baja/pads).
      const labelY = 'above' in t ? py - r - 8 : py + r + labelSize + 4;
      ctx.fillText(t.label, px, labelY);
      ctx.restore();
    }

    // Mensaje de estado: en la barra DOM si existe (no tapa los controles),
    // si no, dibujado en el canvas sobre la zona. Sin mensaje de instrucción.
    const msg = allIn ? 'POSICIÓN CORRECTA — quédate quieto' : '';
    if (this.statusEl) {
      if (this.statusEl.textContent !== msg) {
        this.statusEl.textContent = msg;
        this.statusEl.classList.toggle('ok', allIn);
      }
      return;
    }
    if (!msg) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.max(15, dw * 0.028)}px "Segoe UI", sans-serif`;
    ctx.fillStyle = allIn ? '#3eff8a' : '#e8e8f0';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(msg, (zx0 + zx1) / 2, Math.max(zy0 - 8, labelSize + 6));
    ctx.restore();
  }

  private drawSkeleton(
    landmarks: Landmark[],
    clipRect?: { x: number; y: number; w: number; h: number } | null,
  ): void {
    const { ctx } = this;
    const { x: ox, y: oy, w: dw, h: dh } = this.drawRect;
    const px = (lm: Landmark) => ox + (1 - lm.x) * dw; // espejo dentro de drawRect
    const py = (lm: Landmark) => oy + lm.y * dh;

    ctx.save();
    if (clipRect) {
      ctx.beginPath();
      ctx.rect(clipRect.x, clipRect.y, clipRect.w, clipRect.h);
      ctx.clip();
    }
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
        const pad = this.padRect(note.lane as number);
        if (note.kind === 'hand') {
          // Puños: llegan a altura de cara/pecho (~30% de la pantalla), como en la
          // referencia — no aterrizan en el pad, flotan altos al llegar.
          const target = this.padCenter(note.lane);
          const x = vp.x + (target.x - vp.x) * e;
          const y = vp.y + (this.handNoteY() - vp.y) * e;
          const size = pad.h * (0.3 + 1.4 * e);
          const img = this.images.get(`note-${note.lane}`);
          if (img) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        } else {
          // Pies: placa acostada sobre la pista, deformada en perspectiva hacia
          // el punto de fuga — en los carriles laterales se ve inclinada, como
          // en la referencia.
          const img = this.images.get(`note-${note.lane}`);
          if (img) this.drawImageQuad(img, this.floorTileQuad(pad, e));
        }
      }
      ctx.restore();
    }
  }

  /** Panel guía enmarcado con la silueta del próximo obstáculo, arriba a la izquierda (en vertical). */
  private drawGuide(game: GameView): void {
    const { ctx } = this;
    const next = game.notes.find(
      (n) => n.state === 'pending' && isObstacle(n.kind) && n.time - game.songTime < game.travelMs,
    );
    const { x: px, topY: py, w: pw, h: ph } = this.sideBoxMetrics();
    const panel = this.images.get('guide-panel');
    const pose = next ? this.images.get(`pose-${next.kind}`) : this.images.get('pose-neutral');
    const until = next ? next.time - game.songTime : Infinity;
    const pulse = next
      ? until < 800
        ? 0.75 + 0.25 * Math.sin(performance.now() / 80)
        : 0.65
      : 0.45;
    ctx.save();
    ctx.globalAlpha = Math.min(1, pulse);
    if (panel) {
      ctx.drawImage(panel, px, py, pw, ph);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);
    }
    if (pose) {
      const ih = ph * 0.78;
      const iw = ih * (pose.width / pose.height);
      ctx.drawImage(pose, px + (pw - iw) / 2, py + (ph - ih) / 2, iw, ih);
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

  /**
   * Cuadrados sutiles al final de cada carril: la línea de juicio donde las
   * piezas se resuelven (tocada o perdida). Apenas marcados en reposo; se
   * iluminan con el color del carril al contacto, como en la referencia.
   */
  private drawPads(): void {
    const { ctx } = this;
    const now = performance.now();
    const vp = this.vanishingPoint();
    for (let i = 0; i < 4; i++) {
      const r = this.padRect(i);
      const active = (this.padFlash.get(i) ?? 0) > now;
      const color = PAD_HEX[PAD_COLORS[i]];
      // Borde superior recogido hacia el punto de fuga: sigue la pista.
      const taper = 0.88;
      const tx0 = vp.x + (r.x - vp.x) * taper;
      const tx1 = vp.x + (r.x + r.w - vp.x) * taper;
      const ty = vp.y + (r.y - vp.y) * taper;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tx0, ty);
      ctx.lineTo(tx1, ty);
      ctx.lineTo(r.x + r.w, r.y + r.h);
      ctx.lineTo(r.x, r.y + r.h);
      ctx.closePath();
      if (active) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 26;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      } else {
        ctx.fillStyle = 'rgba(14,14,24,0.55)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(232,232,240,0.15)';
      }
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    // limpiar flashes expirados
    for (const [k, exp] of this.padFlash) if (exp <= now) this.padFlash.delete(k);
  }

  /** Sellos de acierto: la nota queda sobre el pad y se desvanece en ~1.5 s. */
  private drawStamps(): void {
    const { ctx } = this;
    const now = performance.now();
    const LIFE = 1500;
    this.stamps = this.stamps.filter((s) => now - s.start < LIFE);
    for (const s of this.stamps) {
      const t = (now - s.start) / LIFE;
      const r = this.padRect(s.lane);
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.85;
      if (isObstacle(s.kind)) {
        // ✓ del color del carril sobre los pads del lado esquivado
        ctx.fillStyle = PAD_HEX[s.color];
        ctx.font = `700 ${r.h * 0.9}px "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', r.x + r.w / 2, r.y + r.h / 2);
      } else {
        const img = this.images.get(`note-${s.lane}`);
        if (img) {
          if (s.kind === 'foot') {
            // placa en perspectiva sobre el pad, igual que la nota al llegar
            this.drawImageQuad(img, this.floorTileQuad(r, 1));
          } else {
            // El puño se estampa a la altura a la que llega la nota, no en el pad.
            const hs = r.h * 1.4;
            ctx.drawImage(img, r.x + r.w / 2 - hs / 2, this.handNoteY() - hs / 2, hs, hs);
          }
        } else {
          ctx.fillStyle = PAD_HEX[s.color];
          ctx.fillRect(r.x, r.y, r.w, r.h);
        }
      }
      ctx.restore();
    }
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
    let y = this.canvas.height / 2; // avisos a media altura, a la izquierda
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
      ctx.fillText(overlay, this.canvas.width / 2, 78);
    }
    ctx.restore();
  }
}
