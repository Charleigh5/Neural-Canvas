import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  X,
  Film,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Monitor,
  ScreenShare,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportEngine, CaptureMode, ExportEngine } from '../services/exportEngine';

// Quality preset configuration
type QualityPreset = 'draft' | 'hd' | 'ultra';

const QUALITY_PRESETS = {
  draft: { bitrate: 2000000, fps: 24, label: 'Draft', desc: '2 Mbps • Small file' },
  hd: { bitrate: 8000000, fps: 30, label: 'HD', desc: '8 Mbps • Balanced' },
  ultra: { bitrate: 16000000, fps: 60, label: 'Ultra', desc: '16 Mbps • Maximum' },
} as const;

// Define the shape of store state we need
interface ExportModalStore {
  playback: { isPlaying: boolean };
  exportState: { status: string; progress: number; isExporting: boolean; error?: string } | null;
  startExport: () => void;
  finishExport: () => void;
  cancelExport: () => void;
  setError: (error: string) => void;
  togglePlayback: () => void;
  playReel: () => void;
}

export const ExportModal = ({ onClose }: { onClose: () => void }) => {
  const {
    playback,
    exportState,
    startExport,
    finishExport,
    cancelExport,
    setError,
    togglePlayback,
    playReel,
  } = useStore() as unknown as ExportModalStore;

  // Local state
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('screen');
  const [quality, setQuality] = useState<QualityPreset>('hd');
  const isScreenCaptureSupported = ExportEngine.isScreenCaptureSupported();

  const selectedPreset = QUALITY_PRESETS[quality];

  const handleStartExport = async () => {
    startExport();

    if (captureMode === 'screen') {
      // Screen share mode - high fidelity
      try {
        await exportEngine.startScreenCapture(
          {
            filename: 'neural-reel',
            bitrate: selectedPreset.bitrate,
          },
          blob => {
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            finishExport();
          },
          error => {
            setError(error.message);
          }
        );
      } catch {
        // Error already handled in onError callback
        cancelExport();
      }
    } else {
      // DOM capture mode - automated but slower
      const element = document.getElementById('capture-stage');

      if (!element) {
        setError('Capture stage not found');
        return;
      }

      // Ensure we are playing
      if (!playback.isPlaying) {
        playReel();
      }

      try {
        await exportEngine.startCapture(
          {
            filename: 'neural-reel',
            bitrate: selectedPreset.bitrate,
            fps: selectedPreset.fps,
            format: 'webm',
            element: element,
          },
          blob => {
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            finishExport();
            exportEngine.stopCapture();
            if (playback.isPlaying) togglePlayback();
          }
        );
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown export error';
        setError(errorMessage);
      }
    }
  };

  const handleStopRecording = () => {
    if (captureMode === 'screen') {
      exportEngine.stopScreenCapture();
    } else {
      exportEngine.stopCapture();
      if (playback.isPlaying) togglePlayback();
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = `neural-canvas-export-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      onClose();
    }
  };

  // Compute stats
  const status = exportState?.status || 'idle';
  const isExporting = exportState?.isExporting || false;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-[480px] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Download size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Render Output
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">NEURAL_ENGINE // V.2.1</p>
            </div>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="Close export modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {status === 'idle' && (
            <div className="space-y-4">
              {/* Capture Mode Selection */}
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Capture Mode
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setCaptureMode('screen')}
                    disabled={!isScreenCaptureSupported}
                    className={`flex-1 bg-slate-900/50 border rounded-xl p-4 transition-colors cursor-pointer ${
                      captureMode === 'screen'
                        ? 'border-indigo-500/50 ring-1 ring-indigo-500/50'
                        : 'border-white/10 hover:border-indigo-500/30'
                    } ${!isScreenCaptureSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ScreenShare
                      className={
                        captureMode === 'screen' ? 'text-indigo-400 mb-2' : 'text-slate-400 mb-2'
                      }
                      size={20}
                    />
                    <div className="text-xs font-bold text-white mb-1">Screen Share</div>
                    <div className="text-[10px] text-slate-500">High fidelity • 60fps</div>
                  </button>
                  <button
                    onClick={() => setCaptureMode('dom')}
                    className={`flex-1 bg-slate-900/50 border rounded-xl p-4 transition-colors cursor-pointer ${
                      captureMode === 'dom'
                        ? 'border-indigo-500/50 ring-1 ring-indigo-500/50'
                        : 'border-white/10 hover:border-indigo-500/30'
                    }`}
                  >
                    <Monitor
                      className={
                        captureMode === 'dom' ? 'text-indigo-400 mb-2' : 'text-slate-400 mb-2'
                      }
                      size={20}
                    />
                    <div className="text-xs font-bold text-white mb-1">DOM Capture</div>
                    <div className="text-[10px] text-slate-500">Automated • 30fps</div>
                  </button>
                </div>
              </div>

              {/* Quality Presets */}
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Quality Preset
                </div>
                <div className="flex gap-2">
                  {(['draft', 'hd', 'ultra'] as const).map(preset => (
                    <button
                      key={preset}
                      onClick={() => setQuality(preset)}
                      className={`flex-1 bg-slate-900/50 border rounded-xl p-3 transition-colors ${
                        quality === preset
                          ? 'border-indigo-500/50 ring-1 ring-indigo-500/50'
                          : 'border-white/10 hover:border-indigo-500/30'
                      }`}
                    >
                      <Film
                        className={
                          quality === preset ? 'text-indigo-400 mb-1' : 'text-slate-500 mb-1'
                        }
                        size={16}
                      />
                      <div className="text-xs font-bold text-white">
                        {QUALITY_PRESETS[preset].label}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {QUALITY_PRESETS[preset].desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                <p className="text-[10px] text-amber-200/80 leading-relaxed">
                  {captureMode === 'screen'
                    ? 'You will be prompted to select "This Tab" for recording. Click stop to save.'
                    : 'DOM capture is slower but fully automated. Do not switch tabs during recording.'}
                </p>
              </div>
            </div>
          )}

          {status === 'rendering' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="relative w-16 h-16">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white">
                  REC
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">
                  Recording...
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {captureMode === 'screen' ? 'Screen Share Active' : 'Frame Capture Active'}
                </div>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <h4 className="text-white font-bold">Render Complete</h4>
                <p className="text-xs text-slate-500 mt-1">Your video is ready for download.</p>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
              <div className="text-rose-500 font-bold text-xs mb-1">Render Failed</div>
              <div className="text-[10px] text-rose-400">
                {exportState?.error || 'Unknown error'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          {status === 'idle' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all"
              >
                Start Render
              </button>
            </>
          )}

          {status === 'rendering' && (
            <button
              onClick={handleStopRecording}
              className="px-6 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            >
              Stop Recording
            </button>
          )}

          {status === 'completed' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Download size={14} /> Download WebM
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
