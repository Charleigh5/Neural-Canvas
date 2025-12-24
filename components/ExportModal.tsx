import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X, Film, AlertTriangle, CheckCircle2, Loader2, Monitor } from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportEngine } from '../services/exportEngine';

export const ExportModal = ({ onClose }: { onClose: () => void }) => {
  const {
    playback,
    exportState, // Access from store
    startExport,
    finishExport,
    cancelExport,
    setExportProgress,
    setExportConfig,
    setError,
    togglePlayback,
    playReel,
  } = useStore() as any; // Cast to any until store definitions are fully aligned

  // Local state for blob URL to download
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleStartExport = async () => {
    const element = document.getElementById('capture-stage');

    if (!element) {
      setError('Capture stage not found');
      return;
    }

    startExport();

    // Ensure we are playing
    if (!playback.isPlaying) {
      playReel();
    }

    try {
      await exportEngine.startCapture(
        {
          filename: 'neural-reel',
          bitrate: 8000000, // 8 Mbps
          fps: 30, // Conserve resources
          format: 'webm',
          element: element,
        },
        blob => {
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
          finishExport();
          exportEngine.stopCapture();
          if (playback.isPlaying) togglePlayback(); // Stop playback
        }
      );
    } catch (e: any) {
      setError(e.message);
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

  const handleCancel = () => {
    exportEngine.stopCapture();
    cancelExport();
    if (playback.isPlaying) togglePlayback();
    onClose();
  };

  // Compute stats
  const status = exportState?.status || 'idle';
  const progress = exportState?.progress || 0;
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
              <p className="text-[10px] text-slate-500 font-mono">NEURAL_ENGINE // V.2.0</p>
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
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl p-4 hover:border-indigo-500/50 transition-colors cursor-pointer ring-1 ring-indigo-500/50">
                  <Monitor className="text-indigo-400 mb-2" size={20} />
                  <div className="text-xs font-bold text-white mb-1">1080p HD</div>
                  <div className="text-[10px] text-slate-500">1920x1080 • 30fps</div>
                </div>
                <div className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl p-4 opacity-50 cursor-not-allowed">
                  <Film className="text-slate-400 mb-2" size={20} />
                  <div className="text-xs font-bold text-slate-300 mb-1">4K Ultra</div>
                  <div className="text-[10px] text-slate-500">PRO Feature</div>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                <p className="text-[10px] text-amber-200/80 leading-relaxed">
                  Rendering captures the current screen state in real-time. Please do not switch
                  tabs or resize the window during the process.
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
                <div className="text-[10px] text-slate-500 mt-1">Frame Capture Active</div>
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
              onClick={handleCancel}
              className="px-6 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/50 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            >
              Stop & Cancel
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
                <Download size={14} /> Download MP4
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
