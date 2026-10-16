import { listCameras, startCamera, stopCamera, CameraError, type CameraHandle } from './capture/camera';
import { PoseTracker, MODEL_LABEL } from './pose/landmarker';
import { Calibrator, framingReport, type BodyMetrics } from './body/calibration';
import { HandRaiseDetector, FootLiftDetector, JumpDetector, PunchDetector, type GestureEvent } from './body/gestures';
import { computeBodyState, type BodyState } from './body/state';
import { Scene, PAD_COLORS, type GameView, type ResultsView } from './render/scene';
import { SongClock } from './rhythm/clock';
import { generateBeatmap, isObstacle, laneFor, type Note } from './rhythm/beatmap';
import { rate, RATING_LABEL, WINDOWS, type Rating } from './rhythm/judgement';
import type { Landmark } from './types';

type AppState = 'idle' | 'starting' | 'live' | 'calibrating' | 'ready' | 'playing' | 'error';

const TRAVEL_MS = 2000;
const BPM = 120;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>('scene');
const bigCard = $<HTMLDivElement>('big-card');
const startCard = $('start-card');
const btnHero = $<HTMLButtonElement>('btn-hero');
const heroHint = $('hero-hint');
const deviceSelect = $<HTMLSelectElement>('device-select');
const btnStart = $<HTMLButtonElement>('btn-start');
const btnCalibrate = $<HTMLButtonElement>('btn-calibrate');
const btnPlay = $<HTMLButtonElement>('btn-play');
const sceneSelect = $<HTMLSelectElement>('scene-select');
const lengthSelect = $<HTMLSelectElement>('length-select');
const btnPanelToggle = $<HTMLButtonElement>('btn-panel-toggle');
const stageControls = document.querySelector<HTMLElement>('.stage-controls')!;
const chipPermission = $('chip-permission');
const chipPose = $('chip-pose');
const chipHands = $('chip-hands');
const chipFeet = $('chip-feet');
const chipLean = $('chip-lean');
const chipDuck = $('chip-duck');
const mFps = $('m-fps');
const mInfer = $('m-infer');
const mCam = $('m-cam');
const mModel = $('m-model');
const mLeft = $('m-left');
const mRight = $('m-right');
const mCombo = $('m-combo');
const mLast = $('m-last');
const logEl = $('log');

const scene = new Scene(canvas);
scene.statusEl = $('guide-status');
const tracker = new PoseTracker();
const detector = new HandRaiseDetector();
const footDetector = new FootLiftDetector();
const jumpDetector = new JumpDetector();
const punchDetector = new PunchDetector();

let state: AppState = 'idle';
let camera: CameraHandle | null = null;
let calibrator: Calibrator | null = null;
/** Momento en que la calibración empieza a capturar (tras cuenta atrás). */
let calibrateAt = 0;
let metrics: BodyMetrics | null = null;
let lastLandmarks: Landmark[] | null = null;
let hits = { left: 0, right: 0 };
let overlayText: string | null = null;

// Estado del juego rítmico
let clock: SongClock | null = null;
let notes: Note[] = [];
let combo = 0;
let maxCombo = 0;
let counts: Record<Rating, number> = { perfect: 0, great: 0, nice: 0, miss: 0 };
let lastRating: Rating | null = null;
let ratingUntil = 0;
let bodyState: BodyState = { lean: null, ducking: false };
let bgVideo: HTMLVideoElement | null = null;
let resultsView: ResultsView | null = null;
let lastComboMilestone = 0;
let sessionDurationMs = 0;
let lastError: string | null = null;

