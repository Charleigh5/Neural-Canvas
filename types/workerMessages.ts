/**
 * Type definitions for Web Worker message passing
 * Replaces `any` types in worker services
 */

// Canvas Worker Messages
export interface CanvasWorkerRequest {
  id: string;
  type: 'COLLISION_CHECK' | 'LAYOUT_OPTIMIZE' | 'RENDER_TILE';
  payload: CanvasCollisionPayload | CanvasLayoutPayload | CanvasRenderPayload;
}

export interface CanvasCollisionPayload {
  images: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  newImage: { id: string; x: number; y: number; width: number; height: number };
}

export interface CanvasLayoutPayload {
  images: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  viewportWidth: number;
  viewportHeight: number;
}

export interface CanvasRenderPayload {
  imageData: ImageData;
  effects: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
}

export interface CanvasWorkerResponse {
  id: string;
  type: 'COLLISION_RESULT' | 'LAYOUT_RESULT' | 'RENDER_RESULT' | 'ERROR';
  payload: unknown;
  error?: string;
}

// Analysis Worker Messages
export interface AnalysisWorkerRequest {
  id: string;
  type: 'ANALYZE_IMAGE' | 'GENERATE_DEPTH' | 'EXTRACT_COLORS';
  payload: {
    imageData?: string; // base64
    width?: number;
    height?: number;
  };
}

export interface AnalysisWorkerResponse {
  id: string;
  type: 'ANALYSIS_RESULT' | 'DEPTH_RESULT' | 'COLORS_RESULT' | 'ERROR';
  payload: unknown;
  error?: string;
}

// Generic Worker Message (for postMessage typing)
export type WorkerMessage = CanvasWorkerRequest | AnalysisWorkerRequest;
export type WorkerResponse = CanvasWorkerResponse | AnalysisWorkerResponse;
