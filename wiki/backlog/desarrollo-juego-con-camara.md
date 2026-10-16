---
type: backlog
tags: [desarrollo, ritmo, camara, pose]
created: 2026-10-15
updated: 2026-10-15
sources: ["CONTINUAR.md", "assets/v001/manifest.json"]
status: pendiente
---

# Desarrollo del juego con cámara

El objetivo y el orden de trabajo completos están en [[CONTINUAR]]. La restricción histórica de producir solo assets terminó con esa fase; el usuario quiere comenzar el desarrollo en la próxima sesión.

## Hitos

- [x] Revisar el original local `raw/reference/video/stay-on-beat-18-original.mp4` y extraer evidencia temporal precisa para contrastar el análisis de capturas anterior. → `raw/reference/mp4-frames/`: 11 frames a tiempos exactos + 2 tiras densas (2 fps × 6 s en t=60 y t=300). Confirma layout: tarjetas de puño elevadas rosa/cian, pads frontales, panel guía izq., COMBO+sello arriba der.
- [x] Elegir y documentar stack y modelo con documentación vigente y restricciones del equipo. → `wiki/decisiones/0001` (Vite+TS, Pose Landmarker full, modelo local).
- [x] Crear aplicación propia conservando vault, kit y fuentes de producción. → `app/`, assets servidos vía middleware sin duplicar.
- [x] Obtener cámara real: selección, permisos, errores y recuperación. → Verificado 2026-10-15 con GENERAL WEBCAM: selector con etiquetas, permiso denegado/concedido, mensajes de error.
- [x] Integrar inferencia de cuerpo completo con landmarks, confianza y timestamps observables. → Pose en 90–100% de frames, overlay con confianza por punto.
- [x] Calibrar posición neutral, escala, espejo y encuadre de manos/pies. → Calibración 60 frames con cuenta atrás; aviso de baja visibilidad. Pies observados ≤66% (límite típico del modelo, no del encuadre).
- [x] Probar gesto real → evento único → pad/efecto visible. → "Mano elevada" dispara pads izq./der. con anillo+sonido; histéresis + antirrebote 100 ms/300 ms tras observar ráfagas.
- [x] Ampliar acciones de manos, pies, simultáneas, esquiva, agacharse y salto. → Detectores en `app/src/body/` (mano, pie, salto, puñetazo experimental por z; esquiva/agacharse como estado sostenido). Umbrales pendientes de ajuste fino en la prueba final.
- [x] Crear beatmap propio y reloj de audio; validar sincronización y latencia. → `app/src/rhythm/` (reloj con pausa, beatmap 32/64 beats a 120 BPM, juicio P/G/N/M). Falta medir latencia end-to-end real.
- [x] Integrar notas en perspectiva, pads, obstáculos y fondos existentes. → Escena con fondo MP4 + PiP de cámara, notas/obstáculos en perspectiva, silueta guía.
- [x] Implementar ventanas de juicio, aciertos/fallos, combo y resultados sin duplicados. → Ventanas ±100/180/280 ms, combo con dígitos del kit, panel de resultados.
- [x] Construir preparación, calibración, selección, cuenta atrás, pausa y cierre/reintento. → Selector de escenario/duración, cuenta atrás, Esc=pausa, resultados y reintento.
- [ ] Completar repertorio, dificultad, escenarios y pulido visual/sonoro.
- [ ] Verificar una sesión completa con cámara real del usuario y documentar resultados.

## Criterio de cierre global

Una persona frente a su cámara puede completar una sesión de ritmo usando manos, pies y movimientos corporales, con notas/obstáculos sincronizados, efectos, juicio y resultados. El primer visor de tracking o una simulación sin cámara no cierra este objetivo.

Los umbrales, ventanas, stack, modelo y canciones definitivas siguen por decidir. Los assets iniciales y el audio provisional ya existen. No hay aplicación, modelo integrado ni prueba de cámara realizada al crear este backlog.

## Relaciones

- [[CONTINUAR]]
- [[wiki/arquitectura/inventario-y-uso-assets-v001]]
- [[index]]
