# AGENTS.md — Esquema de documentación del proyecto

Este repositorio mantiene su documentación viva en Obsidian, siguiendo el patrón LLM Wiki: fuentes originales en `raw/`, conocimiento conectado y actualizado en `wiki/`, catálogo en `index.md` y registro cronológico en `log.md`.

## LEER PRIMERO AL ENTRAR EN ESTE PROYECTO

Leer **[CONTINUAR.md](CONTINUAR.md)** antes de planificar, modificar código o pedir al usuario que explique el proyecto. Es el handoff canónico con objetivo, video, recursos, estado real, decisiones abiertas y pasos después del reinicio. Después consultar `wiki/backlog/desarrollo-juego-con-camara.md`.

La fase de assets terminó. El usuario prepara un cambio de agente/entorno para **comenzar el juego completo de ritmo/cardio controlado por cámara**. La prohibición histórica de programar pertenecía a la fase de recursos; no es una restricción permanente de la próxima sesión. La sesión de cierre solo dejó el handoff; todavía no hay aplicación del juego.

## Contexto del proyecto

- Nombre: Devin Vibethon.
- Repositorio de código y vault Obsidian: esta carpeta.
- Idioma de documentación: español; conservar nombres técnicos, comandos, identificadores y rutas originales.
- Alcance vigente: comenzar en la siguiente sesión el desarrollo del juego de ritmo/cardio con manos, pies y cuerpo frente a una cámara. Primero demostrar cámara → pose/calibración → gesto → reacción, y continuar hasta una sesión jugable completa. Detalles y límites en `CONTINUAR.md`.
- Referencia imprescindible: https://www.youtube.com/watch?v=FHe66Pc4xbU (STAY ON BEAT #18, Liam Fitness).
- **Original local disponible:** `raw/reference/video/stay-on-beat-18-original.mp4`. El usuario lo descargó y pidió conservarlo en el proyecto. Priorizarlo para ver el referente y extraer frames con tiempos precisos; la restricción de descarga de las notas antiguas ya no impide acceder al archivo. Ver `CONTINUAR.md` y la ficha de fuente.
- Estado de producción: primera versión del kit en `assets/v001/manifest.json`; inventario y límites en `wiki/arquitectura/inventario-y-uso-assets-v001.md`. Es un kit para prototipo, no el videojuego ni una copia exacta del render original.

## Orden de verdad

1. Código y configuración ejecutables del `HEAD` inspeccionado.
2. Decisiones confirmadas en `wiki/decisiones/`.
3. Fuentes primarias preservadas en `raw/` y fichas de `wiki/fuentes/`.
4. Documentación restante del proyecto.
5. Inferencias, siempre marcadas como tales y con nivel de confianza.

Si las fuentes discrepan, registrar la contradicción y mantener separados el comportamiento observado, lo decidido y lo pendiente. No inventar requisitos ni presentar propuestas como decisiones aprobadas.

## Estructura

- `raw/`: documentos y snapshots fuente, inmutables una vez registrados.
- `wiki/arquitectura/`: visión, stack, componentes e integraciones.
- `wiki/conceptos/`: vocabulario y reglas del dominio.
- `wiki/decisiones/`: decisiones numeradas `NNNN-slug.md` y su estado.
- `wiki/entidades/`: modelos y objetos principales.
- `wiki/estado/`: snapshots fechados, validación y diferencias observadas.
- `wiki/flujos/`: recorridos de usuario y procesos.
- `wiki/fuentes/`: procedencia, cobertura y evaluación de fuentes.
- `wiki/riesgos/`: riesgos con evidencia, impacto y mitigación.
- `wiki/backlog/`: trabajo pendiente, criterios de cierre y dependencias.
- `_templates/`: plantillas Templater por tipo.

## Frontmatter de páginas wiki

Toda página dentro de `wiki/` debe comenzar con:

```yaml
---
type: arquitectura | concepto | decision | entidad | estado | flujo | fuente | riesgo | backlog
tags: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: []
status: borrador | propuesta | vigente | revisado | superado | pendiente
---
```

## Trazabilidad y mantenimiento

- Etiquetar afirmaciones importantes como verificadas, documentadas, inferidas, propuestas o pendientes cuando el estado no sea obvio.
- Citar rutas de código o documentos fuente para afirmaciones técnicas durables.
- No copiar el repositorio entero dentro del vault: enlazar rutas y registrar el commit inspeccionado.
- Preservar fuentes originales en `raw/`; las páginas de `wiki/` son conocimiento editable y enlazado.
- Mantener `log.md` como registro append-only: agregar entradas, no reescribir las anteriores.
- Usar wikilinks (`[[...]]`) para conectar conceptos, decisiones, fuentes y estado.
- Cada decisión debe incluir contexto, decisión, consecuencias y estado de aprobación.

## Operaciones

### Incorporar una fuente

1. Guardar una copia fiel en `raw/` con fecha y nombre descriptivo si no existe una fuente estable.
2. Crear o actualizar su ficha en `wiki/fuentes/`.
3. Actualizar las páginas de wiki pertinentes con vínculos y evidencia.
4. Anotar contradicciones y preguntas abiertas.
5. Actualizar `index.md` y añadir una entrada a `log.md`.

### Consultar

Leer `index.md`, seguir wikilinks relevantes y distinguir evidencia del código, documentación, propuesta e inferencia.

### Revisar

Comprobar wikilinks rotos, frontmatter, notas huérfanas, rutas inexistentes, estado de decisiones y coherencia con el código actual.
