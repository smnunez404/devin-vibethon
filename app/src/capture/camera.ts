export type CameraErrorKind = 'denied' | 'missing' | 'busy' | 'other';

export class CameraError extends Error {
  constructor(
    public readonly kind: CameraErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'CameraError';
  }
}

export interface CameraHandle {
  stream: MediaStream;
  video: HTMLVideoElement;
  deviceId: string;
}

function classify(err: unknown): CameraError {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
      return new CameraError('denied', 'Permiso de cámara denegado. Habilítalo en el navegador y reintenta.');
    }
    if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
      return new CameraError('missing', 'No se encontró una cámara compatible.');
    }
    if (err.name === 'NotReadableError' || err.name === 'AbortError') {
      return new CameraError('busy', 'La cámara está en uso por otra aplicación o no responde.');
    }
  }
  return new CameraError('other', err instanceof Error ? err.message : String(err));
}

export async function listCameras(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
}

export async function startCamera(deviceId?: string): Promise<CameraHandle> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('missing', 'Este navegador no expone getUserMedia (se requiere contexto seguro).');
  }
  const constraints: MediaStreamConstraints = {
    video: {
      // 640x480@30: cámaras genéricas baratas no sostienen 720p60 y entregan
      // frames MJPEG parciales que se ven como bandas grises parpadeantes.
      // 480p sobra para el landmarker (su entrada interna es menor).
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30, max: 30 },
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    },
    audio: false,
  };
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    throw classify(err);
  }
  const video = document.createElement('video');
  video.srcObject = stream;
  video.playsInline = true;
  video.muted = true;
  await video.play();
  const track = stream.getVideoTracks()[0];
  return { stream, video, deviceId: track?.getSettings().deviceId ?? deviceId ?? '' };
}

export function stopCamera(handle: CameraHandle | null): void {
  handle?.stream.getTracks().forEach((t) => t.stop());
  if (handle) handle.video.srcObject = null;
}
