# app/public — binarios regenerables

- `wasm/`: copia de `node_modules/@mediapipe/tasks-vision/wasm`. Regenerar con
  `cp -r node_modules/@mediapipe/tasks-vision/wasm public/wasm` tras `npm install`.
- `models/pose_landmarker_full.task`: descargado de
  `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task`
  (9.398.198 bytes). Se sirve local para no depender de red en ejecución.
