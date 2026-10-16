---
type: decision
tags: [stack, pose, mediapipe, vite, typescript]
created: 2026-10-15
updated: 2026-10-15
sources: ["CONTINUAR.md", "https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js"]
status: propuesta
---

# 0001 — Stack web local y MediaPipe Pose Landmarker

## Contexto

El handoff ([[CONTINUAR]]) dejó abiertas las decisiones de stack y modelo, proponiendo como hipótesis una aplicación web local con TypeScript, captura de cámara por APIs del navegador, estimación de pose de cuerpo completo y render 2D. El primer hito exige comprobar cámara → landmarks → calibración → gesto → reacción con el equipo real.

## Decisión

- **Aplicación web local** en `app/` con **Vite + TypeScript**, sin framework de UI (DOM directo para el hito 1; React u otro solo si los menús lo justifican).
- **Captura**: `getUserMedia` con selector de dispositivo, manejo de permiso denegado / cámara ausente / ocupada / perdida.
- **Modelo**: `@mediapipe/tasks-vision` **Pose Landmarker** (33 puntos: muñecas, tobillos, talones, puntas de pies), archivo `pose_landmarker_full.task` servido localmente desde `app/public/models/`; wasm copiado a `app/public/wasm/` desde el paquete npm. Nada se descarga en ejecución.
- **Render**: Canvas 2D sobre `<canvas>` 1280×720, video en espejo, overlay de landmarks con confianza por color, pads/efectos del kit `assets/v001` servidos por middleware de Vite en `/assets/*` sin duplicar archivos.
- **Capas separadas** según el handoff: `capture/` (cámara), `pose/` (inferencia), `body/` (calibración y gestos), `render/` (presentación). Esto permite reinyectar landmarks grabados/sintéticos más adelante.

## Alternativas consideradas

- MoveNet (TensorFlow.js): alternativa ligera, pero Pose Landmarker cubre talones/puntas de pies y es la candidata ya documentada. Comparar solo si el rendimiento real lo exige.
- Render 3D (Three.js): innecesario para el hito; los fondos MP4 del kit ya contienen la pista.
- App de escritorio: la web local reduce fricción; queda abierto para el empaquetado final.

## Consecuencias

- La inferencia corre en GPU (delegate) en el navegador; el reloj del juego nunca se derivará de la frecuencia de inferencia.
- Los binarios de `app/public/` son regenerables y están excluidos de versionado (`.gitignore`).
- El proyecto no es un repo git todavía; el `.gitignore` queda listo para cuando se inicialice.

## Estado de aprobación

Propuesta ejecutada para el hito 1. Confirmar o revisar cuando existan mediciones reales de latencia/fps en el equipo del usuario.
