---
type: arquitectura
tags: [ritmo, cardio, assets]
created: 2026-10-15
updated: 2026-10-15
sources: ["https://www.youtube.com/watch?v=FHe66Pc4xbU", "raw/reference/frames/"]
status: borrador
---

# Referencia visual y alcance

> Esta nota describe el encargo inicial de análisis y assets. Para el alcance vigente de **desarrollo del juego con cámara**, leer primero [[CONTINUAR]]. La restricción de no programar que aparece abajo pertenecía a la fase anterior.

> Actualización de fuente: el usuario ya aportó el MP4 original, disponible en `raw/reference/video/stay-on-beat-18-original.mp4`. Las limitaciones de descarga descritas aquí son históricas; usar el original local para un nuevo análisis preciso. Ver [[wiki/fuentes/video-stay-on-beat-18]].

## Encargo confirmado

Preparar un kit gráfico y sonoro inicial para un futuro juego de ritmo/cardio controlado con manos, pies y cuerpo frente a una cámara. Analizar la referencia, preservar capturas, documentar los elementos, producir recursos editables y presentarlos en una biblioteca local. **No implementar el videojuego**, la cámara, el seguimiento corporal, el juicio de notas ni una sesión jugable.

## Evidencia observada

Referencia: *STAY ON BEAT #18 | Dance Workout | Immersive Interactive Warm Up (No Equipment)*, canal Liam Fitness. Duración mostrada por el reproductor: 12:17. Inspección mediante navegador; la descarga con yt-dlp devolvió HTTP 429 y verificación de acceso. No se dispone todavía del archivo completo ni se ha hecho una extracción exhaustiva de fotogramas.

Las capturas `percent10` a `percent90` en `raw/reference/frames/` corresponden a saltos del reproductor al 10–90 %. Son capturas de página, con marco del navegador, no frames originales del archivo. Los archivos `t0071`, `t0131`, `t0191` y `t0251` son intentos fallidos de búsqueda: quedaron en buffering en 0:31 y **no prueban esos tiempos**. Preservarlos como diagnóstico; excluirlos del análisis y de comparaciones visuales.

| Tiempo aproximado | Evidencia | Elementos visibles |
| --- | --- | --- |
| 0:11 | t0011.jpg | Instrucción blanca sobre negro, figura de contorno blanco, líneas radiales |
| 1:13 | percent10.jpg | Arcos multicolor, norias laterales, carpas facetadas, reflejos, pista negra, cuatro pads, partículas, figura guía, combo 74 |
| 2:27 | percent20.jpg | Misma feria, pared translúcida ámbar con contorno blanco, figura con un brazo elevado, combo 254 |
| 3:41 | percent30.jpg | Nota plana cian con huella negra, figura de marcha, combo 428 |
| 4:55 | percent40.jpg | Túnel de contornos ondulados, diamantes de alambre, pared roja, pads magenta/cian, combo 41 |
| 6:08 | percent50.jpg | Puños frontales en tarjetas elevadas, figura con ambos brazos flexionados, combo 232 |
| 7:22 | percent60.jpg | Pareja de puños próximos, figura inclinada con brazos arriba, combo 409 |
| 8:36 | percent70.jpg | Nuevo túnel con arcos dentados, engranajes laterales, tarjetas amarilla/magenta, combo 6 |
| 9:50 | percent80.jpg | Puño amarillo individual, figuras guía alternadas, combo 141 |
| 11:04 | percent90.jpg | Túnel dentado, cuatro pads oscuros, notas pequeñas lejanas, combo 352 |

## Descomposición visual

1. Fondo oscuro de alto contraste, suelo con reflejos y cielo con partículas.
2. Repetición de módulos de escenario hacia un punto de fuga central.
3. Pista negra trapezoidal con bordes cian y magenta, horizonte hacia el centro.
4. Cuatro receptores rectangulares en primer plano, con grosor oscuro y cara iluminable.
5. Notas de pies sobre el suelo, notas de puños elevadas y combinaciones simultáneas.
6. Obstáculos tipo pared/volumen translúcido con bordes muy brillantes.
7. Anillos de impacto y fragmentos cúbicos del color de la nota.
8. Panel lateral negro, borde gris, figura humana negra con contorno blanco.
9. Contador grande blanco arriba a la derecha y etiqueta COMBO pequeña; sellos inclinados NICE, GREAT, AWESOME y UNSTOPPABLE.
10. Instrucciones iniciales y transiciones entre secciones.

Los colores observados cambian según sección y elemento. No asignar todavía un significado universal izquierda/derecha a cada color: requiere revisar secuencias cercanas completas. Tampoco deducir BPM, hit windows o reglas de puntuación de capturas aisladas.

## Cámara y seguimiento

Un video de YouTube reproduce la misma animación para cualquier espectador. Ni el título ni la figura guía prueban que el original ejecute estimación de poses. Para nuestra adaptación, una opción técnica es Pose Landmarker de MediaPipe: detecta 33 puntos corporales, incluyendo muñecas, tobillos, talones y puntas de pies. Es una propuesta futura, no está implementada ni evaluada en este proyecto.

Referencia primaria: [MediaPipe Pose Landmarker para web](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js). Será necesario calibrar cuerpo completo, posición de cámara, efecto espejo, visibilidad de articulaciones, oclusión y latencia antes de establecer reglas de acierto. Las notas gráficas no necesitan contener un modelo de reconocimiento.

## Profundidad matemática

Para assets planos puede proyectarse una pieza mediante `x = cx + f·X/Z`, `y = cy + f·Y/Z`, `escala = f/Z`; la niebla reduce contraste con distancia. Repetir arcos en Z y renderizarlos genera un fondo con profundidad sin modelado manual. Brillo: núcleo claro más halo suave; reflejo: duplicación vertical atenuada sobre el suelo. Un MP4 o GIF de ese movimiento es suficiente como fondo del prototipo, mientras notas y receptores permanecen como capas transparentes independientes.

Referencias primarias: [cámara de perspectiva](https://threejs.org/docs/pages/PerspectiveCamera.html), [niebla](https://threejs.org/manual/pages/fog.html), [postprocesado y bloom](https://threejs.org/manual/pages/post-processing.html). Se revisó `../YAIS-RED/PRODUCCION-3D.md`: su flujo produce BLEND/GLB y renders en background. Por ahora no es necesario importar su entorno ni sus assets.

## Relaciones

- [[index]]
- [[wiki/backlog/produccion-assets-ritmo]]
- [[wiki/fuentes/video-stay-on-beat-18]]
