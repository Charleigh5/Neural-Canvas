/**
 * EXPORTENGINE.TS
 * High-performance capture system for STUDIO.OS.
 * Merges DOM-rendered frames and Web Audio Master Bus into a production-grade video.
 * Uses html2canvas for visual capture and MediaRecorder for encoding.
 */

import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename: string;
  bitrate: number;
  fps: number;
  element: HTMLElement;
  format: 'webm' | 'mp4';
}

export class ExportEngine {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private isRecording = false;

  async startCapture(
    options: ExportOptions,
    onComplete: (blob: Blob) => void,
    _onProgress?: (progress: number) => void
  ) {
    this.chunks = [];
    this.isRecording = true;

    // 1. Setup Canvas for Recording
    const { width, height } = options.element.getBoundingClientRect();
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) throw new Error('Failed to get 2D context');

    // 2. Setup Stream
    const canvasStream = this.canvas.captureStream(options.fps);

    // Note: Audio track capturing requires connecting audioService node to a MediaStreamDestination
    // For this phase, we'll focus on visual export. Audio integration comes in Phase 3.
    this.stream = new MediaStream([...canvasStream.getVideoTracks()]);

    // 3. Initialize Recorder
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    this.recorder = new MediaRecorder(this.stream, {
      mimeType,
      videoBitsPerSecond: options.bitrate,
    });

    this.recorder.ondataavailable = e => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.recorder.onstop = () => {
      const finalBlob = new Blob(this.chunks, { type: 'video/webm' });
      onComplete(finalBlob);
      this.cleanup();
    };

    this.recorder.start(100);

    // 4. Start Capture Loop
    const frameDuration = 1000 / options.fps;
    let lastTime = 0;

    const captureLoop = async (time: number) => {
      if (!this.isRecording) return;

      if (time - lastTime >= frameDuration) {
        lastTime = time;
        try {
          // Capture DOM to Canvas
          const capturedCanvas = await html2canvas(options.element, {
            useCORS: true,
            allowTaint: true,
            background: '#000000',
            logging: false,
          });

          // Draw to recording canvas
          if (this.ctx && this.canvas) {
            this.ctx.drawImage(capturedCanvas, 0, 0, this.canvas.width, this.canvas.height);
          }
        } catch (e) {
          console.error('Frame capture failed', e);
        }
      }

      this.animationId = requestAnimationFrame(captureLoop);
    };

    this.animationId = requestAnimationFrame(captureLoop);
  }

  stopCapture() {
    this.isRecording = false;
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
  }

  private cleanup() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    this.canvas = null;
    this.ctx = null;
  }
}

export const exportEngine = new ExportEngine();
