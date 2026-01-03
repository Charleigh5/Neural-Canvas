import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  authenticateGooglePhotos,
  listAlbums,
  getAlbumMedia,
} from '../services/googlePhotosService';
import { GoogleAlbum } from '../types';
import { X, Cloud, Key, AlertTriangle, Loader2, HelpCircle } from 'lucide-react';
import { TiltCard } from './ui/TiltCard';

interface GooglePhotosBrowserProps {
  onClose: () => void;
}

export const GooglePhotosBrowser: React.FC<GooglePhotosBrowserProps> = ({ onClose }) => {
  const { googlePhotosToken, setGooglePhotosToken, addImage } = useStore();
  const [albums, setAlbums] = useState<GoogleAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(process.env.GOOGLE_CLIENT_ID || '');
  const [importingAlbumId, setImportingAlbumId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });
  const [showHelp, setShowHelp] = useState(false);

  const loadAlbums = useCallback(async () => {
    if (!googlePhotosToken) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedAlbums = await listAlbums(googlePhotosToken);
      setAlbums(fetchedAlbums);
    } catch {
      setError('Failed to fetch albums. Token might be expired.');
      setGooglePhotosToken('');
    } finally {
      setLoading(false);
    }
  }, [googlePhotosToken, setGooglePhotosToken]);

  // If we have a token, load albums on mount
  useEffect(() => {
    if (googlePhotosToken) {
      loadAlbums();
    }
  }, [googlePhotosToken, loadAlbums]);

  const handleConnect = async () => {
    if (!clientId.trim()) {
      setError('Client ID is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await authenticateGooglePhotos(clientId);
      setGooglePhotosToken(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Authentication failed');
      setLoading(false);
      setShowHelp(true); // Auto-show help on error
    }
  };

  const handleImportAlbum = async (album: GoogleAlbum) => {
    if (!googlePhotosToken) return;
    setImportingAlbumId(album.id);
    setImportProgress({ current: 0, total: 0 });

    try {
      const mediaItems = await getAlbumMedia(googlePhotosToken, album.id);
      setImportProgress({ current: 0, total: mediaItems.length });

      // Ingest sequentially or in batches to avoid overwhelming the canvas/Gemini
      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];

        // We assume we can access the baseUrl directly.
        // For higher res: append =w2048-h2048
        const highResUrl = `${item.baseUrl}=w2048-h2048`;

        addImage({
          id: Math.random().toString(36).substring(2, 11),
          url: highResUrl, // Use URL directly
          width: parseInt(item.mediaMetadata.width),
          height: parseInt(item.mediaMetadata.height),
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          rotation: 0,
          scale: 1,
          tags: ['analyzing...', 'g_photos'],
          analyzed: false,
          timestamp: Date.now(),
        });

        setImportProgress(prev => ({ ...prev, current: i + 1 }));
        // Slower delay (1s) to reduce burst rate on the API queue
        await new Promise(r => setTimeout(r, 1000));
      }

      // Done
      onClose();
    } catch {
      setError('Failed to import media.');
    } finally {
      setImportingAlbumId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
      <div className="w-full max-w-4xl h-[80vh] bg-black/90 border border-indigo-500/30 rounded-lg flex flex-col shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-indigo-900/50 bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <Cloud className="text-indigo-400" />
            <h2 className="text-lg font-mono font-bold text-indigo-100 tracking-widest uppercase">
              Quantum_Bridge // Cloud_Vault
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-700 hover:text-white transition-colors"
            aria-label="Close Google Photos browser"
          >
            <X />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden relative p-6 flex flex-col">
          {error && (
            <div className="mb-6 bg-rose-900/20 border border-rose-500/50 p-3 rounded text-rose-300 font-mono text-xs flex flex-col gap-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={14} />
                AUTH_FAILURE: {error}
              </div>
              {showHelp && (
                <div className="pl-6 text-slate-400 leading-relaxed">
                  <p className="mb-1">Troubleshooting New Credentials:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      Ensure <strong>Authorized JavaScript origins</strong> in Google Cloud Console
                      exactly matches:{' '}
                      <code className="text-white bg-black/30 px-1 rounded">
                        {window.location.origin}
                      </code>{' '}
                      (Check http vs https and trailing slashes).
                    </li>
                    <li>
                      If app is in &quot;Testing&quot; mode, add your email to the{' '}
                      <strong>Test Users</strong> list in the OAuth Consent Screen.
                    </li>
                    <li>
                      Ensure you selected <strong>&quot;Web application&quot;</strong> as the
                      application type, not Desktop/Android.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {!googlePhotosToken ? (
            // AUTH SCREEN
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-20 h-20 bg-indigo-900/20 rounded-full flex items-center justify-center animate-pulse">
                <Key className="text-indigo-500" size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl text-indigo-100 font-bold uppercase tracking-tighter">
                  Authentication_Required
                </h3>
                <p className="text-indigo-500/60 text-sm max-w-md">
                  To bridge the gap between Google Photos and the Neural Canvas, an OAuth 2.0 Access
                  Token is required.
                </p>
              </div>

              <div className="w-full max-w-md space-y-4">
                {!process.env.GOOGLE_CLIENT_ID && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label
                        htmlFor="gcp-client-id"
                        className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest"
                      >
                        GCP_Client_ID
                      </label>
                      <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-white transition-colors"
                      >
                        <HelpCircle size={10} /> Configuration Help
                      </button>
                    </div>
                    <input
                      id="gcp-client-id"
                      className="w-full bg-black border border-indigo-800 rounded p-2 text-indigo-100 outline-none focus:border-indigo-500 text-xs font-mono"
                      placeholder="Enter your Google Cloud Client ID"
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                    />
                  </div>
                )}

                <button
                  onClick={handleConnect}
                  disabled={loading || !clientId}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-[0.2em] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase text-xs"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Initiate_OAuth_Sequence'
                  )}
                </button>
              </div>
            </div>
          ) : (
            // ALBUM GRID AREA
            <div className="h-full overflow-hidden relative">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-indigo-400 animate-in fade-in">
                  <Loader2 className="animate-spin" size={48} />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase">
                      Synchronizing_Quantum_Link...
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 opacity-60">
                      Handshaking with Google Photos API
                    </span>
                  </div>
                </div>
              ) : albums.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                  <Cloud size={48} className="text-slate-600" />
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-slate-500">
                    No_Albums_Detected_In_Sector
                  </span>
                </div>
              ) : (
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                    {albums.map(album => (
                      <TiltCard
                        key={album.id}
                        className="group cursor-pointer aspect-square rounded-xl"
                        onClick={() => handleImportAlbum(album)}
                      >
                        <div className="flex-1 relative overflow-hidden bg-black/40">
                          <img
                            src={album.coverPhotoBaseUrl}
                            alt={`Cover for ${album.title} album`}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                          {importingAlbumId === album.id && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                              <Loader2 className="text-indigo-400 animate-spin mb-2" />
                              <span className="text-[10px] text-indigo-300 font-mono">
                                INGESTING {importProgress.current}/{importProgress.total}
                              </span>
                              <div className="w-20 h-1 bg-indigo-900 rounded-full mt-2 overflow-hidden">
                                <div
                                  className={`h-full bg-indigo-400 transition-all duration-200 w-[${Math.round(
                                    (importProgress.current / Math.max(importProgress.total, 1)) *
                                      100
                                  )}%]`}
                                />
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="text-xs font-black text-white truncate uppercase tracking-tighter">
                              {album.title}
                            </div>
                            <div className="text-[8px] text-indigo-400 font-mono uppercase tracking-widest mt-1">
                              {album.mediaItemsCount} ITEMS
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
