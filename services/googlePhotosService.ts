import { GoogleAlbum, GoogleMediaItem } from '../types';

const SCOPES = 'https://www.googleapis.com/auth/photoslibrary.readonly';

// Type definitions for Google Identity Services (GIS)
interface GISTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

interface GISError {
  type: string;
  message?: string;
}

interface GISTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GISAccounts {
  oauth2: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (response: GISTokenResponse) => void;
      error_callback?: (error: GISError) => void;
    }) => GISTokenClient;
  };
}

// Global type augmentation for GSI
declare global {
  interface Window {
    google?: {
      accounts?: GISAccounts;
    };
  }
}

/**
 * Initiates the Google OAuth 2.0 Implicit Flow via GIS (Token Model).
 * Returns a Promise that resolves to the Access Token.
 */
export const authenticateGooglePhotos = (clientId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts) {
      reject(
        new Error('Google Identity Services script not loaded. Check your internet connection.')
      );
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(), // Ensure no trailing spaces
        scope: SCOPES,
        callback: (tokenResponse: GISTokenResponse) => {
          // Check for specific OAuth errors returned by Google
          if (tokenResponse.error) {
            const desc = tokenResponse.error_description || 'No details provided';
            console.error('Google Auth Error:', tokenResponse);
            reject(new Error(`Google Error (${tokenResponse.error}): ${desc}`));
            return;
          }

          if (tokenResponse.access_token) {
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error('Authentication failed: No access token received.'));
          }
        },
        error_callback: (err: GISError) => {
          // Network or initialization errors (e.g. 3rd party cookies blocked)
          console.error('GIS Initialization Error:', err);
          reject(
            new Error(
              err.message || 'Popup initialization failed. Allow popups and 3rd party cookies.'
            )
          );
        },
      });

      // Trigger the popup
      client.requestAccessToken();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.error('Token Client Creation Failed', e);
      reject(new Error(`Configuration Error: ${message}`));
    }
  });
};

/**
 * Fetches the user's albums.
 */
export const listAlbums = async (token: string): Promise<GoogleAlbum[]> => {
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/albums?pageSize=50', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Token expired or invalid.');
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.albums || [];
  } catch (error) {
    console.error('List Albums Failed', error);
    throw error;
  }
};

/**
 * Fetches media items from a specific album.
 */
export const getAlbumMedia = async (token: string, albumId: string): Promise<GoogleMediaItem[]> => {
  try {
    // We use search to get media from album
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: albumId,
        pageSize: 100, // Limit for prototype
      }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

    const data = await response.json();
    return data.mediaItems || [];
  } catch (error) {
    console.error('Get Album Media Failed', error);
    throw error;
  }
};
