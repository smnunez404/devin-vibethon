import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { Landmark } from '../types';

const BASE = import.meta.env.BASE_URL;
export const MODEL_PATH = `${BASE}models/pose_landmarker_full.task`;
export const MODEL_LABEL = 'pose_landmarker_full (33 puntos)';

export interface PoseFrame {
  landmarks: Landmark[] | null;
  /** ms que tardó detectForVideo. */
  inferenceMs: number;
  /** performance.now() al terminar la inferencia. */
  timestamp: number;
}

export class PoseTracker {
  private landmarker: PoseLandmarker | null = null;
  private lastVideoTime = -1;

  async init(): Promise<void> {
    const fileset = await FilesetResolver.forVisionTasks(`${BASE}wasm`);
    this.landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputSegmentationMasks: false,
    });
  }

  /** Corre inferencia solo cuando el frame de video es nuevo. */
  detect(video: HTMLVideoElement): PoseFrame | null {
    if (!this.landmarker || video.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = video.currentTime;
    const t0 = performance.now();
    const result = this.landmarker.detectForVideo(video, t0);
    const inferenceMs = performance.now() - t0;
    const landmarks = (result.landmarks?.[0] ?? null) as Landmark[] | null;
    return { landmarks, inferenceMs, timestamp: performance.now() };
  }

  close(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
