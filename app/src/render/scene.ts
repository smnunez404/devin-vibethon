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
  /** Fondo del modo juego (loop MP4 con pista). Si está, se muestra el panel de silueta en vivo. */
  private bgVideo: HTMLVideoElement | null = null;
  /** Landmarks suavizados temporalmente para renderizar la silueta continua sin temblor. */
  private smoothLms: Array<{ x: number; y: number; visibility: number }> | null = null;
  /** Línea base del suelo (tobillos en reposo) y altura corporal para anclar la silueta a las teclas. */
  private silFloorY = 0;
  private silSpanY = 0;
  /** Lienzo auxiliar para componer la silueta negra con borde blanco continuo (2 pasadas sin costuras). */
  private silCanvas: HTMLCanvasElement | null = null;
  /** Si existe, el mensaje de estado de la guía se publica aquí en vez de en canvas. */
  statusEl: HTMLElement | null = null;

  setBackground(bg: HTMLVideoElement | null): void {
    this.bgVideo = bg;
  }

  /** Rectángulo del panel vertical izquierdo (idéntico al referente STAY ON BEAT #18). */
  private silhouettePanelRect(): { x: number; y: number; w: number; h: number } {
    const W = this.canvas.width;
    const H = this.canvas.height;
    return {
      x: Math.round(W * 0.043),
      y: Math.round(H * 0.245),
      w: Math.round(W * 0.145),
      h: Math.round(H * 0.495),
    };
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
    for (const r of ['perfect', 'great', 'nice', 'miss', 'awesome', 'unstoppable']) {
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

  /** Carril(es) que ocupa una nota: su lane, o los pads del lado del obstáculo. */
  private lanesOf(note: Note): number[] {
    if (!isObstacle(note.kind)) return [note.lane];
    if (note.kind === 'wall-left') return [0, 1];
    if (note.kind === 'wall-right') return [2, 3];
    return [0, 1, 2, 3];
  }

  /** Marca el acierto en la posición donde se resolvió la nota. */
  stampHit(note: Note): void {
    const now = performance.now();
    for (const lane of this.lanesOf(note)) {
      this.stamps.push({ lane, kind: note.kind, color: PAD_COLORS[lane], start: now });
      if (note.kind === 'hand') {
        const hp = this.handTargetCenter(lane);
        this.frags.push({ x: hp.x, y: hp.y, color: PAD_COLORS[lane], start: now });
      }
    }
  }

  /** Profundidad inicial en la boca lejana del túnel (nunca 0 para que las notas nazcan visibles desde el fondo). */
  private readonly tunnelMinD = 0.14;

  /**
   * Proyección en perspectiva exponencial continua:
   * - pRaw = 0 (boca del túnel) → d = tunnelMinD (0.14)
   * - pRaw = 1 (línea de pads)  → d = 1.0
   * - pRaw > 1 (tras el pad)    → d > 1.0 (sigue acelerando sin frenar jamás)
   * Como d(p - Δp) / d(p) = tunnelMinD^Δp es constante en todo el túnel,
   * la separación relativa entre dos objetos es invariante y el objeto de
   * atrás jamás puede alcanzar ni solapar al de adelante.
   */
  private depthAt(pRaw: number): number {
    return Math.pow(this.tunnelMinD, 1 - pRaw);
  }

  private padRect(i: number): { x: number; y: number; w: number; h: number } {
    const { width, height } = this.canvas;
    const padW = width * 0.132;
    const padH = height * 0.145;
    const gap = width * 0.014;
    const total = padW * 4 + gap * 3;
    const x = (width - total) / 2 + i * (padW + gap);
    const y = height - padH - height * 0.035;
    return { x, y, w: padW, h: padH };
  }

  private padCenter(i: number): { x: number; y: number } {
    const r = this.padRect(i);
    return { x: r.x + r.w / 2, y: r.y + r.h * 0.55 };
  }

  /**
   * Centro objetivo en el plano frontal (d = 1) donde llegan las notas de puño:
   * flotan arriba en el aire a altura de pecho/cara (`0.36 * H`, como en las
   * capturas de referencia `audit-t0187` y `t0369`), alineadas horizontalmente
   * con el centro exacto de su propio pad receptor (`r.x + r.w / 2`).
   */
  private handTargetCenter(lane: number): Pt {
    const r = this.padRect(lane);
    return {
      x: r.x + r.w / 2,
      y: this.canvas.height * 0.36,
    };
  }

  /** Proyecta un punto del plano frontal (d = 1) hacia el punto de fuga según profundidad d. */
  private projectPt(frontX: number, frontY: number, d: number): Pt {
    const vp = this.vanishingPoint();
    return {
      x: vp.x + (frontX - vp.x) * d,
      y: vp.y + (frontY - vp.y) * d,
    };
  }

  /**
   * Trapecio en perspectiva sobre el carril de un pad entre las profundidades
   * `dBack` y `dFront` (donde d = 1 corresponde al borde frontal del pad).
   */
  private laneSliceQuad(
    pad: { x: number; y: number; w: number; h: number },
    dBack: number,
    dFront: number,
  ): { tl: Pt; tr: Pt; br: Pt; bl: Pt } {
    const frontY = pad.y + pad.h;
    return {
      tl: this.projectPt(pad.x, frontY, dBack),
      tr: this.projectPt(pad.x + pad.w, frontY, dBack),
      br: this.projectPt(pad.x + pad.w, frontY, dFront),
      bl: this.projectPt(pad.x, frontY, dFront),
    };
  }

  private floorTileQuad(
    pad: { x: number; y: number; w: number; h: number },
    pRaw: number,
  ): { tl: Pt; tr: Pt; br: Pt; bl: Pt } {
    const dFront = this.depthAt(pRaw);
    const dBack = this.depthAt(pRaw - 0.09);
    return this.laneSliceQuad(pad, dBack, dFront);
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

    // Fondo del modo juego: loop MP4.
    const inGameScene = Boolean(this.bgVideo && this.bgVideo.readyState >= 2);
    if (inGameScene && this.bgVideo) {
      this.drawVideoCover(this.bgVideo, { x: 0, y: 0, w: W, h: H }, false, 1);
    }

    // Cámara a pantalla completa (fuera del juego): usa "contain" para no recortar el cuerpo.
    if (!this.bgVideo && video && video.videoWidth > 0) {
      const rect = { x: 0, y: 0, w: W, h: H };
      this.drawVideoCover(video, rect, true, 0.85, true);
      this.drawRect = this.fitRect(video, rect, true);
      this.drawPositionGuide(landmarks);
      if (landmarks) this.drawSkeleton(landmarks, null);
    } else if (this.statusEl?.textContent) {
      this.statusEl.textContent = '';
      this.statusEl.classList.remove('ok');
    }

    // Actualizar destellos de contacto antes de dibujar los pads para que se
    // enciendan en el mismo fotograma en que la pieza toca la línea inferior.
    if (game) {
      const now = performance.now();
      for (const note of game.notes) {
        if (note.state !== 'pending') continue;
        const until = note.time - game.songTime;
        if (until <= 35 && until >= -240) {
          for (const lane of this.lanesOf(note)) {
            const prev = this.padFlash.get(lane) ?? 0;
            this.padFlash.set(lane, Math.max(prev, now + 110));
          }
        }
      }
    }

    // Pista en perspectiva alineada con los 4 pads 3D en primer plano.
    if (this.bgVideo || game) {
      this.drawRunwayOverlay();
    }
    this.drawPads();
    if (game) this.drawNotes(game);
    this.drawStamps();
    this.drawRings();
    this.drawFrags();

    // En modo juego: un único panel vertical a la izquierda con la silueta en
    // tiempo real de la persona (filtro oscuro + borde blanco continuo), tal
    // como en STAY ON BEAT #18.
    if (this.bgVideo || game) {
      this.drawLiveSilhouettePanel(video, landmarks, game);
    }

    if (game) {
      this.drawCombo(game.combo);
      this.drawRating(game);
      this.drawProgress(game);
    }
    this.drawHudText(warnings, overlayText);
  }

  /**
   * Barra de progreso arcoíris a todo el ancho en el borde inferior de la
   * pantalla, idéntica al referente STAY ON BEAT #18.
   */
  private drawProgress(game: GameView): void {
    if (!game.durationMs) return;
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const barH = Math.max(6, Math.round(H * 0.009));
    const y = H - barH;
    const p = Math.min(Math.max(game.songTime / game.durationMs, 0), 1);

    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 22, 0.78)';
    ctx.fillRect(0, y, W, barH);
    if (p > 0) {
      const grad = ctx.createLinearGradient(0, y, W, y);
      grad.addColorStop(0, '#ff3ec8');
      grad.addColorStop(0.28, '#ffd23e');
      grad.addColorStop(0.55, '#3eff8a');
      grad.addColorStop(0.8, '#29e6ff');
      grad.addColorStop(1, '#a05dff');
      ctx.shadowColor = '#29e6ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, W * p, barH);
    }
    ctx.restore();
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
    return { x: this.canvas.width / 2, y: this.canvas.height * 0.43 };
  }

  /** Bordes exteriores de la pista negra a la altura frontal de los pads (d = 1). */
  private trackEdgesAtPads(): { leftX: number; rightX: number; frontY: number } {
    const p0 = this.padRect(0);
    const p3 = this.padRect(3);
    const margin = this.canvas.width * 0.012;
    return {
      leftX: p0.x - margin,
      rightX: p3.x + p3.w + margin,
      frontY: p0.y + p0.h,
    };
  }

  /**
   * Pista negra trapezoidal con bordes de neón cian (izquierda) y magenta
   * (derecha) que abrazan exactamente los 4 pads frontales, como en el video
   * de referencia STAY ON BEAT #18.
   */
  private drawRunwayOverlay(): void {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const vp = this.vanishingPoint();
    const { leftX, rightX, frontY } = this.trackEdgesAtPads();
    const dBottom = (H - vp.y) / Math.max(1, frontY - vp.y);
    const bLeft = vp.x + (leftX - vp.x) * dBottom;
    const bRight = vp.x + (rightX - vp.x) * dBottom;
    const dTop = 0.08;
    const topLeft = this.projectPt(leftX, frontY, dTop);
    const topRight = this.projectPt(rightX, frontY, dTop);

    ctx.save();
    // Oscurecer suavemente las líneas antiguas demasiado abiertas del MP4 fuera de nuestra pista.
    const floorGradL = ctx.createLinearGradient(0, vp.y, bLeft, H);
    floorGradL.addColorStop(0, 'rgba(5, 7, 16, 0.25)');
    floorGradL.addColorStop(1, 'rgba(5, 7, 16, 0.92)');
    ctx.fillStyle = floorGradL;
    ctx.beginPath();
    ctx.moveTo(0, topLeft.y);
    ctx.lineTo(topLeft.x, topLeft.y);
    ctx.lineTo(bLeft, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    const floorGradR = ctx.createLinearGradient(W, vp.y, bRight, H);
    floorGradR.addColorStop(0, 'rgba(5, 7, 16, 0.25)');
    floorGradR.addColorStop(1, 'rgba(5, 7, 16, 0.92)');
    ctx.fillStyle = floorGradR;
    ctx.beginPath();
    ctx.moveTo(topRight.x, topRight.y);
    ctx.lineTo(W, topRight.y);
    ctx.lineTo(W, H);
    ctx.lineTo(bRight, H);
    ctx.closePath();
    ctx.fill();

    // Superficie negra brillante de la pista central.
    const trackGrad = ctx.createLinearGradient(0, topLeft.y, 0, H);
    trackGrad.addColorStop(0, '#050812');
    trackGrad.addColorStop(0.6, '#030409');
    trackGrad.addColorStop(1, '#060811');
    ctx.fillStyle = trackGrad;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bRight, H);
    ctx.lineTo(bLeft, H);
    ctx.closePath();
    ctx.fill();

    // Guías longitudinales entre los 4 carriles desde el fondo hasta los pads.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const rA = this.padRect(i);
      const rB = this.padRect(i + 1);
      const midX = (rA.x + rA.w + rB.x) / 2;
      const pStart = this.projectPt(midX, frontY, dTop);
      const pEnd = this.projectPt(midX, frontY, dBottom);
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }

    // Riel izquierdo cian neón + núcleo blanco.
    ctx.shadowColor = '#29e6ff';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#29e6ff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(bLeft, H);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#d8fbff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Riel derecho magenta neón + núcleo blanco.
    ctx.shadowColor = '#ff3ec8';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#ff3ec8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(topRight.x, topRight.y);
    ctx.lineTo(bRight, H);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffdbf5';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Dibuja un prisma 3D en perspectiva proyectado desde el punto de fuga `vp`
   * entre las profundidades `dBack` y `dFront`. Usado para las paredes de
   * esquiva ("wall-left" / "wall-right") y las vallas ("duck" / "jump"),
   * replicando las losas translúcidas con flechas del video de referencia.
   */
  private drawObstaclePrism(
    kind: Note['kind'],
    pRaw: number,
    alpha: number,
  ): void {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const { leftX, rightX, frontY } = this.trackEdgesAtPads();
    const isWall = kind === 'wall-left' || kind === 'wall-right';

    // En el referente:
    // - Si debes esquivar a la IZQUIERDA (wall-left, flechas < <), la pared
    //   bloquea la mitad DERECHA de la pista (carriles 2 y 3) y deja libres 0 y 1.
    // - Si debes esquivar a la DERECHA (wall-right, flechas > >), la pared
    //   bloquea la mitad IZQUIERDA de la pista (carriles 0 y 1) y deja libres 2 y 3.
    let x0: number;
    let x1: number;
    let y0: number;
    let y1: number;
    let thicknessP: number;
    let rgbFill: string;
    let hexEdge: string;

    if (isWall) {
      const blocksLeftHalf = kind === 'wall-right';
      x0 = blocksLeftHalf ? leftX : W * 0.5;
      x1 = blocksLeftHalf ? W * 0.5 : rightX;
      y0 = -H * 0.06;
      y1 = frontY;
      thicknessP = 0.14;
      rgbFill = '235, 145, 38';
      hexEdge = '#fff5e4';
    } else if (kind === 'duck') {
      x0 = leftX - W * 0.03;
      x1 = rightX + W * 0.03;
      y0 = H * 0.04;
      y1 = H * 0.34;
      thicknessP = 0.085;
      rgbFill = '245, 175, 42';
      hexEdge = '#fff8eb';
    } else {
      // jump: valla baja transversal sobre la pista
      x0 = leftX - W * 0.02;
      x1 = rightX + W * 0.02;
      y0 = H * 0.71;
      y1 = frontY;
      thicknessP = 0.08;
      rgbFill = '41, 230, 255';
      hexEdge = '#e8fcff';
    }

    const dFront = this.depthAt(pRaw);
    const dBack = this.depthAt(pRaw - thicknessP);

    const F = [
      this.projectPt(x0, y0, dFront), // 0: top-left
      this.projectPt(x1, y0, dFront), // 1: top-right
      this.projectPt(x1, y1, dFront), // 2: bottom-right
      this.projectPt(x0, y1, dFront), // 3: bottom-left
    ];
    const B = [
      this.projectPt(x0, y0, dBack),
      this.projectPt(x1, y0, dBack),
      this.projectPt(x1, y1, dBack),
      this.projectPt(x0, y1, dBack),
    ];

    const poly = (pts: Pt[], fill: string, stroke?: string, lw = 2) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
    };

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Cara trasera con aspa diagonal (X) como en el referente.
    poly(B, `rgba(${rgbFill}, 0.16)`, `rgba(255,255,255,0.65)`, 1.6);
    ctx.strokeStyle = `rgba(255,255,255,0.35)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(B[0].x, B[0].y);
    ctx.lineTo(B[2].x, B[2].y);
    ctx.moveTo(B[1].x, B[1].y);
    ctx.lineTo(B[3].x, B[3].y);
    ctx.stroke();

    // 2. Caras laterales, superior e inferior del volumen 3D.
    poly([F[3], F[2], B[2], B[3]], `rgba(${rgbFill}, 0.28)`); // base sobre el suelo
    poly([F[0], F[1], B[1], B[0]], `rgba(${rgbFill}, 0.18)`); // techo
    poly([F[0], B[0], B[3], F[3]], `rgba(${rgbFill}, 0.24)`); // pared izquierda
    poly([F[1], B[1], B[2], F[2]], `rgba(${rgbFill}, 0.24)`); // pared derecha

    // Refuerzos diagonales en las caras laterales (visibles en el referente).
    ctx.strokeStyle = `rgba(255,255,255,0.38)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(F[0].x, F[0].y);
    ctx.lineTo(B[3].x, B[3].y);
    ctx.moveTo(F[1].x, F[1].y);
    ctx.lineTo(B[2].x, B[2].y);
    ctx.stroke();

    // 3. Aristas longitudinales brillantes hacia el punto de fuga.
    ctx.shadowColor = `rgb(${rgbFill})`;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = hexEdge;
    ctx.lineWidth = Math.max(2, 3.8 * dFront);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(F[i].x, F[i].y);
      ctx.lineTo(B[i].x, B[i].y);
      ctx.stroke();
    }

    // 4. Cara frontal translúcida con marco luminoso y cheurones direccionales.
    poly(F, `rgba(${rgbFill}, 0.20)`, hexEdge, Math.max(2.2, 4.0 * dFront));
    ctx.shadowBlur = 0;

    if (isWall) {
      // Dos cheurones verticales (< < o > >) en la tapa indicando hacia qué lado esquivar.
      const dir = kind === 'wall-left' ? -1 : 1; // -1 = apunta a la izquierda (<)
      const cap = dFront > 0.95 ? B : F;
      const cw = cap[1].x - cap[0].x;
      const ch = cap[3].y - cap[0].y;
      const cx = (cap[0].x + cap[1].x) / 2;
      ctx.strokeStyle = '#ffd86b';
      ctx.shadowColor = '#ffae29';
      ctx.shadowBlur = 10;
      ctx.lineWidth = Math.max(2.2, cw * 0.045);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const vy of [0.34, 0.66]) {
        const cy = cap[0].y + ch * vy;
        const dx = cw * 0.14 * dir;
        const dy = ch * 0.11;
        ctx.beginPath();
        ctx.moveTo(cx - dx, cy - dy);
        ctx.lineTo(cx + dx, cy);
        ctx.lineTo(cx - dx, cy + dy);
        ctx.stroke();
      }
    } else {
      // Tres cheurones amarillos/cian a lo ancho de la valla (∨ ∨ ∨ para duck, ∧ ∧ ∧ para jump).
      const fw = F[1].x - F[0].x;
      const fh = F[3].y - F[0].y;
      const down = kind === 'duck';
      ctx.strokeStyle = down ? '#ffd23e' : '#29e6ff';
      ctx.shadowColor = down ? '#ff9f1c' : '#29e6ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = Math.max(2.5, fh * 0.11);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const fx of [0.22, 0.5, 0.78]) {
        const cx = F[0].x + fw * fx;
        const yTopChev = F[0].y + fh * 0.24;
        const yBotChev = F[0].y + fh * 0.76;
        const spanX = fw * 0.075;
        ctx.beginPath();
        if (down) {
          ctx.moveTo(cx - spanX, yTopChev);
          ctx.lineTo(cx, yBotChev);
          ctx.lineTo(cx + spanX, yTopChev);
        } else {
          ctx.moveTo(cx - spanX, yBotChev);
          ctx.lineTo(cx, yTopChev);
          ctx.lineTo(cx + spanX, yBotChev);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Dibuja una placa de pie en perspectiva sobre el suelo de su carril:
   * baldosa de neón sólido con bisel frontal 3D y silueta negra de huella
   * (talón + planta + dedos), idéntica al referente (t0221 / t0295).
   */
  private drawFootTile(lane: number, pRaw: number, alpha: number): void {
    const { ctx } = this;
    const pad = this.padRect(lane);
    const colorName = PAD_COLORS[lane];
    const hex = PAD_HEX[colorName];
    const dFront = this.depthAt(pRaw);
    const q = this.floorTileQuad(pad, pRaw);
    const lipH = Math.max(2, this.canvas.height * 0.011 * dFront);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Bisel frontal 3D de la baldosa.
    ctx.fillStyle = 'rgba(10, 12, 20, 0.85)';
    ctx.beginPath();
    ctx.moveTo(q.bl.x, q.bl.y);
    ctx.lineTo(q.br.x, q.br.y);
    ctx.lineTo(q.br.x, q.br.y + lipH);
    ctx.lineTo(q.bl.x, q.bl.y + lipH);
    ctx.closePath();
    ctx.fill();

    // Cara superior sólida de neón brillante.
    ctx.shadowColor = hex;
    ctx.shadowBlur = 16 * dFront;
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.moveTo(q.tl.x, q.tl.y);
    ctx.lineTo(q.tr.x, q.tr.y);
    ctx.lineTo(q.br.x, q.br.y);
    ctx.lineTo(q.bl.x, q.bl.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Borde interno claro.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1, 2 * dFront);
    ctx.stroke();

    // Silueta negra nítida de huella en el centro del trapecio.
    const mapUV = (u: number, v: number): Pt => {
      const topX = q.tl.x + (q.tr.x - q.tl.x) * u;
      const topY = q.tl.y + (q.tr.y - q.tl.y) * u;
      const botX = q.bl.x + (q.br.x - q.bl.x) * u;
      const botY = q.bl.y + (q.br.y - q.bl.y) * u;
      return {
        x: topX + (botX - topX) * v,
        y: topY + (botY - topY) * v,
      };
    };
    const isLeftFoot = lane <= 1;
    const uSign = isLeftFoot ? 1 : -1;
    const cSole = mapUV(0.5 - 0.02 * uSign, 0.44);
    const cHeel = mapUV(0.5 + 0.02 * uSign, 0.74);
    const wTile = Math.hypot(q.br.x - q.bl.x, q.br.y - q.bl.y);
    const hTile = Math.max(3, Math.abs(q.bl.y - q.tl.y));

    ctx.fillStyle = '#07080e';
    // Planta delantera
    ctx.beginPath();
    ctx.ellipse(cSole.x, cSole.y, wTile * 0.14, hTile * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Talón
    ctx.beginPath();
    ctx.ellipse(cHeel.x, cHeel.y, wTile * 0.105, hTile * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    // 5 dedos del pie
    const toes = [-0.12, -0.055, 0.005, 0.06, 0.11];
    for (let tIdx = 0; tIdx < toes.length; tIdx++) {
      const uToe = 0.5 + toes[tIdx] * uSign;
      const vToe = 0.19 + Math.abs(tIdx - 1.5) * 0.025;
      const pToe = mapUV(uToe, vToe);
      const rFactor = tIdx === 0 ? 1.25 : 1 - tIdx * 0.11;
      ctx.beginPath();
      ctx.ellipse(
        pToe.x,
        pToe.y,
        Math.max(1, wTile * 0.032 * rFactor),
        Math.max(1, hTile * 0.055 * rFactor),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Dibuja un bloque de puño 3D flotando en la parte superior del túnel con
   * cola extruida hacia el punto de fuga y cara frontal de neón sólido con el
   * icono de puño negro en alto contraste (idéntico a `audit-t0187` / `t0369`).
   * Está alineado verticalmente con el centro exacto de su pad receptor.
   */
  private drawHandBlock(lane: number, pRaw: number, alpha: number): void {
    const { ctx } = this;
    const pad = this.padRect(lane);
    const colorName = PAD_COLORS[lane];
    const hex = PAD_HEX[colorName];
    const target = this.handTargetCenter(lane);
    const fullSize = pad.w * 0.82;

    const dFront = this.depthAt(pRaw);
    const dBack = this.depthAt(pRaw - 0.11);
    const sFront = fullSize * dFront;
    const sBack = fullSize * dBack;

    // El bloque flota arriba en el aire en (target.x, target.y) proyectado desde el punto de fuga.
    const cFront = this.projectPt(target.x, target.y, dFront);
    const cBack = this.projectPt(target.x, target.y, dBack);

    const fRect = { x: cFront.x - sFront / 2, y: cFront.y - sFront / 2, w: sFront, h: sFront };
    const bRect = { x: cBack.x - sBack / 2, y: cBack.y - sBack / 2, w: sBack, h: sBack };

    const F: Pt[] = [
      { x: fRect.x, y: fRect.y },
      { x: fRect.x + fRect.w, y: fRect.y },
      { x: fRect.x + fRect.w, y: fRect.y + fRect.h },
      { x: fRect.x, y: fRect.y + fRect.h },
    ];
    const B: Pt[] = [
      { x: bRect.x, y: bRect.y },
      { x: bRect.x + bRect.w, y: bRect.y },
      { x: bRect.x + bRect.w, y: bRect.y + bRect.h },
      { x: bRect.x, y: bRect.y + bRect.h },
    ];

    ctx.save();
    ctx.globalAlpha = alpha;

    // Cola 3D extruida hacia el punto de fuga.
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      ctx.fillStyle = hex;
      ctx.globalAlpha = alpha * (i === 0 ? 0.52 : i === 2 ? 0.35 : 0.44);
      ctx.beginPath();
      ctx.moveTo(F[i].x, F[i].y);
      ctx.lineTo(F[j].x, F[j].y);
      ctx.lineTo(B[j].x, B[j].y);
      ctx.lineTo(B[i].x, B[i].y);
      ctx.closePath();
      ctx.fill();
    }

    // Cara frontal redondeada de neón brillante.
    ctx.globalAlpha = alpha;
    ctx.shadowColor = hex;
    ctx.shadowBlur = 18 * dFront;
    ctx.fillStyle = hex;
    const rad = Math.max(4, sFront * 0.15);
    ctx.beginPath();
    ctx.roundRect(fRect.x, fRect.y, fRect.w, fRect.h, rad);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(1.5, 2.5 * dFront);
    ctx.stroke();

    // Icono de puño frontal con nudillos y pulgar en trazos oscuros nítidos (como en audit-t0187).
    const isLeftHand = lane <= 1;
    const flip = isLeftHand ? 1 : -1;
    ctx.save();
    ctx.translate(cFront.x, cFront.y);
    ctx.scale(flip, 1);
    const u = sFront * 0.32;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.strokeStyle = '#090a10';
    ctx.lineWidth = Math.max(1.6, sFront * 0.042);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Contorno exterior del puño cerrado
    ctx.beginPath();
    ctx.roundRect(-u * 0.95, -u * 0.68, u * 1.9, u * 1.25, u * 0.32);
    ctx.fill();
    ctx.stroke();

    // 4 dedos plegados verticales (nudillos frontales)
    for (const kx of [-0.46, -0.15, 0.16, 0.47]) {
      ctx.beginPath();
      ctx.moveTo(u * kx, -u * 0.62);
      ctx.lineTo(u * kx, u * 0.22);
      ctx.stroke();
    }

    // Pulgar cruzado debajo de los dedos
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.roundRect(-u * 0.25, u * 0.18, u * 1.15, u * 0.44, u * 0.2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  private drawNotes(game: GameView): void {
    // Pintar de más lejana a más cercana (painter's algorithm) para que los
    // volúmenes 3D se superpongan con profundidad real.
    const visible = game.notes
      .filter((n) => {
        if (n.state !== 'pending') return false;
        const until = n.time - game.songTime;
        return until <= game.travelMs && until >= -160;
      })
      .sort((a, b) => b.time - a.time);

    for (const note of visible) {
      const until = note.time - game.songTime;
      const pRaw = 1 - until / game.travelMs; // 0 en la boca del túnel → 1 en el pad → >1 al cruzar
      const p = Math.max(0, Math.min(1, pRaw));
      const fadeIn = Math.min(1, 0.55 + p * 8.0);
      const fadeOut = until < 0 ? Math.max(0, 1 + until / 160) * 0.65 : 1;
      const alpha = fadeIn * fadeOut;

      if (isObstacle(note.kind)) {
        this.drawObstaclePrism(note.kind, pRaw, alpha);
      } else if (note.kind === 'hand') {
        this.drawHandBlock(note.lane as number, pRaw, alpha);
      } else {
        this.drawFootTile(note.lane as number, pRaw, alpha);
      }
    }
  }

  /**
   * Único panel vertical a la izquierda (como en STAY ON BEAT #18):
   * muestra el movimiento en tiempo real de la persona captado por la cámara,
   * con filtro oscuro, la silueta humana negra bordeada en blanco continuo y
   * una mini-pista inferior dividida en los 4 carriles con sus 4 teclas/pads
   * que se iluminan coordinadamente con las notas entrantes y con la pose real.
   */
  private drawLiveSilhouettePanel(
    video: HTMLVideoElement | null,
    landmarks: Landmark[] | null,
    game?: GameView,
  ): void {
    const { ctx } = this;
    const rect = this.silhouettePanelRect();
    const { x: px, y: py, w: pw, h: ph } = rect;
    const now = performance.now();

    // 1. Suavizado exponencial de los landmarks para que la silueta se mueva fluida.
    if (landmarks && landmarks.length >= 33) {
      if (!this.smoothLms) {
        this.smoothLms = landmarks.map((l) => ({
          x: l.x,
          y: l.y,
          visibility: l.visibility ?? 0,
        }));
      } else {
        const k = 0.52;
        for (let i = 0; i < 33; i++) {
          const src = landmarks[i];
          const dst = this.smoothLms[i];
          if ((src.visibility ?? 0) >= 0.2) {
            dst.x = dst.x * (1 - k) + src.x * k;
            dst.y = dst.y * (1 - k) + src.y * k;
            dst.visibility = src.visibility ?? 0;
          }
        }
      }
    }

    // Próxima nota pendiente cercana (mano, pie u obstáculo) para iluminar su carril/tecla guía.
    const nextNote = game?.notes.find((n) => {
      if (n.state !== 'pending') return false;
      const until = n.time - game.songTime;
      return until <= 1900 && until >= -120;
    });
    const nextObs = game?.notes.find(
      (n) => n.state === 'pending' && isObstacle(n.kind) && n.time - game.songTime < game.travelMs,
    );
    const activeTargetNote = nextNote ?? nextObs;
    const targetLanes = activeTargetNote ? new Set(this.lanesOf(activeTargetNote)) : new Set<number>();
    const noteUntil = activeTargetNote && game ? activeTargetNote.time - game.songTime : Infinity;
    const urgency = activeTargetNote ? Math.min(1, Math.max(0.25, 1 - Math.max(0, noteUntil) / 1900)) : 0;
    const pulse = 0.72 + 0.28 * Math.sin(now / 75);

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();

    // 2. Fondo oscuro con degradado vertical idéntico al panel del referente.
    const bgGrad = ctx.createLinearGradient(px, py, px, py + ph);
    bgGrad.addColorStop(0, '#2a2a31');
    bgGrad.addColorStop(0.55, '#0d0d12');
    bgGrad.addColorStop(1, '#020205');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(px, py, pw, ph);

    // 3. Filtro oscuro de cámara de fondo (para percibir el feed real atenuado).
    if (video && video.videoWidth > 0) {
      this.drawVideoCover(video, rect, true, 0.14, false);
    }

    // Geometría de los 4 carriles y las 4 teclas inferiores dentro del panel.
    const padMarginX = Math.round(pw * 0.045);
    const innerW = pw - padMarginX * 2;
    const laneGap = Math.max(2, Math.round(pw * 0.018));
    const laneW = (innerW - laneGap * 3) / 4;
    const padY = py + Math.round(ph * 0.825);
    const padH = Math.round(ph * 0.082);
    const laneX = (i: number) => px + padMarginX + i * (laneW + laneGap);

    // 4. División en 4 carriles verticales + iluminación anticipada de hacia dónde moverse.
    for (let i = 0; i < 4; i++) {
      const lx = laneX(i);
      const color = PAD_HEX[PAD_COLORS[i]];
      const isTarget = targetLanes.has(i);
      const isFlashing = (this.padFlash.get(i) ?? 0) > now;

      // En muros de esquiva, sombrear en rojo/ámbar los carriles bloqueados.
      const isBlockedByWall =
        (activeTargetNote?.kind === 'wall-left' && (i === 2 || i === 3)) ||
        (activeTargetNote?.kind === 'wall-right' && (i === 0 || i === 1));

      if (isBlockedByWall) {
        const blockGrad = ctx.createLinearGradient(0, py + ph * 0.12, 0, padY + padH);
        blockGrad.addColorStop(0, 'rgba(255, 90, 38, 0.06)');
        blockGrad.addColorStop(1, `rgba(255, 90, 38, ${0.24 * urgency})`);
        ctx.fillStyle = blockGrad;
        ctx.fillRect(lx, py + ph * 0.12, laneW, padY + padH - (py + ph * 0.12));
      } else if (isTarget || isFlashing) {
        const glowAlpha = isFlashing ? 0.36 : 0.24 * urgency * pulse;
        const colGrad = ctx.createLinearGradient(0, py + ph * 0.16, 0, padY);
        colGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        colGrad.addColorStop(0.55, color + '22');
        colGrad.addColorStop(1, color);
        ctx.save();
        ctx.globalAlpha = glowAlpha;
        ctx.fillStyle = colGrad;
        ctx.fillRect(lx, py + ph * 0.16, laneW, padY - (py + ph * 0.16));
        ctx.restore();
      }

      // Líneas divisorias verticales entre los 4 carriles.
      if (i > 0) {
        const divX = lx - laneGap / 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(divX, py + ph * 0.15);
        ctx.lineTo(divX, padY + padH);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 5. Si se aproxima un obstáculo, dibujar tenue silueta guía de referencia detrás.
    if (nextObs) {
      const poseImg = this.images.get(`pose-${nextObs.kind}`);
      if (poseImg) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        const ih = ph * 0.72;
        const iw = ih * (poseImg.width / poseImg.height);
        ctx.drawImage(poseImg, px + (pw - iw) / 2, py + ph * 0.08, iw, ih);
        ctx.restore();
      }
    }

    // 6. Silueta humana en tiempo real anclada sobre las 4 teclas inferiores:
    // relleno negro + contorno exterior blanco continuo en 2 pasadas.
    if (!this.silCanvas || this.silCanvas.width !== pw || this.silCanvas.height !== ph) {
      this.silCanvas = document.createElement('canvas');
      this.silCanvas.width = Math.max(1, pw);
      this.silCanvas.height = Math.max(1, ph);
    }
    const sctx = this.silCanvas.getContext('2d');
    let bodyPts: Record<number, Pt> | null = null;
    if (sctx) {
      sctx.clearRect(0, 0, pw, ph);
      bodyPts = this.renderBodySilhouetteTwoPass(sctx, pw, ph, this.smoothLms);
      ctx.drawImage(this.silCanvas, px, py);
    }

    // Determinar en qué carril(es) están apoyados actualmente los pies/manos de la silueta en vivo.
    const liveFootLane = new Set<number>();
    if (bodyPts) {
      for (const anklePt of [bodyPts[LM.leftAnkle], bodyPts[LM.rightAnkle]]) {
        const relX = anklePt.x - padMarginX;
        const idx = Math.floor(relX / (laneW + laneGap));
        if (idx >= 0 && idx < 4) liveFootLane.add(idx);
      }
    }

    // 7. Dibujar las 4 teclas/pads inferiores (a los pies de la silueta) con bisel 3D
    // e indicadores luminosos coordinados con la nota entrante y la posición del jugador.
    const bevel = Math.max(3, Math.round(ph * 0.014));
    for (let i = 0; i < 4; i++) {
      const lx = laneX(i);
      const color = PAD_HEX[PAD_COLORS[i]];
      const isTarget = targetLanes.has(i);
      const isFlashing = (this.padFlash.get(i) ?? 0) > now;
      const hasFoot = liveFootLane.has(i);
      const lit = isTarget || isFlashing;

      ctx.save();
      // Bisel frontal 3D de la tecla.
      ctx.fillStyle = lit ? color : '#12131b';
      ctx.globalAlpha = lit ? 0.65 : 0.92;
      ctx.fillRect(lx, padY + padH - bevel, laneW, bevel);

      // Superficie de la tecla.
      ctx.globalAlpha = isFlashing ? 0.95 : isTarget ? 0.55 + 0.35 * urgency * pulse : 0.85;
      ctx.fillStyle = lit ? color : '#232533';
      if (lit) {
        ctx.shadowColor = color;
        ctx.shadowBlur = isFlashing ? 16 : 10 * urgency;
      }
      ctx.fillRect(lx, padY, laneW, padH - bevel);
      ctx.shadowBlur = 0;

      // Borde nítido de la tecla (se ilumina también cuando el pie real pisa ese carril).
      ctx.globalAlpha = 1;
      ctx.strokeStyle = lit
        ? '#ffffff'
        : hasFoot
          ? 'rgba(255, 255, 255, 0.65)'
          : 'rgba(232, 232, 240, 0.28)';
      ctx.lineWidth = lit ? 1.8 : 1.1;
      ctx.strokeRect(lx, padY, laneW, padH - bevel);

      // Punto indicador en vivo si el pie de la silueta está sobre este carril.
      if (hasFoot) {
        ctx.fillStyle = lit ? '#07080e' : color;
        ctx.beginPath();
        ctx.arc(lx + laneW / 2, padY + (padH - bevel) / 2, Math.max(2.5, laneW * 0.11), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 8. Indicadores visuales directos sobre el carril/altura objetivo (sin depender solo del texto):
    if (activeTargetNote) {
      ctx.save();
      if (activeTargetNote.kind === 'hand') {
        // Anillo luminoso en la zona de golpe de mano dentro de su carril (1 o 2).
        const lane = activeTargetNote.lane as number;
        const lx = laneX(lane) + laneW / 2;
        const hy = py + ph * 0.37;
        const r = Math.max(8, laneW * 0.36);
        const color = PAD_HEX[PAD_COLORS[lane]];
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.55 + 0.4 * urgency * pulse;
        ctx.beginPath();
        ctx.arc(lx, hy, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTargetNote.kind === 'foot') {
        // Cheurón hacia la tecla del pie que debe levantarse/pisar (carril 0 o 3).
        const lane = activeTargetNote.lane as number;
        const lx = laneX(lane) + laneW / 2;
        const color = PAD_HEX[PAD_COLORS[lane]];
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.6 + 0.4 * urgency * pulse;
        ctx.beginPath();
        ctx.moveTo(lx - laneW * 0.24, padY - 12);
        ctx.lineTo(lx, padY - 4);
        ctx.lineTo(lx + laneW * 0.24, padY - 12);
        ctx.stroke();
      } else if (activeTargetNote.kind === 'duck') {
        // Barra horizontal de techo indicando hasta dónde bajar la cabeza/hombros.
        const barY = py + ph * 0.34;
        ctx.strokeStyle = '#ffd23e';
        ctx.shadowColor = '#ff9f1c';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(px + padMarginX, barY);
        ctx.lineTo(px + pw - padMarginX, barY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (activeTargetNote.kind === 'jump') {
        // Barra inferior sobre las 4 teclas indicando elevar ambos pies.
        const barY = padY - 6;
        ctx.strokeStyle = '#29e6ff';
        ctx.shadowColor = '#29e6ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px + padMarginX, barY);
        ctx.lineTo(px + pw - padMarginX, barY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 9. Etiqueta compacta inferior bajo las 4 teclas cuando viene una nota u obstáculo.
    if (activeTargetNote) {
      const labels: Record<string, string> = {
        'wall-left': '◄ MUEVE A CARRILES IZQ',
        'wall-right': 'MUEVE A CARRILES DER ►',
        duck: '▼ AGÁCHATE BAJO LA LÍNEA',
        jump: '▲ SALTA SOBRE LAS TECLAS',
        hand: activeTargetNote.lane === 1 ? 'PUÑO IZQ (CARRIL 2)' : 'PUÑO DER (CARRIL 3)',
        foot: activeTargetNote.lane === 0 ? 'PIE IZQ (CARRIL 1)' : 'PIE DER (CARRIL 4)',
      };
      const label = labels[activeTargetNote.kind] ?? '';
      if (label) {
        const pillY = py + ph - 24;
        ctx.fillStyle = 'rgba(5, 6, 12, 0.86)';
        ctx.fillRect(px + 6, pillY, pw - 12, 19);
        ctx.font = `700 ${Math.max(10, Math.round(pw * 0.068))}px "Segoe UI", sans-serif`;
        ctx.fillStyle = isObstacle(activeTargetNote.kind)
          ? '#ffd23e'
          : PAD_HEX[PAD_COLORS[activeTargetNote.lane as number]];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, px + pw / 2, pillY + 9.5);
      }
    }

    // 10. Marco exterior gris claro/blanco como en el referente.
    ctx.strokeStyle = 'rgba(225, 225, 234, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px, py, pw, ph);
    ctx.restore();
  }

  /**
   * Compone en `sctx` la silueta corporal completa a partir de los landmarks
   * en vivo (o pose neutra si aún no hay detección) en dos pasadas:
   * - Pasada 1: blanco (#ffffff) con grosor expandido +2.3 px.
   * - Pasada 2: negro (#040407) con grosor base.
   * Ancla la línea del suelo a las 4 teclas inferiores (`h * 0.83`) para que los
   * desplazamientos laterales entre los 4 carriles, pasos, saltos y agachadas
   * se reflejen en tiempo real sin recentrar artificialmente el cuerpo.
   */
  private renderBodySilhouetteTwoPass(
    sctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    lms: Array<{ x: number; y: number; visibility: number }> | null,
  ): Record<number, Pt> {
    let pts: Record<number, Pt>;
    let scaleUnit: number;
    const floorTargetY = h * 0.815;

    if (lms && lms.length >= 33) {
      const ls = lms[LM.leftShoulder];
      const rs = lms[LM.rightShoulder];
      const lh = lms[LM.leftHip];
      const rh = lms[LM.rightHip];
      const la = lms[LM.leftAnkle];
      const ra = lms[LM.rightAnkle];
      const nose = lms[LM.nose];

      const anklesVis = (la.visibility ?? 0) >= 0.3 && (ra.visibility ?? 0) >= 0.3;
      const obsFloorY = anklesVis
        ? Math.max(la.y, ra.y)
        : (lh.y + rh.y) / 2 + Math.abs((lh.y + rh.y) / 2 - (ls.y + rs.y) / 2) * 1.45;
      const obsTopY = Math.min(nose.y - 0.06, ls.y - 0.12, rs.y - 0.12);
      const obsSpanY = Math.max(0.38, Math.min(0.92, obsFloorY - obsTopY));

      if (this.silFloorY === 0 || this.silSpanY === 0) {
        this.silFloorY = obsFloorY;
        this.silSpanY = obsSpanY;
      } else {
        // Actualizar muy suavemente la referencia del suelo para no cancelar saltos ni agachadas.
        this.silFloorY = this.silFloorY * 0.96 + Math.max(this.silFloorY, obsFloorY) * 0.04;
        this.silSpanY = this.silSpanY * 0.97 + obsSpanY * 0.03;
      }

      const scaleY = (h * 0.64) / Math.max(0.38, this.silSpanY);
      const scaleX = w * 1.35;
      scaleUnit = Math.max(w * 0.135, Math.hypot(ls.x - rs.x, ls.y - rs.y) * scaleY * 0.82);

      const mapPt = (idx: number): Pt => {
        const p = lms[idx];
        return {
          x: Math.max(w * 0.08, Math.min(w * 0.92, w * 0.5 + (0.5 - p.x) * scaleX)),
          y: Math.max(h * 0.07, Math.min(h * 0.9, floorTargetY + (p.y - this.silFloorY) * scaleY)),
        };
      };
      pts = {
        [LM.nose]: mapPt(LM.nose),
        [LM.leftShoulder]: mapPt(LM.leftShoulder),
        [LM.rightShoulder]: mapPt(LM.rightShoulder),
        [LM.leftElbow]: mapPt(LM.leftElbow),
        [LM.rightElbow]: mapPt(LM.rightElbow),
        [LM.leftWrist]: mapPt(LM.leftWrist),
        [LM.rightWrist]: mapPt(LM.rightWrist),
        [LM.leftHip]: mapPt(LM.leftHip),
        [LM.rightHip]: mapPt(LM.rightHip),
        [LM.leftKnee]: mapPt(LM.leftKnee),
        [LM.rightKnee]: mapPt(LM.rightKnee),
        [LM.leftAnkle]: mapPt(LM.leftAnkle),
        [LM.rightAnkle]: mapPt(LM.rightAnkle),
      };
    } else {
      // Pose neutra por defecto apoyada sobre los carriles centrales (1 y 2).
      scaleUnit = w * 0.21;
      pts = {
        [LM.nose]: { x: w * 0.5, y: h * 0.22 },
        [LM.leftShoulder]: { x: w * 0.37, y: h * 0.31 },
        [LM.rightShoulder]: { x: w * 0.63, y: h * 0.31 },
        [LM.leftElbow]: { x: w * 0.31, y: h * 0.43 },
        [LM.rightElbow]: { x: w * 0.69, y: h * 0.43 },
        [LM.leftWrist]: { x: w * 0.34, y: h * 0.52 },
        [LM.rightWrist]: { x: w * 0.66, y: h * 0.52 },
        [LM.leftHip]: { x: w * 0.42, y: h * 0.51 },
        [LM.rightHip]: { x: w * 0.58, y: h * 0.51 },
        [LM.leftKnee]: { x: w * 0.42, y: h * 0.66 },
        [LM.rightKnee]: { x: w * 0.58, y: h * 0.66 },
        [LM.leftAnkle]: { x: w * 0.41, y: floorTargetY },
        [LM.rightAnkle]: { x: w * 0.59, y: floorTargetY },
      };
    }

    const paintBody = (padPx: number, color: string, glow = 0) => {
      sctx.save();
      sctx.fillStyle = color;
      sctx.strokeStyle = color;
      sctx.lineCap = 'round';
      sctx.lineJoin = 'round';
      sctx.shadowColor = color;
      sctx.shadowBlur = glow;

      const ls = pts[LM.leftShoulder];
      const rs = pts[LM.rightShoulder];
      const lh = pts[LM.leftHip];
      const rh = pts[LM.rightHip];
      const nose = pts[LM.nose];
      const neck = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 - scaleUnit * 0.08 };
      const headCenter = {
        x: nose.x * 0.7 + neck.x * 0.3,
        y: Math.min(nose.y, neck.y - scaleUnit * 0.42),
      };

      const seg = (a: Pt, b: Pt, width: number) => {
        sctx.lineWidth = Math.max(2, width + padPx * 2);
        sctx.beginPath();
        sctx.moveTo(a.x, a.y);
        sctx.lineTo(b.x, b.y);
        sctx.stroke();
      };

      // Cuello y cabeza
      seg(neck, headCenter, scaleUnit * 0.28);
      sctx.beginPath();
      sctx.ellipse(
        headCenter.x,
        headCenter.y - scaleUnit * 0.05,
        scaleUnit * 0.27 + padPx,
        scaleUnit * 0.35 + padPx,
        0,
        0,
        Math.PI * 2,
      );
      sctx.fill();

      // Torso anatómico + hombros + pantalón corto (shorts como en la silueta del referente)
      const shW = Math.hypot(rs.x - ls.x, rs.y - ls.y);
      seg(ls, rs, scaleUnit * 0.36);
      seg(lh, rh, scaleUnit * 0.38);

      sctx.lineWidth = Math.max(2, scaleUnit * 0.28 + padPx * 2);
      sctx.beginPath();
      sctx.moveTo(ls.x, ls.y);
      sctx.lineTo(rs.x, rs.y);
      sctx.lineTo(rh.x, rh.y + scaleUnit * 0.14);
      sctx.lineTo(lh.x, lh.y + scaleUnit * 0.14);
      sctx.closePath();
      sctx.fill();
      sctx.stroke();

      // Piernas (muslo con volumen de pantalón corto + pantorrilla + pie)
      for (const [hip, knee, ankle, footSign] of [
        [lh, pts[LM.leftKnee], pts[LM.leftAnkle], -1],
        [rh, pts[LM.rightKnee], pts[LM.rightAnkle], 1],
      ] as const) {
        const midThigh = {
          x: hip.x * 0.45 + knee.x * 0.55,
          y: hip.y * 0.45 + knee.y * 0.55,
        };
        seg(hip, midThigh, Math.max(scaleUnit * 0.34, shW * 0.32));
        seg(midThigh, knee, scaleUnit * 0.24);
        seg(knee, ankle, scaleUnit * 0.2);
        const toe = {
          x: ankle.x + footSign * scaleUnit * 0.14,
          y: ankle.y + scaleUnit * 0.12,
        };
        seg(ankle, toe, scaleUnit * 0.21);
      }

      // Brazos (hombro -> codo -> muñeca + puño)
      for (const [sh, elb, wr] of [
        [ls, pts[LM.leftElbow], pts[LM.leftWrist]],
        [rs, pts[LM.rightElbow], pts[LM.rightWrist]],
      ] as const) {
        seg(sh, elb, scaleUnit * 0.23);
        seg(elb, wr, scaleUnit * 0.2);
        sctx.beginPath();
        sctx.arc(wr.x, wr.y, scaleUnit * 0.13 + padPx, 0, Math.PI * 2);
        sctx.fill();
      }

      sctx.restore();
    };

    // Pasada 1: contorno blanco exterior continuo.
    paintBody(2.3, '#ffffff', 3);
    // Pasada 2: relleno negro interior que elimina cualquier línea interna.
    paintBody(0, '#040407', 0);
    return pts;
  }

  private drawRating(game: GameView): void {
    if (!game.rating || performance.now() > game.ratingUntil) return;
    // En rachas altas de PERFECT, mostrar AWESOME / UNSTOPPABLE como en STAY ON BEAT #18.
    let key: string = game.rating;
    if (game.rating === 'perfect') {
      if (game.combo >= 24) key = 'unstoppable';
      else if (game.combo >= 10) key = 'awesome';
    }
    const img = this.images.get(`rating-${key}`) ?? this.images.get(`rating-${game.rating}`);
    if (!img) return;
    const { ctx, canvas } = this;
    const w = canvas.width * 0.21;
    const h = w * (img.height / img.width);
    ctx.save();
    // Sello inclinado debajo de la etiqueta COMBO (arriba a la derecha, igual que en el referente).
    ctx.translate(canvas.width * 0.85, canvas.height * 0.265);
    ctx.rotate(-0.1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  /**
   * Contador grande blanco ARRIBA y etiqueta COMBO pequeña DEBAJO, alineados a
   * la derecha, exactamente como en STAY ON BEAT #18 (audit-t061 / t0221).
   */
  private drawCombo(combo: number): void {
    const { ctx, canvas } = this;
    const digits = String(combo);
    const dh = canvas.height * 0.088;
    const step = dh * 0.64;
    const rightMargin = 32;
    let x = canvas.width - rightMargin - digits.length * step;
    const topY = 58;
    for (const ch of digits) {
      const img = this.images.get(`digit-${ch}`);
      if (img) {
        const dw = dh * (img.width / img.height);
        ctx.drawImage(img, x, topY, dw, dh);
        x += step;
      }
    }
    const label = this.images.get('combo-label');
    const lh = canvas.height * 0.036;
    if (label) {
      const lw = lh * (label.width / label.height);
      ctx.drawImage(label, canvas.width - rightMargin - lw, topY + dh + 2, lw, lh);
    }
  }

  /**
   * Los 4 receptores 3D al final de la pista: losas trapezoidales con grosor
   * frontal (bisel 3D) que convergen al punto de fuga. En reposo son gris
   * pizarra oscuro; al contacto de una nota o golpe del jugador se encienden
   * en su color neón y parpadean con halo luminoso, como en el referente.
   */
  private drawPads(): void {
    const { ctx } = this;
    const now = performance.now();
    const bevelH = Math.max(8, this.canvas.height * 0.022);

    for (let i = 0; i < 4; i++) {
      const r = this.padRect(i);
      const active = (this.padFlash.get(i) ?? 0) > now;
      const color = PAD_HEX[PAD_COLORS[i]];
      const q = this.laneSliceQuad(r, 0.83, 1.0);

      ctx.save();

      // Halo sobre la pista cuando el pad está encendido.
      if (active) {
        const cx = (q.bl.x + q.br.x) / 2;
        const cy = (q.tl.y + q.bl.y) / 2;
        const glowGrad = ctx.createRadialGradient(cx, cy, r.w * 0.1, cx, cy, r.w * 0.95);
        glowGrad.addColorStop(0, color);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = glowGrad;
        ctx.fillRect(cx - r.w, cy - r.h, r.w * 2, r.h * 2);
        ctx.restore();
      }

      // Cara frontal vertical (grosor 3D del pad).
      ctx.beginPath();
      ctx.moveTo(q.bl.x, q.bl.y);
      ctx.lineTo(q.br.x, q.br.y);
      ctx.lineTo(q.br.x, q.br.y + bevelH);
      ctx.lineTo(q.bl.x, q.bl.y + bevelH);
      ctx.closePath();
      ctx.fillStyle = active ? color : '#14151d';
      ctx.globalAlpha = active ? 0.55 : 0.95;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = active ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Cara superior en perspectiva del pad.
      ctx.beginPath();
      ctx.moveTo(q.tl.x, q.tl.y);
      ctx.lineTo(q.tr.x, q.tr.y);
      ctx.lineTo(q.br.x, q.br.y);
      ctx.lineTo(q.bl.x, q.bl.y);
      ctx.closePath();
      if (active) {
        const blink = 0.72 + 0.24 * Math.sin(now / 45);
        ctx.shadowColor = color;
        ctx.shadowBlur = 28;
        ctx.fillStyle = color;
        ctx.globalAlpha = blink;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.lineWidth = 2;
      } else {
        const idleGrad = ctx.createLinearGradient(0, q.tl.y, 0, q.bl.y);
        idleGrad.addColorStop(0, '#272936');
        idleGrad.addColorStop(1, '#1c1e28');
        ctx.fillStyle = idleGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(232,232,240,0.24)';
        ctx.lineWidth = 1.5;
      }
      ctx.stroke();
      ctx.restore();
    }
    // limpiar flashes expirados
    for (const [k, exp] of this.padFlash) if (exp <= now) this.padFlash.delete(k);
  }

  /** Sellos de acierto breves para obstáculos esquivados (sin congelar notas sobre los pads). */
  private drawStamps(): void {
    const { ctx } = this;
    const now = performance.now();
    const LIFE = 280;
    this.stamps = this.stamps.filter((s) => now - s.start < LIFE);
    for (const s of this.stamps) {
      if (!isObstacle(s.kind)) continue;
      const t = (now - s.start) / LIFE;
      const r = this.padRect(s.lane);
      const alpha = (1 - t) * 0.7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = PAD_HEX[s.color];
      ctx.font = `700 ${r.h * 0.75}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✓', r.x + r.w / 2, r.y + r.h / 2);
      ctx.restore();
    }
  }

  /** Anillos elípticos de onda expansiva sobre la pista (como en t0221 / audit-t0660). */
  private drawRings(): void {
    const { ctx } = this;
    const now = performance.now();
    const LIFE = 480;
    this.rings = this.rings.filter((r) => now - r.start < LIFE);
    for (const r of this.rings) {
      const t = (now - r.start) / LIFE;
      const rx = 45 + t * 185;
      const ry = rx * 0.42;
      const hex = PAD_HEX[r.color];
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.strokeStyle = hex;
      ctx.shadowColor = hex;
      ctx.shadowBlur = 14;
      ctx.lineWidth = Math.max(2, 7 * (1 - t));
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Fragmentos cúbicos 3D de color que estallan y suben sobre el pad al acertar (como en t0221 / audit-t0404). */
  private drawFrags(): void {
    const { ctx } = this;
    const now = performance.now();
    const LIFE = 580;
    this.frags = this.frags.filter((f) => now - f.start < LIFE);
    for (const f of this.frags) {
      const t = (now - f.start) / LIFE;
      const hex = PAD_HEX[f.color];
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.95;
      ctx.fillStyle = hex;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1;
      ctx.shadowColor = hex;
      ctx.shadowBlur = 8;
      // 8 cubos proyectados alrededor del impacto.
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 + 0.35;
        const spread = (18 + (k % 3) * 14) * (0.25 + t * 1.35);
        const lift = (45 + (k % 4) * 24) * t - 28 * t * t;
        const cx = f.x + Math.cos(ang) * spread;
        const cy = f.y - lift + Math.sin(ang) * spread * 0.35;
        const sz = Math.max(4, (13 - (k % 3) * 2) * (1 - t * 0.45));
        ctx.fillRect(cx - sz / 2, cy - sz / 2, sz, sz);
        ctx.strokeRect(cx - sz / 2, cy - sz / 2, sz, sz);
      }
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