/** Tarjeta de inicio: un solo botón que guía el flujo según el estado. */
function refreshHero(): void {
  // La tarjeta tapa la cámara y la guía: solo se muestra donde hace falta su CTA
  // (iniciar/reintentar/jugar). En live y calibrating se usa el botón CALIBRAR
  // de la barra superior del escenario.
  startCard.classList.toggle(
    'hidden',
    state === 'live' || state === 'calibrating' || state === 'playing',
  );
  // La barra de controles se oculta solo en juego para no tapar la guía de obstáculos.
  stageControls.classList.toggle('hidden', state === 'playing');
  btnHero.disabled = state === 'starting' || state === 'calibrating';
  const cfg: Record<AppState, [string, string]> = {
    idle: ['Iniciar cámara', 'Necesitas una webcam · todo se procesa en tu navegador'],
    starting: ['Conectando…', 'Solicitando permiso de cámara'],
    live: ['Calibrar', 'Ponte a cuerpo completo en el encuadre'],
    calibrating: ['Quédate quieto…', 'Capturando tu posición neutral'],
    ready: ['JUGAR', 'Escenario y duración en el panel de la derecha'],
    playing: ['', ''],
    error: ['Reintentar cámara', lastError ?? 'Revisa los permisos de cámara'],
  };
  const [label, hint] = cfg[state];
  btnHero.textContent = label;
  heroHint.textContent =
    state === 'ready' && resultsView
      ? `Sesión completa: ${resultsView.perfect + resultsView.great + resultsView.nice}/${resultsView.total} notas · combo máx ${resultsView.maxCombo}`
      : hint;
}

function getBgVideo(): HTMLVideoElement {
  if (!bgVideo) {
    bgVideo = document.createElement('video');
    bgVideo.loop = true;
    bgVideo.muted = true;
    bgVideo.playsInline = true;
  }
  const src = `${import.meta.env.BASE_URL}assets/v001/backgrounds/${sceneSelect.value}.mp4`;
  if (!bgVideo.src.endsWith(`${sceneSelect.value}.mp4`)) bgVideo.src = src;
  return bgVideo;
}

const SFX = `${import.meta.env.BASE_URL}assets/v001/audio`;
const sounds = {
  hand: new Audio(`${SFX}/hit-hand.wav`),
  foot: new Audio(`${SFX}/hit-foot.wav`),
  miss: new Audio(`${SFX}/miss.wav`),
  comboUp: new Audio(`${SFX}/combo-up.wav`),
  complete: new Audio(`${SFX}/session-complete.wav`),
};
for (const s of Object.values(sounds)) s.volume = 0.6;
function play(snd: keyof typeof sounds): void {
  const a = sounds[snd];
  a.currentTime = 0;
  void a.play().catch(() => {});
}

function log(msg: string, cls = ''): void {
  const li = document.createElement('li');
  if (cls) li.className = cls;
  li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(li);
  while (logEl.children.length > 40) logEl.lastElementChild?.remove();
}

function setChip(el: HTMLElement, text: string, cls: '' | 'ok' | 'warn' | 'err'): void {
  el.textContent = text;
  el.className = `chip ${cls}`.trim();
}

function setBigCard(text: string | null): void {
  if (text === null) {
    bigCard.classList.add('hidden');
  } else {
    bigCard.textContent = text;
    bigCard.classList.remove('hidden');
  }
}

async function refreshDevices(): Promise<void> {
  const cams = await listCameras();
  deviceSelect.innerHTML = '';
  if (cams.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'Sin cámaras detectadas';
    deviceSelect.append(opt);
    deviceSelect.disabled = true;
    return;
  }
  for (const cam of cams) {
    const opt = document.createElement('option');
    opt.value = cam.deviceId;
    opt.textContent = cam.label || `Cámara ${deviceSelect.length + 1}`;
    deviceSelect.append(opt);
  }
  deviceSelect.disabled = false;
  if (camera?.deviceId) deviceSelect.value = camera.deviceId;
}

