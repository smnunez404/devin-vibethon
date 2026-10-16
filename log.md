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
