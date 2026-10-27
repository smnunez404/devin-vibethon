# Log

Registro append-only de operaciones sobre este proyecto. Añadir entradas nuevas al final.

## 2026-10-15 — Bootstrap de Obsidian

- Se compararon estructuras y ajustes de varios vaults vecinos `*-obsidian`.
- Se creó la estructura `raw/`, `wiki/` y `_templates/` en este proyecto.
- Se añadieron `AGENTS.md`, `CLAUDE.md`, `index.md` y este registro.
- Se habilitaron las reglas de Templater para las nueve categorías de wiki.
- El proyecto estaba vacío al iniciar la configuración; no se inventó contexto funcional.
- La lista de plugins comunitarios se configurará después de definir cuáles están disponibles de forma local, evitando copiar binarios o valores locales de otros vaults.

## 2026-10-15 — Referencia visual y primer lote de recursos de ritmo

- Se abrió STAY ON BEAT #18 de Liam Fitness y se confirmó duración 12:17.
- Se guardaron capturas de navegador en `raw/reference/frames/`: nueve saltos distribuidos al 10–90 %, inicio y una instrucción. Los intentos de búsqueda en buffering se identificaron explícitamente como evidencia no válida para sus nombres temporales.
- Dos intentos de descarga por yt-dlp encontraron HTTP 429/verificación de acceso. El inventario de medios del navegador no ofreció un archivo de video exportable; no se obtuvo el video completo.
- Se documentaron tres entornos, notas de huellas y puños, pads, obstáculos, figura guía y HUD. Se investigaron MediaPipe y perspectiva/niebla/bloom en documentación primaria.
- Se leyó el flujo de producción 3D de `../YAIS-RED/PRODUCCION-3D.md`; no se modificó ese proyecto.
- Se produjo `scripts/build-assets.py`, 77 SVG, `assets/v001/manifest.json` y biblioteca local con búsqueda/filtros/descargas.
- La biblioteca se abrió en navegador y el filtro de fondos mostró los tres estudios. La calidad visual actual es preliminar; faltan análisis denso, recursos complementarios, audio, PNG y fondos animados.
- No se implementaron cámara, tracking, scoring ni gameplay.

## 2026-10-15 — Exportación PNG, interfaz y audio provisional

- El lote creció a 113 SVG con símbolos sueltos, parejas, estelas, destellos, calibración, controles y tarjetas en español.
- Se exportaron 113 PNG mediante resvg. Muestra verificada: RGBA y alfa 0–255.
- Se sintetizaron ocho WAV originales, incluido loop de 16 s a 120 BPM; se integraron controles de audio y descargas PNG en la biblioteca.
- Se documentaron procedencia, formatos, pivote propuesto, secuencia de reconstrucción y límites en `assets/v001/README.md`.
- Se capturó el cierre del video a 726.183 s; se distinguió la captura real de la portada previa a reproducir.
- Se completó la instalación del flujo HyperFrames general-video; los fondos animados siguen pendientes.

## 2026-10-15 — Consolidación de la primera versión del kit

- Se creó un catálogo denso con 147 capturas nominales y seis hojas de contacto. Se revisaron visualmente y se excluyeron las capturas negras del intento `observed-*`.
- El análisis agregó vallas bajas/altas, flechas de esquiva y transiciones entre las tres familias de entorno.
- Se produjeron tres MP4 HyperFrames con perspectiva matemática, 1280 × 720, 30 FPS, ocho segundos y 240 frames. Se revisaron fotogramas decodificados y reproducción en navegador.
- Se refinaron once siluetas continuas y se agregaron vallas, paredes direccionales, panel de resultados y progreso. Se corrigió la orientación de las flechas izquierda/derecha.
- El inventario final contiene 135 recursos lógicos: 124 SVG con 124 PNG, ocho WAV y tres MP4. La auditoría de integridad/alfa/audio/movimiento terminó sin errores.
- Se documentaron inventario, integración futura, procedencia y límites de fidelidad. Las diferencias de costura de los videos son comparables a las diferencias entre frames consecutivos.
- Se mantuvo el alcance de recursos y documentación: sin cámara, tracking, beatmap, scoring ni gameplay.

## 2026-10-15 — Auditoría y paquete de entrega