async function boot(): Promise<void> {
  state = 'starting';
  btnStart.disabled = true;
  setChip(chipPermission, 'Permiso: solicitando…', '');
  log('Solicitando acceso a la cámara…');
  try {
    camera = await startCamera(deviceSelect.value || undefined);
  } catch (err) {
    state = 'error';
    btnStart.disabled = false;
    if (err instanceof CameraError) {
      setChip(chipPermission, `Permiso: ${err.kind === 'denied' ? 'denegado' : 'error'}`, 'err');
      log(err.message);
      lastError = err.message;
      if (err.kind === 'denied') {
        log('Permite la cámara en el icono de candado/ajustes de la barra de direcciones y reintenta', 'hit');
        log('Si el navegador no ofrece la opción, revisa Configuración de Windows → Privacidad → Cámara', 'hit');
      }
      setBigCard(err.kind === 'denied' ? '✕' : '!');
    }
    refreshHero();
    return;
  }
  camera.stream.getVideoTracks()[0]?.addEventListener('ended', onCameraLost);
  setChip(chipPermission, 'Permiso: concedido', 'ok');
  const s = camera.stream.getVideoTracks()[0]?.getSettings();
  mCam.textContent = s?.width ? `${s.width}×${s.height}@${Math.round(s.frameRate ?? 0)}` : 'activa';
  log(`Cámara activa: ${deviceSelect.selectedOptions[0]?.textContent ?? 'por defecto'}`);
  await refreshDevices();
  state = 'live';
  refreshHero();
  overlayText = 'Colócate a cuerpo completo y pulsa CALIBRAR';
  btnCalibrate.disabled = false;

  if (!mModel.textContent || mModel.textContent === '–') {
    mModel.textContent = 'cargando…';
    try {
      await tracker.init();
      mModel.textContent = MODEL_LABEL;
      log('Modelo de pose cargado');
    } catch (err) {
      mModel.textContent = 'error';
      log(`Error cargando modelo: ${err instanceof Error ? err.message : err}`);
    }
  }
}

function onCameraLost(): void {
  log('La cámara dejó de enviar video', 'hit');
  // Soltar el stream muerto: si no, draw() sigue pintando el último frame
  // corrupto y el canvas parpadea en bandas.
  stopCamera(camera);
  camera = null;
  // Cortar el juego si estaba en marcha: sin cámara no hay gestos ni sentido
  // en seguir el reloj o el fondo.
  clock?.stop();
  clock = null;
  bgVideo?.pause();
  scene.setBackground(null);
  setChip(chipPermission, 'Permiso: cámara perdida', 'err');
  setBigCard('!');
  overlayText = 'Cámara perdida — reinicia con el botón';
  btnStart.disabled = false;
  btnCalibrate.disabled = true;
  state = 'error';
  lastError = 'La cámara dejó de enviar video';
  refreshHero();
}

function startCalibration(): void {
  if (state !== 'live' && state !== 'ready') return;
  calibrator = new Calibrator(60);
  resultsView = null;
  // 5 s de margen para alejarse de la pantalla y colocarse antes de capturar.
  calibrateAt = performance.now() + 5000;
  state = 'calibrating';
  detector.reset();
  btnCalibrate.disabled = true;
  refreshHero();
  log('Calibrando en 5 s: aléjate y ponte en posición neutral…');
}

function finishCalibration(m: BodyMetrics, coverage: number): void {
  metrics = m;
  state = 'ready';
  btnCalibrate.disabled = false;
  refreshHero();
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  log(
    `Calibrado (pose en ${pct(coverage)} de frames): hombros ${m.shoulderWidth.toFixed(3)}, torso ${m.torsoHeight.toFixed(3)} · vis manos ${pct(m.visibility.hands)}, pies ${pct(m.visibility.feet)}`,
  );
  if (coverage < 0.6) log('Poca cobertura de pose durante la calibración — revisa encuadre/luz', 'hit');
  if (m.visibility.hands < 0.5 || m.visibility.feet < 0.5) {
    log('Visibilidad baja: aléjate de la cámara hasta ver manos y pies completos', 'hit');
  }
  btnPlay.disabled = false;
  overlayText = 'Mueve manos o pies para probar · o pulsa JUGAR';
  setBigCard('GO');
  setTimeout(() => setBigCard(null), 900);
}

