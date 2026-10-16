# Devin Vibethon — empezar aquí

**Leer primero [CONTINUAR.md](CONTINUAR.md)** y después [AGENTS.md](AGENTS.md).

Este proyecto va a convertirse en un juego de ritmo/cardio controlado por movimientos de manos, pies y cuerpo frente a una cámara. El usuario cambia de agente/entorno para empezar a desarrollarlo. El handoff contiene la intención completa, las decisiones abiertas y el orden recomendado de trabajo.

Referencia: [STAY ON BEAT #18 — Liam Fitness](https://www.youtube.com/watch?v=FHe66Pc4xbU).

**[Video original disponible localmente](raw/reference/video/stay-on-beat-18-original.mp4)** — conservarlo al trasladar el proyecto. Los próximos agentes pueden verlo y extraer frames directamente, sin descargarlo otra vez.

Ya existen 135 recursos lógicos: 124 SVG con sus PNG, ocho audios y tres fondos animados. **Todavía no existen aplicación del juego, captura de cámara, modelo de pose integrado, beatmap ni scoring.**

- [Biblioteca de recursos](assets/v001/index.html).
- [Capturas de referencia](raw/reference/index.html).
- [Índice del vault Obsidian](index.md).
- [Hitos de desarrollo](wiki/backlog/desarrollo-juego-con-camara.md).

Para abrir las páginas tras reiniciar, ejecutar desde esta carpeta:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Después abrir http://127.0.0.1:8765/assets/v001/index.html . Este es un servidor del catálogo, no del videojuego. No es necesario regenerar assets para revisar el proyecto.