- Se consolidaron 147 capturas nominales, incluidas las del intervalo inicial que faltaba; el catálogo distingue capturas válidas de intentos fallidos.
- La búsqueda en español de “puños” devolvió 14 recursos. Los tres fondos cargaron con duración de 8 s y sin errores de medio; el primero avanzó durante la prueba de reproducción.
- Se creó un ZIP autónomo con las rutas de todos los recursos del manifiesto y se verificó su integridad. Las capturas de terceros permanecen fuera del ZIP.
- La auditoría de entrega registra qué prueba cada requisito y conserva los límites del muestreo y de fidelidad del kit inicial.

## 2026-10-15 — Handoff para reinicio y cambio de agente

- El usuario indicó que cerrará el entorno, reiniciará la computadora y continuará con otro agente/modelo para comenzar el juego con cámara.
- Se creó `CONTINUAR.md` como punto de entrada canónico, enlazado desde AGENTS, CLAUDE e índice del vault.
- Se preservaron el enlace del video, el objetivo de control corporal, el inventario, las limitaciones de las capturas y el estado real sin aplicación ni tracking implementados.
- Se documentó una propuesta técnica aún no decidida: validar pose de cuerpo completo con cámara real, calibración y una reacción observable antes de ampliar ritmo, acciones, obstáculos, scoring y sesión completa.
- Se creó `wiki/backlog/desarrollo-juego-con-camara.md`. El alcance de esta sesión fue preparar continuidad; no se comenzó la programación del juego.
- Se aclaró que la restricción histórica de solo producir assets corresponde a la fase terminada. Las URLs localhost y los procesos abiertos no deben asumirse activos después del reinicio.

## 2026-10-15 — Incorporación del video original aportado por el usuario

- Se movió el MP4 desde `D:/Descargas Brave/STAY ON BEAT #18 _ Dance Workout _ Immersive Interactive Warm Up (No Equipment).mp4` a `raw/reference/video/stay-on-beat-18-original.mp4` por petición expresa del usuario.
- Tamaño: 314.346.663 bytes. SHA-256 antes y después: `48791ccde20478f5d46775aa672f823f9801bb84de55acc44346e4ba006fa2a7`; el archivo ya no está en Descargas.
- Se guardó metadata técnica del archivo y se referenció desde CONTINUAR, AGENTS, README, índice del vault y ficha de fuente.
- Se aclaró que el bloqueo previo de descarga ya no impide trabajar con el original local. Su extracción precisa y nuevo análisis quedan preparados para la siguiente sesión; no se reanalizó el video ni se comenzó el juego en este traslado.

## 2026-10-15 — Inicio del desarrollo: scaffold y hito 1 (cámara → gesto)

- Se creó `app/` con Vite + TypeScript, sin framework de UI. La documentación del vault y los recursos de producción quedaron intactos.
- Se eligió MediaPipe Pose Landmarker (`@mediapipe/tasks-vision` 1.1.1, `pose_landmarker_full.task`, 33 puntos) con modelo y wasm servidos localmente; la decisión quedó registrada en `wiki/decisiones/0001-stack-web-mediapipe-pose-landmarker.md` con estado propuesta.
- Se implementó el flujo del primer hito: selector de cámara y manejo de permisos/errores, video en espejo, overlay de landmarks con confianza por color, calibración de posición neutral/escala con cuenta atrás, aviso de manos/pies fuera de encuadre, gesto "mano elevada" con histéresis (un disparo por gesto, rearme en neutral) que enciende pads del kit con anillo de impacto y sonido `hit-hand.wav`.
- Middleware de Vite en `app/vite.config.ts` sirve `/assets/*` desde el kit sin duplicar archivos. `app/public/` (wasm y modelo) es regenerable y quedó fuera de versionado.
- Verificación automática del servidor: `tsc --noEmit` sin errores; index, los 8 módulos TS, el modelo, wasm y assets responden 200 en `http://127.0.0.1:5173/`.
- Pendiente de validación humana: conectar/seleccionar la cámara real, calibrar y comprobar el gesto → reacción; medir FPS/latencia observados en el equipo.
- **Validado el mismo día**: el usuario conectó una GENERAL WEBCAM (1b3f:1167). El primer intento denegó permiso desde la vista previa embebida (iframe sin `allow="camera"`); funcionó al abrir `http://127.0.0.1:5173` en pestaña directa. Se corrigió la métrica de FPS (medía trabajo por tick, no intervalo entre frames) y se añadieron pistas de permiso al log.
- Pruebas reales: calibraciones con pose en 90–100% de frames; manos hasta 99%, pies hasta 66% (límite típico del modelo). Se observaron ráfagas de disparos falsos con muñeca de baja visibilidad → se añadió antirrebote (gesto sostenido 100 ms + refractario 300 ms), verificado sin falsos positivos posteriores.
- El usuario oscila la distancia a la cámara (hombros 0.12–0.30); a distancia correcta manos ~98% y pies ~60%. Hito 1 cerrado: cámara → pose → calibración → gesto → reacción única por gesto.

