import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Square,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { AppMode, ImageAsset } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const CameraCapture: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { addImage, images, processingIds, setCameraOpen, setMode } = useStore();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [mode, setModeState] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showHud, setShowHud] = useState(true);

  // Track IDs captured in this session for the local HUD
  const [sessionCaptures, setSessionCaptures] = useState<string[]>([]);

  useEffect(() => {
    setCameraOpen(true);
    return () => {
      setCameraOpen(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setCameraOpen, stream]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'SENSORY_INPUT_FAILURE: ACCESS DENIED';
      setError(message);
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const playShutterSound = () => {
    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext })
          .webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      /* Fallback for browser restrictions */
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.save();
      if (facingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      setFlash(true);
      playShutterSound();
      setTimeout(() => setFlash(false), 100);

      const id = Math.random().toString(36).substring(2, 11);
      const newItem: ImageAsset = {
        id,
        url: dataUrl,
        width: canvas.width,
        height: canvas.height,
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        rotation: 0,
        scale: 1,
        tags: ['camera_capture', 'neural_optic'],
        analyzed: false,
        timestamp: Date.now(),
        primaryTag: 'NEURAL_STILL',
        mediaType: 'image',
      };

      setSessionCaptures(prev => [id, ...prev]);
      await addImage(newItem);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!stream) return;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const id = Math.random().toString(36).substring(2, 11);

        const newItem: ImageAsset = {
          id,
          url: url,
          width: 400,
          height: 300,
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          rotation: 0,
          scale: 1,
          tags: ['video_log', 'neural_clip'],
          analyzed: false,
          timestamp: Date.now(),
          primaryTag: 'NEURAL_VIDEO',
          mediaType: 'video',
        };
        setSessionCaptures(prev => [id, ...prev]);
        await addImage(newItem);
      };

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const capturedItems = sessionCaptures
    .map(id => images.find(img => img.id === id))
    .filter(Boolean) as ImageAsset[];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden select-none">
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[300] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="flex-1 relative bg-[#05080f] overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="z-50 flex flex-col items-center gap-6 p-12 border border-rose-500/30 bg-rose-950/20 backdrop-blur-2xl rounded-2xl max-w-lg text-center">
            <AlertTriangle size={64} className="text-rose-500 animate-pulse" />
            <div className="space-y-2">
              <h2 className="text-rose-400 font-mono font-black tracking-[0.2em]">
                SENSOR_DENIED_ERROR
              </h2>
              <p className="text-rose-500/60 text-xs font-mono">{error}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={startCamera}
                className="px-8 py-3 bg-rose-500 text-black font-black text-[10px] tracking-widest rounded uppercase"
              >
                Retry_System
              </button>
              <button
                onClick={onClose}
                className="px-8 py-3 border border-rose-500/50 text-rose-500 font-black text-[10px] tracking-widest rounded uppercase"
              >
                Terminate
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-1000 ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            <AnimatePresence>
              {showHud && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none z-20"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />

                  {/* Telemetry Layer */}
                  <div className="absolute top-10 left-10 right-10 flex justify-between items-start font-mono text-[10px] tracking-[0.15em] uppercase">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-[#121b2d]/90 border border-cyan-500/40 px-3 py-1.5 rounded-[2px] flex items-center gap-2 backdrop-blur-sm shadow-xl">
                          <Cpu size={12} className="text-cyan-400" />
                          <span className="text-cyan-400 font-black">NEURAL_OPTIC_LIVE</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-slate-400/60 font-bold bg-black/40 backdrop-blur-sm p-3 rounded-[2px] border border-white/5">
                      STREAMING_RESOLUTION: 1080P
                      <br />
                      FPS: 60.0 &nbsp; LATENCY: 12ms
                      <br />
                      {isRecording ? (
                        <span className="text-rose-500 font-bold">
                          REC_TIME: {formatTime(recordingTime)}
                        </span>
                      ) : (
                        'STANDBY'
                      )}
                    </div>
                  </div>

                  {/* RETICLE */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] flex items-center justify-center opacity-40">
                    <div className="w-16 h-16 border border-white/20 relative">
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40" />
                    </div>
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke="white"
                        strokeWidth="0.1"
                        strokeDasharray="1 3"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="cyan"
                        strokeWidth="0.05"
                        strokeDasharray="10 5"
                      />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- RECENT CAPTURES TRAY --- */}
            <div className="absolute bottom-4 left-0 right-0 z-30 pointer-events-none flex justify-center">
              <div className="flex gap-3 px-6 py-4 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[32px] pointer-events-auto max-w-[90vw] overflow-x-auto custom-scrollbar shadow-2xl">
                <AnimatePresence mode="popLayout">
                  {capturedItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ scale: 0, opacity: 0, x: 50 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      className="relative group shrink-0"
                    >
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 relative shadow-lg">
                        <img
                          src={item.url}
                          alt={`Captured ${item.mediaType || 'image'} ${idx + 1}`}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        {processingIds.includes(item.id) ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Loader2 className="text-cyan-400 animate-spin" size={20} />
                          </div>
                        ) : (
                          <div className="absolute top-1.5 right-1.5 bg-emerald-500 rounded-full p-0.5 shadow-lg">
                            <CheckCircle2 size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-black">
                        {capturedItems.length - idx}
                      </span>
                    </motion.div>
                  ))}
                  {capturedItems.length === 0 && (
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-1.5 text-slate-700">
                      <ImageIcon size={18} />
                      <span className="text-[7px] font-black uppercase tracking-tighter">
                        Empty_Roll
                      </span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- CONTROL CONSOLE --- */}
      <div className="h-44 bg-[#04060a] border-t border-white/10 relative z-50 flex items-center justify-between px-12 pb-4">
        {/* AUX CONTROLS */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={toggleCamera}
            className="flex flex-col items-center justify-center gap-2 w-20 h-20 bg-[#0d131f] border border-white/5 rounded-2xl group transition-all hover:bg-[#121b2d] hover:border-cyan-500/30"
          >
            <RefreshCw
              size={22}
              className="text-slate-500 group-hover:text-cyan-400 group-hover:rotate-180 transition-all duration-700"
            />
            <span className="text-[9px] font-black font-mono text-slate-600 tracking-tighter group-hover:text-cyan-600 uppercase">
              Flip
            </span>
          </button>

          <button
            onClick={() => setShowHud(!showHud)}
            className={`flex flex-col items-center justify-center gap-2 w-20 h-20 bg-[#0d131f] border border-white/5 rounded-2xl group transition-all hover:bg-[#121b2d] ${
              showHud ? 'hover:border-cyan-500/30' : 'border-rose-500/30'
            }`}
          >
            {showHud ? (
              <Eye size={22} className="text-cyan-400" />
            ) : (
              <EyeOff size={22} className="text-rose-400" />
            )}
            <span
              className={`text-[9px] font-black font-mono tracking-tighter uppercase ${
                showHud ? 'text-cyan-600' : 'text-rose-600'
              }`}
            >
              Hud
            </span>
          </button>
        </div>

        {/* PRIMARY SHUTTER */}
        <div className="relative flex items-center justify-center flex-1">
          <div className="absolute w-32 h-32 border border-white/5 rounded-full animate-ping opacity-10" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={mode === 'photo' ? capturePhoto : toggleRecording}
            className="relative w-28 h-28 rounded-full border-[6px] border-white flex items-center justify-center p-2 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] group"
          >
            <div
              className={`
                        transition-all duration-500
                        ${
                          mode === 'photo'
                            ? 'w-full h-full bg-white rounded-full group-active:scale-95'
                            : isRecording
                              ? 'w-14 h-14 bg-rose-600 rounded-[8px]'
                              : 'w-20 h-20 bg-rose-600 rounded-full shadow-[0_0_25px_rgba(225,29,72,0.4)]'
                        }
                    `}
            >
              {isRecording && (
                <div className="w-full h-full flex items-center justify-center">
                  <Square size={24} className="text-white fill-white" />
                </div>
              )}
            </div>
          </motion.button>

          {/* MODE TOGGLE RADIOS */}
          <div className="absolute -top-12 flex items-center gap-6 bg-black/40 border border-white/5 px-4 py-1.5 rounded-full backdrop-blur-md">
            <button
              onClick={() => setModeState('photo')}
              className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
                mode === 'photo' ? 'text-white' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              Photo
            </button>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <button
              onClick={() => setModeState('video')}
              className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
                mode === 'video' ? 'text-rose-500' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              Video
            </button>
          </div>
        </div>

        {/* TERMINATION / TRANSITION */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <button
            onClick={() => {
              setMode(AppMode.CANVAS);
              onClose();
            }}
            className="flex flex-col items-center justify-center gap-2 w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl group transition-all hover:bg-indigo-600/20 hover:border-indigo-400"
          >
            <Sparkles
              size={22}
              className="text-indigo-400 group-hover:scale-110 transition-transform"
            />
            <span className="text-[9px] font-black font-mono text-indigo-500 tracking-tighter group-hover:text-indigo-300 uppercase">
              Canvas
            </span>
          </button>

          <button
            onClick={onClose}
            className="flex flex-col items-center justify-center gap-2 w-20 h-20 bg-[#0d131f] border border-white/5 rounded-2xl group transition-all hover:bg-[#1d1214] hover:border-rose-500/30"
          >
            <X size={22} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
            <span className="text-[9px] font-black font-mono text-slate-600 tracking-tighter group-hover:text-rose-600 uppercase">
              Close
            </span>
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
