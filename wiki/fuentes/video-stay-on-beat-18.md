---
type: fuente
tags: [video, referencia]
created: 2026-10-15
updated: 2026-10-15
sources: ["https://www.youtube.com/watch?v=FHe66Pc4xbU", "raw/reference/video/stay-on-beat-18-original.mp4"]
status: revisado
---

# Video STAY ON BEAT 18

## Original local disponible — actualización posterior al handoff

El usuario descargó el video original de YouTube y pidió moverlo desde Descargas al proyecto. Archivo canónico: **[stay-on-beat-18-original.mp4](../../raw/reference/video/stay-on-beat-18-original.mp4)**, en `raw/reference/video/`. Está disponible para que cualquier agente lo vea, revise, extraiga frames y vuelva a analizar el referente.

- Nombre recibido: `STAY ON BEAT #18 _ Dance Workout _ Immersive Interactive Warm Up (No Equipment).mp4`.
- Procedencia: `D:/Descargas Brave/`, aportado por el usuario como original descargado de YouTube.
- Tamaño: 314.346.663 bytes.
- SHA-256: `48791ccde20478f5d46775aa672f823f9801bb84de55acc44346e4ba006fa2a7`.
- Hash antes/después del traslado: coincidente; archivo retirado de Descargas mediante movimiento solicitado.
- Metadata técnica obtenida del archivo: `raw/reference/video/stay-on-beat-18-original.metadata.json`.
- Características comprobadas: H.264, 1280 × 720, 60 FPS, duración de contenedor 737.931 s; audio AAC estéreo, 44.100 Hz.

La disponibilidad del MP4 **supera el bloqueo histórico de descarga** descrito abajo. El análisis anterior continúa siendo un muestreo de navegador; todavía no se ha reextraído ni reanalizado este archivo. Usarlo para obtener frames/timestamps precisos y validar el repertorio antes de implementar el juego. Conservarlo como fuente en `raw/` y generar derivados en otras rutas; no sobrescribir el original ni confundirlo con los tres fondos propios del kit.

## Historial del análisis previo a recibir el archivo

Referencia pública proporcionada por el usuario: https://www.youtube.com/watch?v=FHe66Pc4xbU. Título, canal Liam Fitness y duración 12:17 observados directamente en navegador. Las cifras de vistas y seguidores son temporales y no forman parte de los requisitos.

Capturas preservadas en `raw/reference/frames/`. Solo los archivos `percent10.jpg` a `percent90.jpg`, `t0011.jpg` y `browser-inicio.jpg` contienen observaciones utilizables; las capturas con búsqueda fallida están explicadas en [[wiki/arquitectura/referencia-visual-y-alcance]].

La lectura web fue limitada por throttling; dos intentos de descarga con yt-dlp encontraron HTTP 429 y comprobación de acceso. `raw/video-metadata.json` quedó vacío: **no es metadata válida**. No se han extraído audio ni frames originales del archivo completo.

Actualización de cierre: `final-real.jpg` fue capturada con el video pausado en **726.183 segundos**, duración DOM **737.881 segundos**, `readyState=4`. Muestra salida con líneas radiales y recomendaciones de YouTube. `t0720-confirmed.jpg` es la imagen de portada mostrada antes de iniciar la reproducción; el nombre solo identifica el tiempo solicitado y no acredita un fotograma real de 12:00. Excluir esa imagen de análisis temporal. `raw/reference/contact-sheet.jpg` agrupa las nueve capturas porcentuales.

La inspección posterior densificó el muestreo a 147 capturas utilizables (`detail-*.jpg`), consultables en `raw/reference/index.html` y `dense-index.json`, agrupadas en seis hojas `dense-contact-01` a `06`. Se revisaron las tres secciones, instrucciones, paredes, vallas bajas/altas, puños, pies y cierre. Los tiempos son nominales del DOM: la imagen visible puede retrasarse durante un seek, por lo que no hay precisión al fotograma ni base para un beatmap.

Los cinco archivos `observed-*.jpg` y su hoja `observed-sheet.jpg` capturaron negro pese a `readyState=4`: son evidencia fallida y quedan excluidos del catálogo válido. La descarga desde el elemento `video` del navegador también falló, pues el reproductor usa un medio blob/stream, no un archivo exportable detectado.

Las capturas se conservan como referencia de análisis; los recursos del kit se reconstruyen por separado y deben etiquetarse como interpretación propia, no como archivos originales del canal.

## Relaciones

- [[wiki/arquitectura/referencia-visual-y-alcance]]
- [[index]]