## 2026-10-15 — Acciones ampliadas y primera escena jugable

- Se reasignaron carriles con sentido de juego: `[pie izq | mano izq | mano der | pie der]` = cian/rosa/púrpura/amarillo.
- Nuevas acciones corporales (`app/src/body/`): pie levantado (tobillo sobre baseline calibrado), salto (ambos tobillos arriba), y estado sostenido por frame en `state.ts`: esquiva izq./der. (centro de torso) y agacharse (hombros bajo su altura calibrada).
- Módulo `app/src/rhythm/`: reloj de canción independiente de la inferencia (`clock.ts` con pausa), beatmap provisional de 32 beats a 120 BPM (`beatmap.ts`) con manos alternas, pies y 4 obstáculos (pared izq./der., valla de agacharse, valla de salto), ventanas de juicio PERFECT/GREAT/NICE/MISS (`judgement.ts`).
- Escena de juego (`scene.ts`): fondo `loop-fairground.mp4` en modo juego con la cámara reducida a PiP espejo con esqueleto, notas en perspectiva hacia los pads, obstáculos centrados en la pista, silueta guía del próximo obstáculo, barra de progreso, combo con dígitos del kit, sellos de valoración, panel de resultados.
- Flujo: calibrar → Jugar (cuenta atrás) → sesión de 16 s → resultados → reintento. Pausa con Esc. Sonidos: hit por extremidad, miss, combo cada 8, cierre de sesión.
- Los obstáculos se juzgan por estado corporal sostenido en la ventana; saltos y golpes por evento con `rate(delta)`. Pendiente: puñetazo hacia cámara (z de landmarks, experimental), beatmaps más largos, selección de escenario/canción y medición real de FPS/latencia en sesión completa.

## 2026-10-15 — Prototipo completo y evidencia del MP4 original

- Se extrajeron con `.tools/media/bin/ffmpeg.exe` 11 frames a tiempos exactos y dos tiras densas (2 fps × 6 s, t=60 y t=300) del MP4 original a `raw/reference/mp4-frames/`. Confirman el diseño: tarjetas de puño elevadas rosa/cian, pads frontales de borde coloreado, panel guía con silueta a la izquierda, COMBO y sello inclinado arriba a la derecha.
- `PunchDetector` (experimental): muñeca mucho más cercana a la cámara que el hombro en z a altura de pecho; comparte carril con mano elevada. Pendiente de validar por ruido de z.
- Beatmap ampliable: 32 beats (corta) u 64 beats (normal), pares de puños simultáneos cada segundo compás en la versión larga, obstáculo rotando al final de cada compás de 8 (pared izq./der., agacharse, salto).
- Selector de escenario (Feria/Diamantes/Engranajes → los tres loops MP4) y de duración en el panel; el fondo se carga al iniciar la sesión.
- Prototipo funcional completo pendiente de la sesión de calibración y prueba en cámara real del usuario: ajuste de umbrales (esquiva/agacharse/puñetazo), medición de FPS e inferencia, y revisión de sincronización audio↔juicio.

## 2026-10-15 — Publicación web (GitHub Pages) + onboarding

