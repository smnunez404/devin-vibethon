---
type: estado
tags: [continuidad, inicio, desarrollo, camara]
created: 2026-10-15
updated: 2026-10-15
sources: ["wiki/arquitectura/inventario-y-uso-assets-v001.md", "wiki/fuentes/video-stay-on-beat-18.md", "assets/v001/manifest.json"]
status: vigente
---

# LEER PRIMERO — continuidad de Devin Vibethon

Este documento es el punto de entrada para cualquier agente, modelo o entorno nuevo. El usuario cerrará la sesión y reiniciará el equipo. **La tarea siguiente es comenzar a construir el juego de ritmo/cardio con control corporal por cámara.** La fase anterior preparó los recursos y la documentación; todavía no existe el videojuego.

## 1. Lo que quiere el usuario

Un juego de ritmo para hacer cardio frente a una cámara conectada a su computadora. Debe reconocer sus movimientos de manos, pies y cuerpo y reaccionar a ellos: acertar notas, generar efectos, evaluar el ritmo y gestionar la sesión. La referencia muestra notas que se acercan por una pista con profundidad, puños elevados, huellas en el suelo, obstáculos y una figura guía. El usuario quiere llevar esa experiencia a un juego realmente interactivo.

La prioridad es un prototipo que funcione con su cámara y se parezca visualmente a la referencia. No se ha pedido una versión comercial, cuentas, backend, base de datos ni publicación. No inventar una marca final ni requisitos de multijugador.

**Cambio de fase confirmado el 2026-10-15:** “no programar el juego” era la restricción de la fase de assets. Después, el usuario pidió preparar este handoff para empezar el desarrollo con otro agente. No interpretar las notas históricas de la fase anterior como una prohibición permanente. Esta sesión de cierre solo documenta; el siguiente agente debe avanzar con la construcción cuando el usuario diga que continuemos.

## 2. Video imprescindible

**https://www.youtube.com/watch?v=FHe66Pc4xbU**

**Actualización: el usuario descargó y entregó el MP4 original. Ya está disponible dentro del proyecto:**

**[Ver video original local](raw/reference/video/stay-on-beat-18-original.mp4)**

Ruta relativa canónica: `raw/reference/video/stay-on-beat-18-original.mp4`. Usar este archivo como fuente principal para volver a ver el video, extraer frames precisos, analizar movimientos y revisar la fidelidad de los assets. No hace falta volver a descargarlo de YouTube. Fue movido desde Descargas por petición del usuario y se verificó que el SHA-256 antes y después coincidiera. Tamaño: 314.346.663 bytes. Metadata técnica en `raw/reference/video/stay-on-beat-18-original.metadata.json`.

Características del archivo comprobadas con FFprobe: **1280 × 720, 60 FPS, H.264, 737.931 s**, con audio AAC estéreo a 44.100 Hz. Estas son las características del referente local; los fondos propios del kit siguen siendo de 30 FPS y ocho segundos.

**Primer trabajo de referencia recomendado al retomar:** extraer del MP4 hojas de contacto y detalles con timestamps reales; contrastarlos con el análisis previo antes de diseñar acciones y sincronización. La llegada del original elimina el bloqueo de acceso al archivo, pero todavía no se ha realizado esa extracción precisa ni un análisis musical del MP4.

Título observado: **STAY ON BEAT #18 | Dance Workout | Immersive Interactive Warm Up (No Equipment)**. Canal: **Liam Fitness**. Duración observada: **12:17** (737.881 s en el reproductor).

Revisar antes de decidir la composición del juego:

- [Catálogo local de 147 capturas](raw/reference/index.html).
- `raw/reference/dense-index.json`: archivos y tiempos nominales.
- `raw/reference/dense-contact-01.jpg` a `dense-contact-06.jpg`: hojas de contacto revisadas.
- [[wiki/arquitectura/referencia-visual-y-alcance]]: descomposición visual.
- [[wiki/fuentes/video-stay-on-beat-18]]: procedencia e intentos fallidos.

**Límites del análisis anterior:** los intentos automáticos de descarga fueron restringidos por YouTube. Las capturas ya existentes son del navegador y sus tiempos pueden retrasarse durante una búsqueda: **no construir un beatmap preciso con esas marcas**. Ahora se puede trabajar con el MP4 original local para obtener evidencia temporal precisa. Los archivos `observed-*`, las capturas `t0071/t0131/t0191/t0251` y la portada `t0720-confirmed.jpg` tienen fallos documentados y no deben usarse como evidencia temporal. `raw/video-metadata.json` quedó vacío y no es metadata válida; no confundirlo con la nueva metadata junto al MP4.

