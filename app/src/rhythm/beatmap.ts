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

export type SongId = string;
export type Difficulty = 'basico' | 'intermedio' | 'avanzado';

/** Tiempo de recorrido en túnel (ms) por nivel: menor tiempo = mayor velocidad visual. */
export const DIFFICULTY_TRAVEL_MS: Record<Difficulty, number> = {
  basico: 3100,
  intermedio: 2600,
  avanzado: 2050,
};

export interface SongMeta {
  id: SongId;
  title: string;
  style: 'edm' | 'synthwave' | 'rock' | 'hard-rock';
  file: string;
  /** URL directa cuando el usuario importa un MP3/WAV propio desde su PC. */
  customUrl?: string;
  /** AudioBuffer decodificado para analizar sus ataques reales en cualquier dificultad. */
  audioBuffer?: AudioBuffer;
  bpm: number;
}

/**
 * Catálogo de 24 pistas de estudio reales libres de derechos (Creative Commons
 * CC-BY 4.0 Kevin MacLeod / Incompetech):
 * - 12 pistas en la categoría Electro / Beat Fever / Synth-Pop (120–160 BPM)
 * - 12 pistas en la categoría Rock / Guitar Hero / Indie-Punk (116–160 BPM)
 * Todas recortadas y alineadas por detección de transitorios (onset detection)
 * para que el beat 1 caiga exactamente al terminar la cuenta atrás de 2.0 s.
 */
export const SONGS: Record<string, SongMeta> = {
  // === 12 ELECTRO / BEAT FEVER / SYNTH-POP ===
  'edm-detection-mode': {
    id: 'edm-detection-mode',
    title: 'EDM Detection Mode — Club Electro',
    style: 'edm',
    file: 'edm-detection-mode.mp3',
    bpm: 128,
  },
  laserpack: {
    id: 'laserpack',
    title: 'Laserpack — Electro House',
    style: 'edm',
    file: 'laserpack.mp3',
    bpm: 128,
  },
  'raving-energy': {
    id: 'raving-energy',
    title: 'Raving Energy — Festival Anthem',
    style: 'edm',
    file: 'raving-energy.mp3',
    bpm: 122,
  },
  'raving-energy-faster': {
    id: 'raving-energy-faster',
    title: 'Raving Energy (Overdrive Remix)',
    style: 'edm',
    file: 'raving-energy-faster.mp3',
    bpm: 134,
  },
  realizer: {
    id: 'realizer',
    title: 'Realizer — Progressive Dance',
    style: 'edm',
    file: 'realizer.mp3',
    bpm: 125,
  },
  'brain-dance': {
    id: 'brain-dance',
    title: 'Brain Dance — Dark Electro-Pop',
    style: 'edm',
    file: 'brain-dance.mp3',
    bpm: 124,
  },
  voltaic: {
    id: 'voltaic',
    title: 'Voltaic — Synthwave Cyber-Beat',
    style: 'synthwave',
    file: 'voltaic.mp3',
    bpm: 120,
  },
  'eighties-action': {
    id: 'eighties-action',
    title: 'Eighties Action — 80s Dance-Pop',
    style: 'synthwave',
    file: 'eighties-action.mp3',
    bpm: 132,
  },
  'kick-shock': {
    id: 'kick-shock',
    title: 'Kick Shock — Lead Synth Pop-Dance',
    style: 'synthwave',
    file: 'kick-shock.mp3',
    bpm: 138,
  },
  'shiny-tech': {
    id: 'shiny-tech',
    title: 'Shiny Tech — Hyper Techno-Pop',
    style: 'edm',
    file: 'shiny-tech.mp3',
    bpm: 138,
  },
  'club-diver': {
    id: 'club-diver',
    title: 'Club Diver — Euro Electro-Club',
    style: 'edm',
    file: 'club-diver.mp3',
    bpm: 140,
  },
  'neon-laser-horizon': {
    id: 'neon-laser-horizon',
    title: 'Neon Laser Horizon — Fast Synth-Wave',
    style: 'hard-rock',
    file: 'neon-laser-horizon.mp3',
    bpm: 160,
  },

  // === 12 ROCK / GUITAR HERO / INDIE-PUNK ===
  'cool-rock': {
    id: 'cool-rock',
    title: 'Cool Rock — Stadium Guitar Rock',
    style: 'rock',
    file: 'cool-rock.mp3',
    bpm: 128,
  },
  hotrock: {
    id: 'hotrock',
    title: 'Hotrock — Glam & Brass Power Rock',
    style: 'rock',
    file: 'hotrock.mp3',
    bpm: 124,
  },
  neolith: {
    id: 'neolith',
    title: 'Neolith — Punk-Rock Dual Guitars',
    style: 'hard-rock',
    file: 'neolith.mp3',
    bpm: 145,
  },
  nonstop: {
    id: 'nonstop',
    title: 'Nonstop — Indie Dance-Rock',
    style: 'rock',
    file: 'nonstop.mp3',
    bpm: 128,
  },
  'harmful-or-fatal': {
    id: 'harmful-or-fatal',
    title: 'Harmful or Fatal — Fast J-Rock Guitar',
    style: 'rock',
    file: 'harmful-or-fatal.mp3',
    bpm: 135,
  },
  'professor-umlaut': {
    id: 'professor-umlaut',
    title: 'Professor Umlaut — Euphoric Speed Rock',
    style: 'hard-rock',
    file: 'professor-umlaut.mp3',
    bpm: 160,
  },
  metalmania: {
    id: 'metalmania',
    title: 'Metalmania — Intense Guitar Hero Riff',
    style: 'hard-rock',
    file: 'metalmania.mp3',
    bpm: 150,
  },
  'sax-rock-and-roll': {
    id: 'sax-rock-and-roll',
    title: 'Sax, Rock & Roll — Upbeat Pop-Rock',
    style: 'rock',
    file: 'sax-rock-and-roll.mp3',
    bpm: 128,
  },
  'riptide-rock': {
    id: 'riptide-rock',
    title: 'Riptide — Driving Twin-Guitar Rock',
    style: 'rock',
    file: 'riptide-rock.mp3',
    bpm: 128,
  },
  'rocket-power': {
    id: 'rocket-power',
    title: 'Rocket Power — Funk-Rock Bass & Guitar',
    style: 'rock',
    file: 'rocket-power.mp3',
    bpm: 120,
  },
  'cool-hard-facts': {
    id: 'cool-hard-facts',
    title: 'Cool Hard Facts — Power Chord Rock',
    style: 'rock',
    file: 'cool-hard-facts.mp3',
    bpm: 116,
  },
  chipper: {
    id: 'chipper',
    title: 'Chipper — Garage Distortion Punk',
    style: 'rock',
    file: 'chipper.mp3',
    bpm: 116,
  },
};