- App servida desde `app/public` (assets copiados del kit, modelo y wasm incluidos); ya no depende del middleware de dev en producción.
- Pantalla de inicio con botón único guiado por estado (cámara → calibrar → jugar → rejugar) e instrucciones de 3 pasos.
- `vite.config.ts`: `VITE_BASE` para base path configurable; rutas de assets/modelo/wasm ahora usan `import.meta.env.BASE_URL` (compatibles con subruta).
- Repo creado en GitHub (`smnunez404/devin-vibethon`) y `dist` publicado en rama `gh-pages` con base `/devin-vibethon/`.
- **Verificado:** https://smnunez404.github.io/devin-vibethon/ → index, bundle JS, modelo (9,4 MB), wasm (13,5 MB), WAV y MP4 de fondo responden 200.
- `raw/` excluido del versionado (MP4 de 314 MB > límite de GitHub); `vercel.json` añadido en `app/` para despliegue futuro en Vercel (requiere cuenta/auth del usuario).
- Pendiente: calibración fina de umbrales en cámara real y sincronía audio↔gesto.

## 2026-10-15 — Guía de posicionamiento en cámara

- `scene.ts`: nueva capa `drawPositionGuide` visible con cámara a pantalla completa (estados live/calibrating/ready): zona delimitada con esquinas tipo viewfinder, silueta fantasma de pose neutra y marcas CABEZA/MANO/MANO/PIE/PIE que pasan a verde al encajar el landmark correspondiente (tolerancia por radio); mensaje de estado "POSICIÓN CORRECTA" o instrucción de ajuste.
- Redesplegado en GitHub Pages.
- Corrección (revisión): las marcas de manos/pies comprobaban el landmark del lado opuesto (índices anatómicos intercambiados respecto a las coords de imagen), así que nunca pasaban a verde en una pose natural. Ahora usan `LM.*` con el lado correcto (MANO/PIE IZQ-DER) y la tolerancia se evalúa en píxeles para que el círculo dibujado sea el área real de aceptación.
- Despliegue de la corrección: `main` pusheado (`8464aa5`) y `app/dist` republicado en `gh-pages` vía worktree (commits `32557fe` + `d14a4a2`, incluye limpieza del bundle obsoleto). Nota: `git subtree push` no sirve aquí porque `app/dist` está ignorado y no tiene historial que dividir.

## 2026-10-21 — Auditoría contra el MP4 original, silueta en vivo con bordes, geometría 3D y pista electrónica sincronizada

- Se extrajeron fotogramas a resolución completa (`1280×720`) de `raw/reference/video/stay-on-beat-18-original.mp4` (`raw/reference/mp4-frames/audit-t*.jpg`) para auditar cada componente frente al referente (`STAY ON BEAT #18`).
- **Panel de silueta en tiempo real (`app/src/render/scene.ts`)**: se reemplazaron los dos cuadros laterales separados por un único panel vertical a la izquierda (`drawLiveSilhouettePanel`) que muestra el movimiento real del jugador captado por cámara con filtro oscuro y silueta humana negra de borde blanco continuo (composición anatómica en 2 pasadas sin costuras internas + suavizado exponencial de los 33 puntos de MediaPipe), además de aviso y guía traslúcida cuando se aproxima un obstáculo.
- **Pista, receptores 3D, notas y obstáculos volumétricos (`app/src/render/scene.ts`)**:
  - Pista negra trapezoidal re-alineada matemáticamente con los 4 receptores frontales y rieles de neón cian (izquierda) y magenta (derecha).
  - Receptores con grosor frontal 3D (bisel vertical), halo en pista y encendido/parpadeo inmediato en el mismo frame en que cualquier nota cruza la línea inferior.
  - Paredes (`wall-left`, `wall-right`) y vallas (`duck`, `jump`) proyectadas como prismas 3D desde el punto de fuga con caras translúcidas, aspa trasera, refuerzos diagonales y cheurones luminosos (`< <`, `> >`, `∨ ∨ ∨`, `∧ ∧ ∧`), ubicando la pared en el lado bloqueado opuesto hacia el que indican las flechas de esquiva.
  - Notas de puño como bloques 3D con cola extruida hacia el punto de fuga e icono de puño negro en alto contraste; notas de pie como baldosas sólidas de neón en perspectiva con huella negra nítida; ondas elípticas y fragmentos cúbicos al impacto.
  - HUD alineado al referente: dígitos blancos grandes arriba, etiqueta `COMBO` debajo, sello inclinado (`NICE` / `GREAT` / `PERFECT` / `AWESOME` / `UNSTOPPABLE` / `MISS`) bajo el combo y barra arcoíris de progreso en el borde inferior de la pantalla.