El video es una referencia visual pregrabada. La figura guía y el contador que muestra no prueban seguimiento corporal. No afirmar que el original usa MediaPipe o cualquier modelo específico: no se verificó su implementación.

## 3. Estado real al cerrar

| Existe | No existe todavía |
| --- | --- |
| Vault Obsidian, reglas y documentación | Aplicación del juego y stack elegido |
| Video original local en `raw/reference/video/` | Extracción precisa y nuevo análisis del MP4 original |
| 135 recursos lógicos en `assets/v001/manifest.json` | Acceso a webcam y selector de dispositivo |
| 124 SVG y sus 124 PNG | Modelo de pose instalado/integrado y calibración |
| Ocho WAV originales, incluido loop a 120 BPM | Reconocimiento de acciones reales del usuario |
| Tres fondos MP4 de 8 s, 720p, 30 FPS | Beatmap, reloj de canción, juicio de notas y scoring |
| Biblioteca con búsqueda, reproducción y descargas | Escena jugable, flujo de sesión y resultados conectados |
| Scripts de producción y composiciones HyperFrames | Pruebas con la cámara y el espacio físico del usuario |

No hay `package.json` de aplicación en la raíz ni carpeta `app/`. Los `package.json` de `videos/` pertenecen a la producción de fondos y **no son el juego**. `.tools/` contiene dependencias locales excluidas de Git; no asumir que existirán en otro entorno. No hay modelos de pose, credenciales o servicios de backend configurados para el juego.

## 4. Recursos que debe reutilizar el siguiente agente

- [Biblioteca de assets](assets/v001/index.html).
- [Manifiesto](assets/v001/manifest.json): IDs, rutas, dimensiones, formatos, pivotes, hashes y metadatos de audio/video.
- [Guía de uso](assets/v001/README.md).
- [[wiki/arquitectura/inventario-y-uso-assets-v001]]: mapa completo de familias y composición.
- [Kit autónomo ZIP](deliverables/ritmo-cardio-assets-v001.zip): unos 24 MB, 266 archivos, sin capturas de terceros ni dependencias de producción.
- [[wiki/estado/auditoria-entrega-assets-v001]] y `assets/v001/audit.json`: qué se comprobó y qué no.

El kit incluye puños/pies/manos, notas dobles, cuatro colores, pads apagados/activos, paredes con flechas, vallas alta/baja, anillos/fragmentos/estelas/destellos, once siluetas corporales, HUD, controles, calibración, pausa y resultados. PERFECT/MISS, manos abiertas como notas y parte de la interfaz son propuestas propias; no todo se observó en la referencia.

Los MP4 `backgrounds/loop-fairground.mp4`, `loop-diamonds.mp4` y `loop-gears.mp4` **ya incluyen la pista negra** y no incluyen notas, receptores ni HUD. No duplicar una pista opaca encima sin revisar alineación. Su punto de fuga y aspecto 16:9 deben concordar con la proyección de las notas. El SVG `track/track-transparent.svg` es una alternativa para una composición por capas.

Las imágenes y fondos son una primera interpretación propia, no una réplica pixel a pixel. Se puede mejorar la fidelidad durante la implementación; conservar `v001` y crear otra versión para cambios sustanciales. No confundir los bucles de ocho segundos con la duración de una partida.

## 5. Dirección técnica propuesta, aún no decidida

El usuario sospecha que estimación de pose es la vía adecuada y quiere que trabajemos esa solución. **No hay modelo o motor aprobados todavía.** El siguiente agente debe verificar documentación vigente y escoger una solución que permita comprobar el cuerpo completo con la cámara real.

Hipótesis de arranque: aplicación web local con TypeScript, captura de cámara mediante las APIs del navegador, estimación de pose de cuerpo completo y un render 2D/2.5D. Un scaffold ligero con Vite y Canvas/WebGL es una opción a evaluar; React puede servir para menús si aporta valor. No adoptar un framework por estar usado en las composiciones de video. Los fondos renderizados permiten comenzar sin modelar un mundo 3D completo.