// --- Bucle principal -------------------------------------------------------

let fpsEMA = 0;
let inferEMA = 0;
let lastHudUpdate = 0;
let lastTickTime = 0;

function laneOf(ev: GestureEvent): number {
  if (ev.kind === 'jumped') return -1;
  if (ev.kind === 'foot-lifted') return laneFor('foot', ev.hand);
  return laneFor('hand', ev.hand); // hand-raised y punch comparten carril
}

function sideLabel(ev: GestureEvent): string {
  if (ev.kind === 'jumped') return 'salto';
  const side = ev.hand === 'left' ? 'izquierda' : 'derecha';
  if (ev.kind === 'punch') return `puñetazo ${side === 'izquierda' ? 'izquierdo' : 'derecho'}`;
  return ev.kind === 'hand-raised' ? `mano ${side}` : `pie ${side === 'izquierda' ? 'izquierdo' : 'derecho'}`;
}

function registerHit(note: Note | null, rating: Rating, ev?: GestureEvent): void {
  if (note) {
    note.state = 'hit';
    // La nota queda marcada un momento donde se resolvió (como en la referencia).
    scene.stampHit(note);
  }
  combo++;
  maxCombo = Math.max(maxCombo, combo);
  counts[rating]++;
  lastRating = rating;
  ratingUntil = performance.now() + 700;
  mCombo.textContent = String(combo);
  mLast.textContent = RATING_LABEL[rating];
  play(ev?.kind === 'foot-lifted' ? 'foot' : 'hand');
  const milestone = Math.floor(combo / 8) * 8;
  if (milestone > 0 && milestone > lastComboMilestone) {
    lastComboMilestone = milestone;
    play('comboUp');
  }
}

function handleGesture(ev: GestureEvent): void {
  const lane = laneOf(ev);
  scene.triggerHit(
    lane >= 0
      ? { pads: [lane], color: PAD_COLORS[lane] }
      : { pads: [0, 1, 2, 3], color: 'cyan' },
  );
  hits[ev.hand]++;
  (ev.hand === 'left' ? mLeft : mRight).textContent = String(hits[ev.hand]);

  if (state !== 'playing' || !clock) {
    play(ev.kind === 'foot-lifted' ? 'foot' : 'hand');
    log(`Gesto: ${sideLabel(ev)}${lane >= 0 ? ` → pad ${lane}` : ''}`, 'hit');
    return;
  }

  // Juicio: nota pendiente más cercana que coincida con el gesto.
  const gTime = clock.toSongTime(ev.timestamp);
  let best: Note | null = null;
  let bestDelta = Infinity;
  for (const n of notes) {
    if (n.state !== 'pending') continue;
    const match = ev.kind === 'jumped' ? n.kind === 'jump' : n.lane === lane && !isObstacle(n.kind);
    if (!match) continue;
    const d = Math.abs(gTime - n.time);
    if (d < bestDelta) {
      bestDelta = d;
      best = n;
    }
  }
  const rating = best ? rate(gTime - best.time) : null;
  if (best && rating) registerHit(best, rating, ev);
}

async function startGame(): Promise<void> {
  if (state !== 'ready' || !metrics) return;
  clock = new SongClock(`${SFX}/cardio-bed-120bpm.wav`);
  const beats = Number(lengthSelect.value) || 32;
  notes = generateBeatmap(BPM, beats, { pairs: beats > 32 });
  combo = 0;
  maxCombo = 0;
  lastComboMilestone = 0;
  counts = { perfect: 0, great: 0, nice: 0, miss: 0 };
  lastRating = null;
  resultsView = null;
  sessionDurationMs = notes[notes.length - 1]?.time ?? 16000;
  mCombo.textContent = '0';
  mLast.textContent = '–';
  detector.reset();
  footDetector.reset();
  jumpDetector.reset();
  punchDetector.reset();
  btnPlay.disabled = true;
  btnCalibrate.disabled = true;
  state = 'playing';
  refreshHero();
  overlayText = null;
  const bg = getBgVideo();
  void bg.play().catch(() => {});
  scene.setBackground(bg);
  log(`Jugando: ${notes.length} notas a ${BPM} BPM`, 'hit');
  await clock.start();
}