export interface BeatmapOptions {
  /** Pares simultáneos de puños en ciertos beats. */
  pairs?: boolean;
  /** Un obstáculo por compás de 8, rotando tipos. */
  obstacles?: boolean;
  /** Identificador de canción para adaptar el patrón rítmico a su estilo y BPM. */
  songId?: SongId;
  /** Nivel de dificultad: básico (cada 4 beats), intermedio (cada 2 beats), avanzado (cada 1 beat + dobles). */
  difficulty?: Difficulty;
}

const OBSTACLE_CYCLE: NoteKind[] = ['wall-left', 'wall-right', 'duck', 'jump'];

/**
 * Analizador espectral de onda completa (Web Audio API):
 * Recorre el `AudioBuffer` de una canción importada por el usuario, separa en
 * el dominio temporal la banda grave (< 150 Hz: bombo y bajo → pasos de PIE)
 * de la banda media/aguda (> 200 Hz: caja, guitarra, voz y sintetizador →
 * golpes de PUÑO) y detecta los picos de energía (drops → OBSTÁCULOS),
 * generando una pista a medida sincronizada con cada golpe real de esa canción
 * y adaptada al nivel (`basico`, `intermedio`, `avanzado`).
 */
export function generateCustomAudioBeatmap(
  audioBuf: AudioBuffer,
  bpm: number,
  totalBeats: number,
  difficulty: Difficulty = 'intermedio',
): Note[] {
  const sr = audioBuf.sampleRate;
  const ch0 = audioBuf.getChannelData(0);
  const ch1 = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : ch0;
  const hop = Math.max(1, Math.round(sr * 0.01)); // resolución de 10 ms (100 Hz)
  const nFrames = Math.floor(ch0.length / hop);
  if (nFrames < 100) {
    return generateBeatmap(bpm, totalBeats, { difficulty });
  }

  // Filtro paso-bajo de primer orden (~150 Hz) para separar graves (bombo/bajo) de medios/agudos (caja/guitarra/synth).
  const rc = 1 / (2 * Math.PI * 150);
  const dt = 1 / sr;
  const alphaLp = dt / (rc + dt);
  const lowRms = new Float32Array(nFrames);
  const highRms = new Float32Array(nFrames);
  let lpState = 0;

  for (let f = 0; f < nFrames; f++) {
    let sumLow = 0;
    let sumHigh = 0;
    const base = f * hop;
    for (let j = 0; j < hop; j++) {
      const mono = (ch0[base + j] + ch1[base + j]) * 0.5;
      lpState += alphaLp * (mono - lpState);
      const hp = mono - lpState;
      sumLow += lpState * lpState;
      sumHigh += hp * hp;
    }
    lowRms[f] = Math.sqrt(sumLow / hop);
    highRms[f] = Math.sqrt(sumHigh / hop);
  }

  const lowOnset = new Float32Array(nFrames);
  const highOnset = new Float32Array(nFrames);
  for (let f = 1; f < nFrames; f++) {
    lowOnset[f] = Math.max(0, lowRms[f] - lowRms[f - 1]);
    highOnset[f] = Math.max(0, highRms[f] - highRms[f - 1]);
  }

  const beatMs = 60000 / bpm;
  const targetDurationMs = totalBeats * beatMs;
  const minGapMs =
    difficulty === 'basico' ? Math.max(1350, beatMs * 3.2) : difficulty === 'intermedio' ? Math.max(820, beatMs * 1.8) : Math.max(430, beatMs * 0.95);
  const obsGapMs = difficulty === 'basico' ? 1800 : difficulty === 'intermedio' ? 1400 : 1050;

  const notes: Note[] = [];
  let id = 0;
  let lastNoteTime = -9999;
  let lastObsTime = -9999;
  let handSide: Hand = 'left';
  let footSide: Hand = 'left';
  let obsIdx = 0;
  const audioDurMs = Math.max(1000, (nFrames * 10));

  // Evaluar candidatos en una rejilla fina de semicorcheas/corcheas anclada a los picos reales de ataque
  const stepMs = beatMs / 2;
  const totalSteps = Math.floor(targetDurationMs / stepMs);

  for (let s = 2; s < totalSteps; s++) {
    const songTime = s * stepMs;
    if (songTime < 1000) continue; // margen inicial tras "GO"
    if (songTime - lastNoteTime < minGapMs) continue;

    // En SongClock, songTime = 0 corresponde a audioTime = 2000 ms (leadInMs).
    const audioTimeMs = (songTime + 2000) % audioDurMs;
    const centerFrame = Math.min(nFrames - 4, Math.max(3, Math.round(audioTimeMs / 10)));

    // Ventana local de ±30 ms para capturar el transitorio real y umbral adaptativo de ±1.2 s
    let peakLow = 0;
    let peakHigh = 0;
    for (let k = -3; k <= 3; k++) {
      peakLow = Math.max(peakLow, lowOnset[centerFrame + k]);
      peakHigh = Math.max(peakHigh, highOnset[centerFrame + k]);
    }
    let meanLow = 0.0001;
    let meanHigh = 0.0001;
    const win = 120;
    const f0 = Math.max(0, centerFrame - win);
    const f1 = Math.min(nFrames - 1, centerFrame + win);
    for (let f = f0; f <= f1; f++) {
      meanLow += lowOnset[f];
      meanHigh += highOnset[f];
    }
    meanLow /= f1 - f0 + 1;
    meanHigh /= f1 - f0 + 1;

    const normLow = peakLow / meanLow;
    const normHigh = peakHigh / meanHigh;
    const isStrongBeat = s % 2 === 0;
    const threshold = difficulty === 'avanzado' ? (isStrongBeat ? 1.05 : 1.45) : isStrongBeat ? 1.15 : 1.75;

    if (Math.max(normLow, normHigh) < threshold && !isStrongBeat) continue;

    const bar = Math.floor(s / 16);
    const posInBar = Math.floor((s % 16) / 2);

    // En cierres de frase con pico fuerte de energía, insertar un obstáculo con margen despejado
    if (
      posInBar === 6 &&
      songTime - lastObsTime >= 5500 &&
      songTime - lastNoteTime >= obsGapMs &&
      (difficulty !== 'basico' || bar % 2 === 1)
    ) {
      const kind = OBSTACLE_CYCLE[obsIdx++ % OBSTACLE_CYCLE.length];
      notes.push({ id: id++, kind, lane: -1, hand: 'left', time: songTime, state: 'pending' });
      lastNoteTime = songTime + obsGapMs * 0.55;
      lastObsTime = songTime;
      continue;
    }

    // En modo Avanzado, si hay un golpe simultáneo muy fuerte de graves y agudos en tiempo fuerte, lanzar par de puños
    if (difficulty === 'avanzado' && isStrongBeat && posInBar === 4 && normHigh > 1.7 && normLow > 1.4) {
      notes.push({ id: id++, kind: 'hand', hand: 'left', lane: laneFor('hand', 'left'), time: songTime, state: 'pending' });
      notes.push({ id: id++, kind: 'hand', hand: 'right', lane: laneFor('hand', 'right'), time: songTime, state: 'pending' });
      lastNoteTime = songTime + beatMs * 0.6;
      continue;
    }

    // Si predomina el golpe grave (bombo/bajo), emitir paso de PIE; si predomina caja/guitarra/synth, emitir PUÑO
    if (normLow > normHigh * 1.12) {
      notes.push({
        id: id++,
        kind: 'foot',
        hand: footSide,
        lane: laneFor('foot', footSide),
        time: songTime,
        state: 'pending',
      });
      footSide = footSide === 'left' ? 'right' : 'left';
    } else {
      notes.push({
        id: id++,
        kind: 'hand',
        hand: handSide,
        lane: laneFor('hand', handSide),
        time: songTime,
        state: 'pending',
      });
      handSide = handSide === 'left' ? 'right' : 'left';
    }
    lastNoteTime = songTime;
  }

  return notes;
}