Candidato a investigar primero: **MediaPipe Pose Landmarker**. La documentación consultada describe 33 puntos corporales, incluyendo muñecas, tobillos, talones y puntas de pies. Fuente primaria: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js . No se descargó ni probó el modelo. Comparar una alternativa como MoveNet si compatibilidad, rendimiento o calidad observada justifican la comparación; no instalar múltiples modelos sin necesidad.

Separar conceptualmente cuatro capas:

1. **Captura e inferencia:** cámara → landmarks + confianza + timestamp.
2. **Interpretación corporal:** calibración, suavizado, visibilidad y detección de acciones.
3. **Ritmo:** reloj de audio, eventos de un beatmap, ventanas de acierto y puntuación.
4. **Presentación:** notas en perspectiva, pads, figura guía, feedback, sonido y flujo de sesión.

Esta separación permite reproducir landmarks grabados/sintéticos para depurar sin cámara y probar el render sin presentar una simulación como seguimiento real. La frecuencia de inferencia no debe convertirse en el reloj de la canción.

## 6. Primer hito recomendado: cámara → gesto → reacción visible

Antes de montar una canción larga, construir una demostración verificable con la cámara conectada:

1. Revisar este documento, los assets y el video; registrar una decisión breve de stack/modelo con justificación.
2. Crear la aplicación del juego en una carpeta propia, por ejemplo `app/`, conservando el vault y el kit. No modificar `videos/` para convertirlo en juego.
3. Añadir botón de inicio de cámara, selector de dispositivo, estado de permisos/error, imagen espejo y un overlay de landmarks/confianza. Mantener coherentes las coordenadas del espejo y las etiquetas de izquierda/derecha.
4. Calibrar posición neutral y escala corporal a partir del cuerpo observado. Mostrar si faltan manos o pies en el encuadre. No tratar un punto invisible o de baja confianza como movimiento válido.
5. Hacer que una acción sencilla —por ejemplo elevar una mano— active un pad y su efecto exactamente una vez por gesto, con retorno a neutral antes de otro disparo. Esto prueba la cadena completa sin esconder el estado del modelo.
6. Medir rendimiento y retardo en el equipo real; documentar cámara, resolución, modelo, navegador y resultados observados. Si no está disponible la cámara, registrar esa validación como pendiente.

**Criterio de cierre del hito:** el usuario conecta/selecciona su cámara, ve el tracking, realiza un gesto y obtiene una reacción consistente. Cubrir permiso denegado, cámara ausente, pérdida de pose y recuperación. No considerar suficiente una demo que se controla solo con teclado o reproduce una animación pregrabada.

## 7. Desarrollo posterior del juego completo

Secuencia propuesta para avanzar después del primer hito:

1. **Acciones:** ampliar a manos izquierda/derecha, puñetazo o alcance, pies/pasos, movimientos simultáneos, inclinación/esquiva, agacharse y salto. Definir cada acción con evidencia de landmarks y timestamps, sin inventar umbrales finales antes de probar. Un desplazamiento 2D de muñeca no demuestra por sí solo un puñetazo hacia la cámara.
2. **Ritmo mínimo:** usar el WAV original de 120 BPM como material provisional y crear un beatmap propio corto de 30–60 s, con eventos de mano, pie y obstáculo. El primer beatmap puede ser más corto que la referencia; es una etapa de validación, no una reducción del objetivo final.
3. **Escena:** fondo elegido, notas con trayectoria/perspectiva hasta una zona de impacto, cuatro receptores, transparencias y feedback. Mantener legibilidad de notas sobre luces de fondo.
4. **Juicio:** comparar la hora del evento corporal con la hora objetivo de la nota; evitar aciertos duplicados, distinguir temprano/tarde/fallo, llevar combo y resultados. Alinear un único reloj de audio y medir/compensar latencia. Las ventanas son parámetros a diseñar y probar.
5. **Sesión:** preparación → cámara → calibración → selección de pista/nivel → cuenta atrás → juego → pausa/recuperación → resultados/reintento. Los recursos visuales ya preparados sirven de base.
6. **Repertorio y presentación:** cubrir combinaciones, cambios de escenario, sonidos y efectos, ajustar dificultad y pulir el parecido con el video. Mantener explícita la diferencia entre recursos propuestos y comportamiento del referente verificado.

El objetivo sigue siendo **todo el juego de ritmo con control por cámara**, no quedarse en el visor de landmarks o el primer pad. Documentar el trabajo por hitos, sin declarar el juego terminado cuando solo funcione la demostración de tracking.

