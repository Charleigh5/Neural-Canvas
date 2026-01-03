/**
 * Type definitions for Google Photos API responses
 * Replaces `any` types in googlePhotosService.ts
 */

export interface GooglePhotosAlbum {
  id: string;
  title: string;
  productUrl: string;
  mediaItemsCount?: string;
  coverPhotoBaseUrl?: string;
  coverPhotoMediaItemId?: string;
}

export interface GooglePhotosMediaItem {
  id: string;
  description?: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata?: {
    creationTime?: string;
    width?: string;
    height?: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
      focalLength?: number;
      apertureFNumber?: number;
      isoEquivalent?: number;
      exposureTime?: string;
    };
    video?: {
      cameraMake?: string;
      cameraModel?: string;
      fps?: number;
      status?: 'PROCESSING' | 'READY' | 'FAILED';
    };
  };
  contributorInfo?: {
    profilePictureBaseUrl?: string;
    displayName?: string;
  };
}

export interface GooglePhotosListAlbumsResponse {
  albums?: GooglePhotosAlbum[];
  nextPageToken?: string;
}

export interface GooglePhotosSearchResponse {
  mediaItems?: GooglePhotosMediaItem[];
  nextPageToken?: string;
}

export interface GooglePhotosError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}
