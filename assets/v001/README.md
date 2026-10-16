# Kit gráfico y sonoro — v001

Abrir `index.html` para previsualizar los recursos. También funciona servido por HTTP local. La biblioteca es un catálogo y no contiene gameplay ni captura de cámara.

## Formatos

- SVG: fuentes vectoriales editables. Dimensiones y rutas en `manifest.json`.
- PNG: exportaciones sRGB a la resolución nominal del SVG. Los elementos mantienen alfa; los fondos son opacos.
- WAV: PCM mono, 44.100 Hz y 16 bits. Efectos y loop sintetizados para este proyecto.
- MP4: tres fondos de ocho segundos, 1280 × 720 a 30 FPS, sin sonido. Incluyen pista; no incluyen notas, pads ni HUD.

Los pivotes propuestos son el centro de la imagen `[0.5, 0.5]`. La cara útil de algunas placas ocupa solo parte del lienzo: no usar el rectángulo del archivo como hitbox. Definir hitboxes durante la implementación futura y calibrarlas por separado.

## Uso y procedencia

El arte se construye con geometría vectorial propia. La referencia de estilo es STAY ON BEAT #18 de Liam Fitness, https://www.youtube.com/watch?v=FHe66Pc4xbU. Las capturas del video quedan en `raw/reference/frames/` como evidencia de análisis, fuera del kit de distribución. No se incluyeron música ni imágenes recortadas del canal dentro de los assets.

Los WAV son síntesis determinista original de `scripts/build-audio.py`. El loop provisional tiene 120 BPM, 4/4, ocho compases y 16 segundos; no reproduce la música del video. No equivale a una composición musical final.

Las etiquetas de HUD y cifras SVG usan fuentes del sistema. Los PNG congelan la apariencia renderizada, evitando que cambie en otro equipo. La selección final de tipografía y su licencia para distribución sigue pendiente.

## Reconstruir

1. `python scripts/build-assets.py` — regenera SVG y manifiesto base.
2. `python scripts/supplement-assets.py` — agrega interfaz, vallas y señales.
3. `python scripts/refine-guides.py` — une siluetas; requiere Shapely.
4. `node scripts/export-png.cjs` — rasteriza SVG; requiere `.tools/svg/node_modules/@resvg/resvg-js`.
5. `python scripts/build-audio.py` — agrega ocho WAV y sus metadatos.
6. `scripts/render-tunnels.ps1` — valida y exporta las tres composiciones HyperFrames; requiere sus proyectos en `videos/` y herramientas FFmpeg/FFprobe locales.
7. `python scripts/register-motion.py` — registra los MP4 y genera sus posters.
8. `python scripts/audit-kit.py` — verifica integridad, alfa, audio y movimiento/costura; requiere Pillow y NumPy.
9. `python scripts/refresh-library.py` — integra todo en el catálogo.

Ejecutar estos pasos en orden; el paso 1 reemplaza el manifiesto por el inventario base. Los pasos comparten manifiesto: ejecutarlos secuencialmente. El ZIP incluye los recursos finales; para reconstruirlos se necesitan los scripts y proyectos del repositorio original.

## Límites actuales

Es una reconstrucción propia y simplificada para prototipo. Las manos abiertas, flechas como notas, PERFECT/MISS, calibración, pausa y resultados son propuestas para la adaptación. Los puños, pies, pads, paredes, vallas, combo y cuatro valoraciones se observaron en la referencia. La biblioteca permite revisar el kit; su existencia no implica implementar o validar el futuro videojuego.