- **Pista electrónica libre de derechos y sincronía rítmica (`scripts/build-audio.py`, `app/src/rhythm/clock.ts`, `app/src/rhythm/beatmap.ts`, `app/src/body/`)**:
  - Se sintetizó una nueva pista electrónica cardio completa de 32 s (64 beats a 120 BPM) en Do menor (`Cm – Ab – Eb – Bb`) con kick 4-on-the-floor, clap en 2 y 4, hi-hats en semicorcheas, bajo con bombeo sidechain acentuado en pasos de pie (`pos 2 y 6`), acordes supersaw/stabs en golpes dobles (`pos 4`), arpegio electrónico y riser/drop en obstáculos (`pos 5–7`), compensando exactamente los 4 beats (`2000 ms`) del lead-in para que `songTime = 0` caiga en el beat 1 del compás 1.
  - `SongClock` interpola suavemente entre actualizaciones de `audio.currentTime` sin perder el anclaje al loop de audio y usa `wallTs` real en `toSongTime`.
  - Detectores corporales ajustados con menor latencia (`HOLD_MS = 45 ms`), respaldo de rodilla para pasos de pie y detección de salto tanto por tobillos como por elevación de torso/hombros.

## 2026-10-21 — Controles de pausa/reanudar/reiniciar/salir y recorrido visible de notas desde el fondo del túnel

- **Controles de pausa y sesión (`app/index.html`, `app/src/style.css`, `app/src/main.ts`)**:
  - Se añadieron botones visibles en pantalla durante la partida (`⏸ Pausar`, `↻ Reiniciar`, `⏹ Salir`) y un menú superpuesto de pausa (`#pause-card`) con acciones `▶ Reanudar`, `↻ Reiniciar canción` y `⏹ Salir al menú`.
  - Atajos de teclado activos durante el juego: `Espacio`, `P` o `Esc`. Mientras el juego está en pausa se congelan el reloj, el video de fondo, la evaluación de notas y los detectores de gestos.
