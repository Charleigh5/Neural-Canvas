import React, { useRef, useState, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { AppMode } from '../types';
import {
  Camera,
  Layers,
  Snowflake,
  Activity,
  Grid,
  Cloud,
  Aperture,
  FlaskConical,
  LucideIcon,
  LogIn, // Added
} from 'lucide-react';
import { GooglePhotosBrowser } from './GooglePhotosBrowser';
import { NeuralLogo } from './ui/NeuralLogo';
import { loadSampleData } from '../services/sampleDataService';
import { GlobalStatusIndicator } from './GlobalStatusIndicator';
import { LoginModal } from './LoginModal';
import { UserProfileMenu } from './UserProfileMenu';
import { useAuth } from '../services/authContext';

export const HomeScreen: React.FC = () => {
  const { setMode, addImage, holidaySpirit, neuralTemperature, setCameraOpen } = useStore();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGooglePhotos, setShowGooglePhotos] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isInjectingSamples, setIsInjectingSamples] = useState(false);

  // --- SAMPLE DATA INJECTION ---
  const handleLoadSamples = async () => {
    if (isInjectingSamples) return;
    setIsInjectingSamples(true);
    await loadSampleData();
    setIsInjectingSamples(false);
    setMode(AppMode.CANVAS);
  };

  // --- 3D PARALLAX ENGINE ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 50, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ('files' in e.target && e.target.files) {
      files = e.target.files;
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      files = e.dataTransfer.files;
    }

    if (files && files.length > 0) {
      const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));

      // GRID LAYOUT CONSTANTS
      const COLS = 5;
      const ITEM_SIZE = 300;
      const GAP = 40;
      const START_X = 100;
      const START_Y = 100;

      fileList.forEach((file: File, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const targetX = START_X + col * (ITEM_SIZE + GAP);
        const targetY = START_Y + row * (ITEM_SIZE + GAP);

        const reader = new FileReader();
        reader.onload = ev => {
          const src = ev.target?.result as string;
          const imgObj = new window.Image();
          imgObj.src = src;
          imgObj.onload = () => {
            const scale = ITEM_SIZE / imgObj.width;
            addImage({
              id: crypto.randomUUID(),
              url: src,
              x: targetX,
              y: targetY,
              width: imgObj.width,
              height: imgObj.height,
              rotation: 0,
              scale: scale,
              analyzed: false,
              tags: [],
              timestamp: Date.now(),
            });
          };
        };
        reader.readAsDataURL(file);
      });
      setMode(AppMode.CANVAS);
    }
  };

  // --- PARTICLE BACKGROUND SYSTEM ---
  const particles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 1}px`,
      height: `${Math.random() * 3 + 1}px`,
      opacity: Math.random() * 0.5 + 0.1,
      duration: `${Math.random() * 3 + 2}s`,
    }));
  }, []);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-slate-900 perspective-1000"
      onMouseMove={handleMouseMove}
      onDragOver={e => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e);
      }}
    >
      {/* Particle Field */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="star-field-item animate-twinkle"
            style={
              {
                '--star-left': p.left,
                '--star-top': p.top,
                '--star-width': p.width,
                '--star-height': p.height,
                '--star-opacity': p.opacity,
                '--star-duration': p.duration,
              } as React.CSSProperties
            }
          />
        ))}
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 via-transparent to-transparent z-0" />
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center py-24">
        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative z-10 flex flex-col items-center gap-16"
        >
          {/* 1. TITLE / LOGO (TOP) */}
          <div className="flex flex-col items-center translate-z-60">
            <div className="flex justify-between items-center w-full max-w-2xl px-8 mb-6 glass-panel rounded-full py-2">
              <div className="flex items-center gap-3">
                <Activity size={14} className="text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-mono font-medium text-indigo-300 tracking-wider">
                  NEURAL_TEMP: {neuralTemperature.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-px h-3 bg-white/10 mx-2" />
                <span className="text-[10px] font-mono font-medium text-slate-400 tracking-wider">
                  SYSTEM_READY
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Snowflake size={14} className="text-rose-400 animate-spin-slow" />
                <span className="text-[10px] font-mono font-medium text-rose-300 tracking-wider">
                  SPIRIT: {holidaySpirit.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center relative">
              {/* Background Glow for Logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none" />
              <NeuralLogo />
            </div>

            <div className="mt-8 flex flex-col items-center">
              <p className="text-xs font-mono text-indigo-300 uppercase tracking-[0.8em] text-glow-primary font-bold">
                North_Star_v3
              </p>
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent my-3" />
              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.5em] opacity-80">
                Neural_Orchestrator
              </p>
            </div>
          </div>

          {/* 2. THE INGESTION IRIS (CENTERPIECE) */}
          <div className="relative translate-z-40">
            {/* Orbital Satellites */}
            <SatelliteButton
              icon={Cloud}
              label="Cloud_Link"
              angle={-45}
              onClick={() => setShowGooglePhotos(true)}
              color="text-sky-400"
              testId="btn-cloud-link"
            />
            <SatelliteButton
              icon={Camera}
              label="Optic_Sensor"
              angle={45}
              onClick={() => setCameraOpen(true)}
              color="text-rose-400"
              testId="btn-camera"
            />
            <SatelliteButton
              icon={Layers}
              label="Constellation"
              angle={135}
              onClick={() => setMode(AppMode.CANVAS)}
              color="text-indigo-400"
              testId="btn-canvas"
            />
            <SatelliteButton
              icon={Grid}
              label="Vault"
              angle={225}
              onClick={() => setMode(AppMode.ASSETS)}
              color="text-emerald-400"
              testId="btn-vault"
            />
            <SatelliteButton
              icon={FlaskConical}
              label={isInjectingSamples ? 'Injecting...' : 'Test_Data'}
              angle={-90}
              onClick={handleLoadSamples}
              color="text-amber-400"
              testId="btn-test-data"
            />

            {/* The Iris Core */}
            <motion.button
              whileHover="hover"
              whileTap="tap"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-72 h-72 flex items-center justify-center outline-none group"
              data-testid="btn-upload"
            >
              {/* Outer Spinner */}
              <motion.div
                className="absolute inset-0 rounded-full border border-dashed border-indigo-500/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border border-dashed border-indigo-500/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              />

              {/* Mid Spinner (Interactive) */}
              <motion.div
                className="absolute inset-8 rounded-full border-2 border-indigo-500/30 border-t-transparent border-l-transparent animate-glitter"
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                variants={{
                  hover: { scale: 1.05, borderColor: 'rgba(99, 102, 241, 0.6)' },
                }}
              />

              {/* Data Rings */}
              <div className="absolute inset-12 rounded-full border border-white/5 bg-black/60 backdrop-blur-md shadow-2xl" />

              {/* The Core Pupil */}
              <motion.div
                className="relative w-36 h-36 bg-[#0a0a0a] rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_80px_rgba(99,102,241,0.2)] z-20 group-hover:border-indigo-500/50 transition-colors"
                variants={{ hover: { scale: 1.1 } }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 animate-pulse" />
                <Aperture
                  size={56}
                  className="text-slate-500 group-hover:text-indigo-400 transition-colors duration-500"
                  strokeWidth={1}
                />

                <div className="absolute -bottom-16 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] group-hover:text-indigo-400 transition-colors text-glow">
                  Initialize
                </div>
              </motion.div>

              {/* Hover Glow */}
              <motion.div
                className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[80px] opacity-0"
                variants={{ hover: { opacity: 1 } }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            aria-label="Select images to upload"
          />
        </motion.div>
      </div>

      {/* Ingestion Suction Overlay - Fixed to viewport */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="w-[600px] h-[600px] border-[2px] border-dashed border-cyan-400/50 rounded-full absolute text-glow-accent"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="w-[400px] h-[400px] border-[4px] border-indigo-500/50 rounded-full absolute box-shadow-xl"
            />
            <div className="relative z-10 text-4xl font-black text-white uppercase tracking-[0.3em] animate-pulse text-glow-primary">
              Release_Payload
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50 flex gap-4">
        {!isAuthenticated ? (
          <button
            onClick={() => setShowLoginModal(true)}
            className="glass-button flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/10"
          >
            <LogIn size={14} className="text-indigo-400" />
            Sign In
          </button>
        ) : (
          <UserProfileMenu />
        )}
      </div>

      <GlobalStatusIndicator />

      {showGooglePhotos && <GooglePhotosBrowser onClose={() => setShowGooglePhotos(false)} />}

      {showLoginModal && (
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};

interface SatelliteButtonProps {
  icon: LucideIcon;
  label: string;
  angle: number;
  onClick: () => void;
  color: string;
  testId?: string;
}

const SatelliteButton: React.FC<SatelliteButtonProps> = ({
  icon: Icon,
  label,
  angle,
  onClick,
  color,
  testId,
}) => {
  const radius = 220; // Increased radius for more breathing room
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  const buttonStyle = React.useMemo(
    () => ({
      left: '50%',
      top: '50%',
      x,
      y,
      marginLeft: -32,
      marginTop: -32,
    }),
    [x, y]
  );

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      className="absolute flex flex-col items-center gap-3 group z-30"
      style={buttonStyle}
      data-testid={testId}
    >
      <div className="glass-button w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden group-hover:border-white/40 transition-colors">
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-20 bg-current transition-opacity ${color}`}
        />
        <Icon
          size={24}
          className={`${color} opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`}
        />
      </div>
      <span className="glass-panel text-[9px] font-mono text-slate-400 uppercase tracking-widest px-3 py-1 rounded-full group-hover:text-white transition-colors border-white/5">
        {label}
      </span>
    </motion.button>
  );
};