/**
 * Genera el beatmap sincronizado con la pista y el nivel de dificultad elegido:
 * - `basico`: notas cada 4 beats (~2.0 s), ritmo pausado ideal para empezar.
 * - `intermedio`: notas cada 2 beats (~1.0 s), frases de puños, pies y obstáculos.
 * - `avanzado`: notas en cada beat (~0.45 s) + golpes dobles en acentos fuertes y cambios rápidos.
 */
export function generateBeatmap(bpm = 128, beats = 32, opts: BeatmapOptions = {}): Note[] {
  const beatMs = 60000 / bpm;
  const notes: Note[] = [];
  const withObstacles = opts.obstacles ?? true;
  const difficulty = opts.difficulty ?? 'intermedio';
  const withPairs = opts.pairs ?? difficulty === 'avanzado';
  const songId = opts.songId ?? 'edm-detection-mode';
  const style = SONGS[songId]?.style ?? 'edm';
  let id = 0;
  let obsIdx = 0;
  const push = (kind: 'hand' | 'foot', hand: Hand, time: number) =>
    notes.push({ id: id++, kind, hand, lane: laneFor(kind, hand), time, state: 'pending' });

  // 1. NIVEL BÁSICO: un evento cada 4 beats (pos 0 y pos 4 de cada compás de 8), mucho margen
  if (difficulty === 'basico') {
    for (let b = 0; b < beats; b++) {
      const time = b * beatMs;
      const pos = b % 8;
      const bar = Math.floor(b / 8);
      if (bar === 0 && b < 4) continue;
      if (pos !== 0 && pos !== 4) continue;

      const phrase = bar % 4;
      if (withObstacles && phrase === 3 && pos === 4) {
        const kind = OBSTACLE_CYCLE[obsIdx++ % OBSTACLE_CYCLE.length];
        notes.push({ id: id++, kind, lane: -1, hand: 'left', time, state: 'pending' });
        continue;
      }
      if (phrase === 1) {
        push('foot', pos === 0 ? 'left' : 'right', time);
      } else {
        push('hand', (pos / 4 + bar) % 2 === 0 ? 'left' : 'right', time);
      }
    }
    return notes;
  }

  // 2. NIVEL AVANZADO: ritmo de alta intensidad (notas en cada beat + dobles en acentos)
  if (difficulty === 'avanzado') {
    const step = bpm >= 145 ? 2 : 1; // A >=145 BPM mantener fluidez atlética
    for (let b = 0; b < beats; b++) {
      const time = b * beatMs;
      const pos = b % 8;
      const bar = Math.floor(b / 8);
      if (bar === 0 && b < 2) continue;

      const phrase = bar % 4;
      // Compás de obstáculos dinámicos en pos 2 y pos 6 (dejando 1 beat libre antes y después)
      if (withObstacles && phrase === 3) {
        if (pos === 2 || pos === 6) {
          const kind = OBSTACLE_CYCLE[obsIdx++ % OBSTACLE_CYCLE.length];
          notes.push({ id: id++, kind, lane: -1, hand: 'left', time, state: 'pending' });
        } else if (pos === 0) {
          push('hand', bar % 2 === 0 ? 'left' : 'right', time);
        }
        continue;
      }
      if (withObstacles && phrase === 0 && bar > 0 && pos === 0) continue;

      if (step === 2 && pos % 2 !== 0 && pos !== 3) continue;

      // Golpe doble de puños en el acento central (pos 4) de los compases de manos (0 y 2), dejando pos 5 libre
      if (withPairs && (phrase === 0 || phrase === 2) && pos === 4) {
        push('hand', 'left', time);
        push('hand', 'right', time);
        continue;
      }
      if (withPairs && (phrase === 0 || phrase === 2) && pos === 5) continue;

      if (phrase === 1) {
        // Frase rápida combinando pasos de pie en pares y puños en contratiempo
        if (pos % 2 === 0) {
          push('foot', (pos / 2 + bar) % 2 === 0 ? 'left' : 'right', time);
        } else {
          push('hand', (pos + bar) % 2 === 0 ? 'left' : 'right', time);
        }
      } else if (phrase === 2) {
        if (pos === 2 || pos === 6) {
          push('foot', pos === 2 ? 'left' : 'right', time);
        } else {
          push('hand', b % 2 === 0 ? 'left' : 'right', time);
        }
      } else {
        push('hand', b % 2 === 0 ? 'left' : 'right', time);
      }
    }
    return notes;
  }

  // 3. NIVEL INTERMEDIO (Cardio Rítmico equilibrado)
  // Estilo Hard Rock rápido (Neolith, 145 BPM): acentos de riff en pos 0, 3, 6
  if (style === 'hard-rock') {
    for (let b = 0; b < beats; b++) {
      const time = b * beatMs;
      const pos = b % 8;
      const bar = Math.floor(b / 8);
      if (bar === 0 && b < 3) continue;

      const phrase = bar % 4;
      if (withObstacles && phrase === 3) {
        if (pos === 2 || pos === 6) {
          const kind = OBSTACLE_CYCLE[obsIdx++ % OBSTACLE_CYCLE.length];
          notes.push({ id: id++, kind, lane: -1, hand: 'left', time, state: 'pending' });
        }
        continue;
      }
      if (withObstacles && phrase === 0 && bar > 0 && pos === 0) continue;
      if (pos !== 0 && pos !== 3 && pos !== 6) continue;

      if (phrase === 0 || phrase === 2) {
        // Riffs de guitarra: puños alternados + patada de bombo en pos 6
        if (pos === 6 && phrase === 2) {
          push('foot', bar % 2 === 0 ? 'left' : 'right', time);
        } else {
          push('hand', (pos + bar) % 2 === 0 ? 'left' : 'right', time);
        }
      } else {
        // Compás de batería y bajo: pasos de pie en 0 y 3 + puño en 6
        if (pos === 6) {
          push('hand', bar % 2 === 0 ? 'right' : 'left', time);
        } else {
          push('foot', pos === 0 ? 'left' : 'right', time);
        }
      }
    }
    return notes;
  }

  // Estilo Rock / Guitar Hero (Cool Rock 128 BPM, Hotrock 124 BPM):
  // Enfatiza riffs de puño en backbeats (pos 0, 2, 4, 6) y pasos de bombo en estribillos.
  if (style === 'rock') {
    for (let b = 0; b < beats; b++) {
      const time = b * beatMs;
      const pos = b % 8;
      const bar = Math.floor(b / 8);
      if (bar === 0 && b < 2) continue;
      if (pos % 2 !== 0) continue;

      const phrase = bar % 4;
      if (withObstacles && phrase === 3) {
        if (pos === 2 || pos === 6) {
          const kind = OBSTACLE_CYCLE[obsIdx++ % OBSTACLE_CYCLE.length];
          notes.push({ id: id++, kind, lane: -1, hand: 'left', time, state: 'pending' });
        }
        continue;
      }
      if (withObstacles && phrase === 0 && bar > 0 && pos === 0) continue;

      if (phrase === 0) {
        // Riff de guitarra principal: puños izq / der
        push('hand', (pos / 2) % 2 === 0 ? 'left' : 'right', time);
      } else if (phrase === 1) {
        // Ritmo de batería rock (bombo/caja): alterna mano y pie cada 2 beats
        if (pos < 4) {
          push('foot', pos === 0 ? 'left' : 'right', time);
        } else {
          push('hand', pos === 4 ? 'left' : 'right', time);
        }
      } else {
        // Puente de bajo y guitarra: pasos de pie
        push('foot', (pos / 2 + bar) % 2 === 0 ? 'left' : 'right', time);
      }
    }
    return notes;
  }

  // Estilos EDM / Beat Fever y Synthwave (120–132 BPM):
  for (let b = 0; b < beats; b++) {
    const time = b * beatMs;
    const pos = b % 8;
    const bar = Math.floor(b / 8);

    // En el primer compás (bar 0), dejar los primeros 2 beats libres tras "GO"
    // para que la primera nota nazca desde el fondo del túnel a la vista del jugador.
    if (bar === 0 && b < 2) {
      continue;
    }

    // Espaciado mínimo de 2 beats (1000 ms) entre objetos consecutivos: solo
    // se emiten notas en los tiempos fuertes pares del compás (pos 0, 2, 4, 6).
    if (pos % 2 !== 0) {
      continue;
    }

    const phrase = bar % 4;

    // Compás 3: Frase dedicada a obstáculos volumétricos con 4 beats (2000 ms)
    // de separación limpia (pos 2 y pos 6), igual que en el referente (t0147).
    if (withObstacles && phrase === 3) {
      if (pos === 2 || pos === 6) {
        const kind = OBSTACLE_CYCLE[obsIdx++ % OBSTACLE_CYCLE.length];
        notes.push({ id: id++, kind, lane: -1, hand: 'left', time, state: 'pending' });
      }
      continue;
    }

    // Compás 1: Frase dedicada a pasos de pie (pos 0, 2, 4, 6).
    if (phrase === 1) {
      const side: Hand = (pos / 2 + bar) % 2 === 0 ? 'left' : 'right';
      push('foot', side, time);
      continue;
    }

    // Compás 2: Frase combinada fluida (manos en pos 0 y 2 → pies en pos 4 y 6).
    if (phrase === 2) {
      if (pos < 4) {
        push('hand', pos === 0 ? 'left' : 'right', time);
      } else {
        push('foot', pos === 4 ? 'left' : 'right', time);
      }
      continue;
    }

    // Compás 0 (o sin obstáculos): Frase de puños alternados.
    // Si venimos del compás de obstáculos (bar > 0 y withObstacles), dejar pos 0
    // libre para que haya 4 beats (2000 ms) de túnel despejado tras el último obstáculo.
    if (withObstacles && bar > 0 && pos === 0) {
      continue;
    }
    if (withPairs && pos === 4 && bar > 0) {
      push('hand', 'left', time);
      push('hand', 'right', time);
      continue;
    }
    const handSide: Hand = (pos / 2 + bar) % 2 === 0 ? 'left' : 'right';
    push('hand', handSide, time);
  }
  return notes;
}

export { isObstacle };