function endGame(): void {
  state = 'ready';
  clock?.stop();
  clock = null;
  bgVideo?.pause();
  scene.setBackground(null);
  btnPlay.disabled = false;
  btnCalibrate.disabled = false;
  refreshHero();
  overlayText = 'Sesión terminada';
  resultsView = {
    perfect: counts.perfect,
    great: counts.great,
    nice: counts.nice,
    miss: counts.miss,
    maxCombo,
    total: notes.length,
  };
  play('complete');
  const hit = counts.perfect + counts.great + counts.nice;
  log(
    `Fin: ${hit}/${notes.length} notas · PERFECT ${counts.perfect} · GREAT ${counts.great} · NICE ${counts.nice} · MISS ${counts.miss} · combo máx ${maxCombo}`,
    'hit',
  );
}

async function tick(): Promise<void> {
  requestAnimationFrame(() => void tick());
  const t0 = performance.now();

  let warnings: string[] = [];
  if (camera && state !== 'error') {
    const frame = tracker.detect(camera.video);
    if (frame) {
      inferEMA = inferEMA * 0.9 + frame.inferenceMs * 0.1;
      lastLandmarks = frame.landmarks;
      if (frame.landmarks) {
        setChip(chipPose, `Pose: OK`, 'ok');
        const rep = framingReport(frame.landmarks);
        setChip(chipHands, rep.handsVisible ? 'Manos: visibles' : 'Manos: fuera', rep.handsVisible ? 'ok' : 'warn');
        setChip(chipFeet, rep.feetVisible ? 'Pies: visibles' : 'Pies: fuera', rep.feetVisible ? 'ok' : 'warn');
        warnings = rep.warnings;
      } else {
        setChip(chipPose, 'Pose: sin detección', 'warn');
      }

      if (state === 'calibrating' && calibrator) {
        const wait = calibrateAt - t0;
        if (wait > 0) {
          setBigCard(`${Math.ceil(wait / 1000)}`);
        } else {
          setBigCard(
            calibrator.progress < 1
              ? `${Math.max(1, Math.ceil((1 - calibrator.progress) * 3))}`
              : null,
          );
          const done = calibrator.addFrame(frame.landmarks);
          if (done) finishCalibration(done, calibrator.poseCoverage);
        }
      } else if ((state === 'ready' || state === 'playing') && metrics) {
        bodyState = computeBodyState(frame.landmarks, metrics);
        setChip(
          chipLean,
          bodyState.lean ? `Esquiva: ${bodyState.lean === 'left' ? 'izq' : 'der'}` : 'Esquiva: —',
          bodyState.lean ? 'ok' : '',
        );
        setChip(chipDuck, bodyState.ducking ? 'Agachado: sí' : 'Agachado: —', bodyState.ducking ? 'ok' : '');
        for (const ev of [
          ...detector.update(frame.landmarks, metrics),
          ...footDetector.update(frame.landmarks, metrics),
          ...jumpDetector.update(frame.landmarks, metrics),
          ...punchDetector.update(frame.landmarks, metrics),
        ]) {
          handleGesture(ev);
        }
        if (state === 'playing' && clock) {
          const st = clock.songTime();
          if (st < 0) {
            setBigCard(`${Math.max(1, Math.ceil(-st / 500))}`);
          } else if (st < 600) {
            setBigCard('GO');
          } else {
            setBigCard(null);
          }
          for (const n of notes) {
            if (n.state !== 'pending') continue;
            const d = st - n.time;
            if (d > WINDOWS.nice) {
              n.state = 'missed';
              combo = 0;
              counts.miss++;
              lastRating = 'miss';
              ratingUntil = performance.now() + 700;
              mCombo.textContent = '0';
              mLast.textContent = 'MISS';
              play('miss');
              continue;
            }
            // Obstáculos de estado sostenido: esquiva y agacharse.
            const ok =
              (n.kind === 'wall-left' && bodyState.lean === 'left') ||
              (n.kind === 'wall-right' && bodyState.lean === 'right') ||
              (n.kind === 'duck' && bodyState.ducking);
            if (ok && Math.abs(d) <= WINDOWS.nice) {
              registerHit(n, rate(d) ?? 'nice');
            }
          }
          const last = notes[notes.length - 1];
          if (last && st > last.time + 1500) endGame();
        }
      }
    }
  }

  const gameView: GameView | undefined =
    state === 'playing' && clock
      ? {
          notes,
          songTime: clock.songTime(),
          travelMs: TRAVEL_MS,
          rating: lastRating,
          ratingUntil,
          combo,
          durationMs: sessionDurationMs,
          paused: clock.isPaused,
        }
      : undefined;
  // En juego no mostramos avisos de encuadre: distraen sobre la pista.
  scene.draw(
    camera?.video ?? null,
    lastLandmarks,
    state === 'playing' ? [] : warnings,
    overlayText,
    gameView,
  );
  if (resultsView) scene.drawResults(resultsView);

  if (lastTickTime > 0) {
    const frameMs = t0 - lastTickTime;
    fpsEMA = fpsEMA * 0.95 + (1000 / Math.max(frameMs, 0.01)) * 0.05;
  }
  lastTickTime = t0;
  if (t0 - lastHudUpdate > 500) {
    lastHudUpdate = t0;
    mFps.textContent = fpsEMA.toFixed(0);
    mInfer.textContent = inferEMA > 0 ? `${inferEMA.toFixed(1)} ms` : '–';
  }
}

