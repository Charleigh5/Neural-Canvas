import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { AppMode } from '../types';
import {
  Upload,
  Camera,
  Layers,
  Snowflake,
  Activity,
  Grid,
  Cloud,
  Hexagon,
  Aperture,
  Disc,
} from 'lucide-react';
import { GooglePhotosBrowser } from './GooglePhotosBrowser';
import { NeuralLogo } from './ui/NeuralLogo';

export const HomeScreen: React.FC = () => {
  const { setMode, addImage, holidaySpirit, neuralTemperature, setCameraOpen } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGooglePhotos, setShowGooglePhotos] = useState(false);

  // --- 3D PARALLAX ENGINE ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 50, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg']);

  const bgMoveX = useTransform(mouseXSpring, [-0.5, 0.5], ['-30px', '30px']);
  const bgMoveY = useTransform(mouseYSpring, [-0.5, 0.5], ['-30px', '30px']);

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
      const COLS = 6;
      const ITEM_WIDTH = 250;
      const GAP = 40;
      const GRID_WIDTH = Math.min(fileList.length, COLS) * (ITEM_WIDTH + GAP);

      // Start centered
      const START_X = -(GRID_WIDTH / 2) + ITEM_WIDTH / 2;
      const START_Y = -200;

      fileList.forEach((file: File, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = START_X + col * (ITEM_WIDTH + GAP);
        const y = START_Y + row * (ITEM_WIDTH + GAP);

        const reader = new FileReader();
        reader.onload = ev => {
          const src = ev.target?.result as string;
          const imgObj = new window.Image();
          imgObj.src = src;
          imgObj.onload = () => {
            addImage({
              id: Math.random().toString(36).substring(2, 11),
              url: src,
              file: file,
              width: ITEM_WIDTH,
              height: ITEM_WIDTH * (imgObj.height / imgObj.width),
              x: x,
              y: y,
              rotation: 0,
              scale: 1,
              tags: ['analyzing...'],
              analyzed: false,
              timestamp: Date.now(),
            });
          };
        };
        reader.readAsDataURL(file);
      });
      setMode(AppMode.CANVAS);
    }
  };

  // --- STAR FIELD MEMOIZATION ---
  const stars = React.useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 2 + 1}px`,
        height: `${Math.random() * 2 + 1}px`,
        opacity: Math.random() * 0.5,
        animationDuration: `${Math.random() * 3 + 2}s`,
      },
    }));
  }, []);

  return (
    <div className="w-full h-full relative bg-[#020205] overflow-hidden">
      <AnimatePresence>
        {showGooglePhotos && <GooglePhotosBrowser onClose={() => setShowGooglePhotos(false)} />}
      </AnimatePresence>

      {/* Background Atmosphere - Fixed relative to container */}
      <motion.div
        style={{ x: bgMoveX, y: bgMoveY }}
        className="absolute inset-[-50px] pointer-events-none opacity-30 z-0"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] mix-blend-screen opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />

        {/* Animated Star Field - CSS custom properties require style attribute */}
        {stars.map(star => (
           
          <div
            key={star.id}
            className="star-field-item animate-pulse"
            style={
              {
                '--star-top': star.style.top,
                '--star-left': star.style.left,
                '--star-width': star.style.width,
                '--star-height': star.style.height,
                '--star-opacity': star.style.opacity,
                '--star-duration': star.style.animationDuration,
              } as React.CSSProperties
            }
          />
        ))}
      </motion.div>

      {/* Scrollable Viewport Wrapper */}
      <div
        className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar perspective-1000 z-10"
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
        {/* Flex container to center content but allow scrolling */}
        <div className="min-h-full w-full flex flex-col items-center justify-center py-24">
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative z-10 flex flex-col items-center gap-16"
          >
            {/* 1. TITLE / LOGO (TOP) */}
            <div className="flex flex-col items-center translate-z-60">
              <div className="flex justify-between items-center w-full max-w-2xl px-8 mb-6 opacity-60">
                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-mono text-indigo-300">
                    NEURAL_TEMP: {neuralTemperature.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Snowflake size={12} className="text-rose-400" />
                  <span className="text-[10px] font-mono text-rose-300">
                    SPIRIT: {holidaySpirit.toFixed(0)}%
                  </span>
                </div>
              </div>

              <NeuralLogo />
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.6em] opacity-60 mt-2">
                North_Star_v3 // Neural_Orchestrator
              </p>
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
              />
              <SatelliteButton
                icon={Camera}
                label="Optic_Sensor"
                angle={45}
                onClick={() => setCameraOpen(true)}
                color="text-rose-400"
              />
              <SatelliteButton
                icon={Layers}
                label="Constellation"
                angle={135}
                onClick={() => setMode(AppMode.CANVAS)}
                color="text-indigo-400"
              />
              <SatelliteButton
                icon={Grid}
                label="Vault"
                angle={225}
                onClick={() => setMode(AppMode.ASSETS)}
                color="text-emerald-400"
              />

              {/* The Iris Core */}
              <motion.button
                whileHover="hover"
                whileTap="tap"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-64 h-64 flex items-center justify-center outline-none group"
              >
                {/* Outer Spinner */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-dashed border-slate-700 opacity-60"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 60,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                {/* Mid Spinner (Interactive) */}
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-indigo-500/30 border-t-transparent border-l-transparent"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  variants={{
                    hover: {
                      scale: 1.05,
                      borderColor: 'rgba(99, 102, 241, 0.6)',
                    },
                  }}
                />

                {/* Data Rings */}
                <div className="absolute inset-8 rounded-full border border-white/5 bg-black/40 backdrop-blur-md" />

                {/* The Core Pupil */}
                <motion.div
                  className="relative w-32 h-32 bg-[#0a0a0a] rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20 group-hover:border-indigo-500/50 transition-colors"
                  variants={{ hover: { scale: 1.1 } }}
                >
                  <div className="absolute inset-0 rounded-full bg-indigo-500/5 animate-pulse" />
                  <Aperture
                    size={48}
                    className="text-slate-600 group-hover:text-indigo-400 transition-colors"
                    strokeWidth={1}
                  />

                  <div className="absolute -bottom-10 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] group-hover:text-indigo-400 transition-colors">
                    Upload
                  </div>
                </motion.div>

                {/* Hover Glow */}
                <motion.div
                  className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[60px] opacity-0"
                  variants={{ hover: { opacity: 1 } }}
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
      </div>

      {/* Ingestion Suction Overlay - Fixed to viewport */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="w-[600px] h-[600px] border-[2px] border-dashed border-cyan-400/50 rounded-full absolute"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="w-[400px] h-[400px] border-[4px] border-indigo-500/50 rounded-full absolute"
            />
            <div className="relative z-10 text-3xl font-black text-white uppercase tracking-[0.3em] animate-pulse drop-shadow-[0_0_20px_rgba(99,102,241,1)]">
              Initiate_Ingestion
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SatelliteButton = ({ icon: Icon, label, angle, onClick, color }: any) => {
  const radius = 180; // Distance from center
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  /* MEMOIZED STYLE TO PREVENT LINT WARNINGS */
  const buttonStyle = React.useMemo(
    () => ({
      left: '50%',
      top: '50%',
      x,
      y,
      marginLeft: -32, // half width
      marginTop: -32, // half height
    }),
    [x, y]
  );

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="absolute flex flex-col items-center gap-2 group z-30"
      style={buttonStyle}
    >
      <div
        className={`w-16 h-16 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-xl group-hover:border-white/30 transition-colors relative overflow-hidden`}
      >
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-current transition-opacity ${color}`}
        />
        <Icon
          size={24}
          className={`${color} opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all`}
        />
      </div>
      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded border border-white/5 group-hover:text-white transition-colors">
        {label}
      </span>
    </motion.button>
  );
};