## 8. Decisiones abiertas y cómo resolverlas

- Cámara concreta, encuadre, distancia y equipo de ejecución: descubrir al conectar y medir; no se registró modelo de cámara ni resolución objetivo.
- Navegador o aplicación de escritorio final: la web local es una propuesta para reducir fricción inicial, no una decisión confirmada.
- Qué cuenta como cada movimiento, reflejo y correspondencia de cuatro carriles: diseñar con la cámara y la referencia; no hay mapeo universal aprobado.
- Dificultad, BPM de las canciones definitivas, duración de sesión y reglas de puntuación: por definir. 120 BPM corresponde solo al WAV provisional creado aquí.
- Música definitiva y coreografía: el MP4 original contiene el audio del canal como referencia; no se incorporó al kit propio ni se verificaron sus derechos. Usar el material propio existente para el prototipo.
- Backend/cuentas/despliegue: fuera del alcance actual salvo nueva petición del usuario.

Resolver elecciones reversibles con criterio y registrar las decisiones. Pedir al usuario solo datos que realmente impidan avanzar o preferencias que cambien sustancialmente el resultado. No pedirle que vuelva a contar todo el proyecto ni que vuelva a autorizar el cambio de fase.

## 9. Después de reiniciar o cambiar de entorno

La referencia duradera son **los archivos de esta carpeta**, no la conversación ni los procesos abiertos. Las URLs de localhost dejarán de servir al apagar la computadora. El puerto 3002 pertenecía a Studio de HyperFrames; no es un servidor del juego.

En esta máquina el proyecto está en `C:\Users\qwert\Documents\devin-vibethon`. En otro entorno usar la carpeta donde esté el checkout/vault y rutas relativas.

Para ver la biblioteca de assets desde la raíz del proyecto:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Abrir http://127.0.0.1:8765/assets/v001/index.html y http://127.0.0.1:8765/raw/reference/index.html . Si `python` no existe, usar un servidor estático equivalente; no es necesario regenerar recursos para verlos. El ZIP también contiene `index.html` autónomo.

Herramientas usadas para **producir** los assets, no dependencias ya elegidas del juego: Python con Pillow, NumPy, Shapely e imageio-ffmpeg; Node.js, resvg, GSAP, FFmpeg/FFprobe y HyperFrames (composiciones con CLI fijada a 0.8.162). La receta está en `assets/v001/README.md`. Evitar ejecutar `build-assets.py` solo para “probar”: reconstruye el manifiesto base y requiere completar la secuencia posterior para recuperar refinamientos, audio y videos.

Si se traslada el proyecto, llevar `assets/`, `raw/reference/` **incluido `raw/reference/video/stay-on-beat-18-original.mp4`**, `wiki/`, `scripts/`, `videos/`, `_templates/`, `.obsidian/` y los Markdown raíz. El ZIP de recursos por sí solo no contiene el contexto completo, el video original ni las capturas del análisis. Las dependencias de `.tools/` son reinstalables; no transportar un servidor en ejecución ni asumir sesiones de navegador persistentes.

## 10. Orden de lectura y mantenimiento

1. Este documento y [[AGENTS]].
2. [[wiki/arquitectura/referencia-visual-y-alcance]] y [[wiki/fuentes/video-stay-on-beat-18]].
3. Biblioteca y [[wiki/arquitectura/inventario-y-uso-assets-v001]].
4. [[wiki/backlog/desarrollo-juego-con-camara]].
5. [[wiki/estado/auditoria-entrega-assets-v001]] para distinguir lo comprobado del trabajo nuevo.

Actualizar este documento al cerrar cada hito, registrar decisiones en `wiki/decisiones/`, estado en `wiki/estado/` y añadir entradas a [[log]]. Mantener las fuentes originales de `raw/` y el historial. El estado “completo” de la tarea anterior solo se refiere al kit inicial; **el desarrollo del juego está pendiente**.

### Mensaje que el usuario puede pegar a otro agente

> Revisa este proyecto y entra en contexto. Lee primero CONTINUAR.md y AGENTS.md; después sigue los enlaces del vault. Vamos a comenzar el juego de ritmo/cardio controlado por mi cámara. Conserva los assets existentes y empieza por comprobar cámara, pose, calibración y un gesto que produzca una reacción visible; después continúa por los hitos hasta el juego completo. No confundas la biblioteca o las composiciones de fondos con una aplicación del juego ya construida.