// --- Arranque --------------------------------------------------------------

btnHero.addEventListener('click', () => {
  if (state === 'idle' || state === 'error') void boot();
  else if (state === 'live') startCalibration();
  else if (state === 'ready') void startGame();
});
btnStart.addEventListener('click', () => void boot());
btnCalibrate.addEventListener('click', startCalibration);
btnPlay.addEventListener('click', () => void startGame());
btnPanelToggle.addEventListener('click', () => {
  const main = document.querySelector('main');
  if (!main) return;
  const collapsed = main.classList.toggle('panel-collapsed');
  btnPanelToggle.textContent = collapsed ? '«' : '»';
  btnPanelToggle.title = collapsed ? 'Expandir panel' : 'Contraer panel';
  localStorage.setItem('panel-collapsed', collapsed ? '1' : '0');
});
if (localStorage.getItem('panel-collapsed') === '1') btnPanelToggle.click();
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || state !== 'playing' || !clock) return;
  if (clock.isPaused) {
    void clock.resume().then(() => void bgVideo?.play().catch(() => {}));
    log('Reanudado');
  } else {
    clock.pause();
    bgVideo?.pause();
    log('Pausa (Esc para continuar)');
  }
});
deviceSelect.addEventListener('change', async () => {
  if (state === 'idle' || state === 'error') return;
  log('Cambiando de cámara…');
  stopCamera(camera);
  await boot();
});
window.addEventListener('beforeunload', () => {
  stopCamera(camera);
  tracker.close();
});

void refreshDevices();
void scene
  .loadAssets()
  .then(() => log('Assets del kit cargados'))
  .catch((e) => log(`Error cargando assets: ${e instanceof Error ? e.message : e}`));
void tick();
refreshHero();
log('Listo. Pulsa "Iniciar cámara".');
