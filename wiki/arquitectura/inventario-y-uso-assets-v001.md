---
type: arquitectura
tags: [assets, inventario, integracion]
created: 2026-10-15
updated: 2026-10-15
sources: ["assets/v001/manifest.json", "assets/v001/audit.json", "raw/reference/dense-index.json"]
status: vigente
---

# Inventario y uso de assets v001

> El usuario prepara el inicio del desarrollo en una nueva sesión. Ver [[CONTINUAR]] para el alcance vigente y el primer hito de cámara/pose. Esta nota documenta los recursos ya producidos y las reglas para integrarlos.

## Qué incluye la primera versión

135 recursos lógicos: **124 gráficos SVG con sus 124 PNG, ocho WAV y tres MP4**. No sumar el SVG y su PNG como dos diseños distintos. El manifiesto contiene rutas, dimensiones, bytes, SHA-256, formato, alfa y pivotes o duración según el recurso.

| Familia requerida | Archivos y uso |
| --- | --- |
| Pies, manos y puños | `notes/`: placas con huellas, puños, manos abiertas y flechas; variantes izquierda/derecha y cuatro colores. Manos abiertas y flechas son propuestas complementarias. |
| Acciones simultáneas | `pairs/`: dos pies o dos puños en una placa; también se pueden componer dos notas individuales. |
| Símbolos independientes | `icons/`: manos, puños y pies sin placa para montar otras variantes. |
| Receptores | `pads/`: apagado y activo por color. Cuatro instancias formarían el frente; no se asignaron hitboxes ni comportamiento. |
| Pista | `track/track-transparent`: pista negra con bordes cian/magenta y exterior transparente. |
| Paredes y esquiva | `obstacles/wall-*`, `wall-cue-left/right`: placas translúcidas y flechas laterales. |
| Salto y agacharse | `obstacles/hurdle-low-jump`, `hurdle-high-duck`: vallas con cheurones arriba/abajo. La altura se define al colocarlas. |
| Impactos | `effects/`: anillos, fragmentos, estelas y destellos. Son capas estáticas editables; la futura integración decidirá duración, escala y mezcla. |
| Figura guía | `guides/`: panel y once siluetas — neutral, brazos arriba, puñetazos, pasos laterales, sentadilla, salto, agacharse e inclinaciones. |
| HUD | `hud/`: dígitos, COMBO, valoraciones, barra vacía y relleno. PERFECT y MISS son propuestas; NICE/GREAT/AWESOME/UNSTOPPABLE se observaron. |
| Interfaz | `interface/`: controles, calibración, preparación, inicio, pausa, pérdida de cámara, retroceder, cierre y panel de resultados sin cifras inventadas. |
| Fondos estáticos | `backgrounds/background-*.svg/png`: estudios editables de las tres familias. |
| Fondos en movimiento | `backgrounds/loop-fairground`, `loop-diamonds`, `loop-gears`: MP4 1280 × 720, 30 FPS, 8 s, 240 frames, sin audio. |
| Audio | `audio/`: efectos de pie, mano, interfaz, error, cuenta atrás, combo y cierre; loop original a 120 BPM, ocho compases 4/4, 16 s. |

## Cómo se obtiene la profundidad

La composición de video usa proyección `pantallaX = cx + f·X/Z`, `pantallaY = cy - f·(Y-alturaCámara)/Z`. Cada módulo avanza en Z de forma periódica; colores y decoraciones se repiten con el mismo período para cerrar el bucle. El halo tiene un núcleo nítido y borde difuso, y los arcos se reflejan bajo el plano del suelo. Se usan formas geométricas propias; no se requieren modelos BLEND ni GLB para usar esta versión.

Los MP4 ya contienen la pista. Al usarlos como fondo, no superponer otra pista opaca sin revisar alineación. El SVG de pista es una alternativa para componer un escenario por capas. Los videos no contienen notas, pads ni HUD: esos elementos se colocarán como capas separadas cuando se autorice la programación.

## Reglas de integración futura

- Las coordenadas/pivotes son visuales, no reglas de detección corporal. El pivote propuesto es el centro del lienzo; ajustar la alineación de la cara de cada pad al proyectar.
- No estirar la pista o los MP4 a un aspecto diferente de 16:9. Contener o recortar preservando la proporción y recalibrar el punto de fuga.
- Usar PNG para una apariencia congelada y SVG para editar. Los textos SVG dependen de fuentes del sistema; los PNG ya fijan su aspecto.
- Los colores varían entre secciones del video: feria predominantemente cian/magenta; diamantes violeta/cian; engranajes amarillo/magenta. Las capturas no justifican asumir que cada carril corresponde siempre a una extremidad fija.
- La cámara debe ver cuerpo completo. Pose Landmarker es una propuesta técnica documentada en [[wiki/arquitectura/referencia-visual-y-alcance]], no una capacidad del kit ni una tecnología confirmada del video original.
- No deducir BPM, reglas de puntuación o ventanas de acierto del audio provisional ni de los tiempos nominales de las capturas.

## Verificación y límites

`assets/v001/audit.json` comprueba existencia, dimensiones y alfa de los 124 PNG, audio no vacío ni saturado y 240 fotogramas decodificables por MP4. La variación en la unión de los bucles está entre 1.015 y 1.049 veces la variación media entre fotogramas; no hay un salto grande numérico. Se revisaron fotogramas decodificados y se probó reproducción en navegador.

La fidelidad es la de una **primera reconstrucción para prototipo**: se conservan vocabulario visual, colores, símbolos, posición de capas, tres familias de escenario y movimiento de profundidad. La iluminación, texturas, anatomía y formas no son una copia exacta del render del canal. Las siluetas son propias y estilizadas; las variaciones finas de coreografía requerirán diseño cuando se defina el repertorio del juego.

No hay código de gameplay, captura de cámara, seguimiento corporal, beatmap o scoring. `scripts/` y `videos/` son herramientas y fuentes de producción de recursos.

## Relaciones

- [[wiki/arquitectura/referencia-visual-y-alcance]]
- [[wiki/estado/2026-10-15-kit-assets-v001]]
- [[wiki/fuentes/video-stay-on-beat-18]]
- [[index]]