- **Aparición progresiva desde el fondo del túnel (`app/src/render/scene.ts`, `app/src/main.ts`, `app/src/rhythm/clock.ts`, `app/src/rhythm/beatmap.ts`)**:
  - Se amplió el tiempo de recorrido a `TRAVEL_MS = 2800 ms` y se implementó una proyección exponencial continua `depthAt(pRaw) = tunnelMinD^(1 - pRaw)` (`tunnelMinD = 0.14`) con grosor temporal constante tanto en la cara frontal como trasera de cada bloque, baldosa y obstáculo. De este modo la velocidad en pantalla crece proporcionalmente a la profundidad (`dd/dp ∝ d`) incluso al cruzar el pad (`pRaw > 1`), eliminando por completo el frenado al final y haciendo matemáticamente imposible que el objeto de atrás alcance o solape al de adelante.
  - Se estructuró `generateBeatmap` en frases dedicadas de un solo objeto a la vez (compás de puños, compás de pies, compás combinado mano→pie y compás de obstáculos con `2000 ms` de margen libre antes y después), sin pares simultáneos por defecto ni mezcla de familias encima de los obstáculos.
  - Se movió el bucle de evaluación/miss de notas fuera de `if (frame)` en `main.ts` para ejecutarse a 60/120 FPS y se eliminaron los sellos de baldosas/puños estáticos sobre los pads.
  - **Sincronización exacta de los 4 carriles (`drawHandBlock`, `handTargetCenter`)**: los bloques de puño (`lane 1` rosa y `lane 2` lila) ahora viajan apoyados directamente sobre la proyección en perspectiva de su propio carril (`pad.x + pad.w / 2`, `pad.y + pad.h * 0.72`) desde el fondo del túnel hasta el pad receptor exacto que iluminan al llegar, evitando que se vieran desplazados sobre los carriles exteriores 0 y 3.
  - **Mini-pista con 4 carriles y 4 teclas en el panel de silueta en vivo (`drawLiveSilhouettePanel`, `renderBodySilhouetteTwoPass`)**: se añadieron las divisiones verticales de los 4 carriles y las 4 teclas/pads inferiores (cian, rosa, lila, amarillo) a los pies de la silueta en tiempo real, iluminando por adelantado el carril/tecla objetivo (anillo de puño, marca de pie, carriles seguros vs. bloqueados en esquivas y barras de altura en agacharse/saltar) y anclando la silueta al suelo de las teclas para reflejar desplazamientos laterales, pasos, saltos y agachadas en vivo.
  - **Bloques de puño flotando arriba en el túnel (`drawHandBlock`, `handTargetCenter`)**: se restauró la altura aérea de llegada de los puños (`0.36 * H`, idéntica a `audit-t0187` y `t0369` del referente) manteniendo su centro horizontal alineado con su propio pad receptor (`r.x + r.w / 2`).
  - **Biblioteca de 24 canciones reales de estudio libres de derechos + Importador automático de MP3 propios (`assets/v001/audio/*.mp3`, `app/src/rhythm/beatmap.ts`, `app/index.html`, `app/src/main.ts`)**:
    - Se amplió la biblioteca integrada a **24 pistas de estudio** (licencia Creative Commons CC-BY 4.0, *Incompetech / Kevin MacLeod*) con **12 canciones en la categoría Electro / Beat Fever / Synth-Pop** (*EDM Detection Mode*, *Laserpack*, *Raving Energy*, *Raving Energy Overdrive*, *Realizer*, *Brain Dance*, *Voltaic*, *Eighties Action*, *Kick Shock*, *Shiny Tech*, *Club Diver*, *Neon Laser Horizon*) y **12 canciones en la categoría Rock / Guitar Hero / Indie-Punk** (*Cool Rock*, *Hotrock*, *Neolith*, *Nonstop*, *Harmful or Fatal*, *Professor Umlaut*, *Metalmania*, *Sax, Rock & Roll*, *Riptide*, *Rocket Power*, *Cool Hard Facts*, *Chipper*), todas alineadas por *onset detection* para que el beat 1 caiga exactamente al terminar la cuenta atrás (`2.000 s`).
    - Se añadió el botón **`📂 + Importar MP3 / Canción propia`** con análisis espectral de onda completa en Web Audio API (`analyzeImportedAudioFile` + `generateCustomAudioBeatmap` en `app/src/rhythm/beatmap.ts`), separando en el dominio temporal la banda grave (`< 150 Hz`: bombo y bajo → pasos de **pie**) de la banda media/aguda (`> 200 Hz`: caja, guitarra, voz y sintetizador → golpes de **puño**) y los picos de energía (drops → **obstáculos**), además del selector de **Nivel de dificultad (`Básico`, `Intermedio`, `Avanzado`)** que ajusta tanto la velocidad de viaje (`3100 ms`, `2600 ms`, `2050 ms`) como la densidad rítmica (cada 4 beats, cada 2 beats o en cada beat con golpes dobles).
  - **Rediseño UX/UI estilo plataforma Arcade a pantalla completa (`app/index.html`, `app/src/style.css`, `app/src/main.ts`)**:
    - Escenario inmersivo a pantalla completa (`16:9` centrado con estética neón glassmórfica) eliminando la columna fija derecha de depuración.
    - **Barra superior flotante**: insignia `VIBETHON`, píldora interactiva de la canción/BPM/dificultad actual y accesos rápidos a `🎵 Biblioteca`, `🎯 Calibrar`, `▶ Jugar` y `⚙️ Ajustes`.
    - **Lobby interactivo (`#start-card`)**: permite ver la pista activa, abrir la biblioteca o importar MP3, y elegir con un clic el **Nivel de dificultad** (`🟢 Básico`, `🟡 Intermedio`, `🔴 Avanzado`), **Escenario** (`🎡 Feria`, `💎 Diamantes`, `⚙️ Engranajes`) y **Duración** (`16s`, `32s`, `10m`, `30m`).
    - **Modal de Biblioteca Musical (`#library-modal`)**: explorador visual de tarjetas con pestañas por género (`Todas`, `⚡ Electro / Beat Fever`, `🎸 Rock / Guitar Hero`, `★ Mis MP3 Importados`), buscador en tiempo real, botón de **preescucha (`🔊 Previa`)** en cada tarjeta y botón destacado de importación de MP3/WAV.
    - **Drawer lateral deslizable de Configuración y Diagnóstico (`#panel`)**: oculto por defecto y accesible desde `⚙️ Ajustes`.
  - `SongClock` ahora usa un reloj continuo a 60/120 FPS con corrección suave de deriva (PLL) respecto a `audio.currentTime`, eliminando micro-saltos cuando el navegador actualiza `currentTime` en intervalos largos.
