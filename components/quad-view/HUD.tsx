import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, MapPin, Thermometer, Wind, Music } from "lucide-react";
import { ImageAsset, BezelTheme } from "../../types";
import { useStore } from "../../store/useStore";

// 1. Neural Sentiment Scanner (Naughty/Nice)
export const NeuralSentimentScanner = ({
  theme,
  asset,
}: {
  theme: BezelTheme;
  asset?: ImageAsset;
}) => {
  if (theme !== "christmas" || !asset) return null;

  const naughtyKeywords = [
    "dark",
    "error",
    "night",
    "red",
    "industrial",
    "grunge",
    "metal",
    "rust",
  ];
  const niceKeywords = [
    "snow",
    "light",
    "day",
    "nature",
    "tree",
    "green",
    "gold",
    "happy",
  ];

  let sentiment = 0;
  asset.tags.forEach((t) => {
    const lower = t.toLowerCase();
    if (naughtyKeywords.some((k) => lower.includes(k))) sentiment -= 1;
    if (niceKeywords.some((k) => lower.includes(k))) sentiment += 1;
  });

  const isNaughty = sentiment < 0;

  const verdict = isNaughty ? "NAUGHTY" : "NICE";
  const colorClass = isNaughty
    ? "text-red-500 border-red-500/50"
    : "text-green-500 border-green-500/50";
  const glowClass = isNaughty ? "shadow-red-900/40" : "shadow-green-900/40";
  const iconClass = isNaughty ? "text-red-400" : "text-green-400";

  return (
    <div className="absolute bottom-8 left-8 z-[70] pointer-events-none">
      <div
        className={`bg-black/90 backdrop-blur-xl border ${colorClass} p-4 rounded-lg shadow-2xl ${glowClass} shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500`}
      >
        <div className="flex items-center justify-between gap-4 mb-3 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Radar
              size={14}
              className={`${iconClass} ${
                isNaughty ? "animate-pulse" : "animate-spin-slow"
              }`}
            />
            <span
              className={`text-[10px] font-mono ${iconClass} tracking-widest`}
            >
              SENTIMENT_SCANNER
            </span>
          </div>
          <div className="text-[9px] text-gray-500 font-mono">
            ID::{asset.id.substring(0, 4)}
          </div>
        </div>

        <div className="relative h-20 w-48 bg-black/50 rounded-md overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px]" />

          <AnimatePresence mode="wait">
            <motion.div
              key={asset.id}
              initial={{
                scale: 3,
                rotate: -25,
                opacity: 0,
                filter: "blur(10px)",
              }}
              animate={{
                scale: 1,
                rotate: -8,
                opacity: 1,
                filter: "blur(0px)",
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className={`relative z-10 text-5xl font-black tracking-tighter border-4 px-2 py-0 transform ${colorClass} border-current opacity-90`}
              style={{
                textShadow: `0 0 30px ${isNaughty ? "red" : "#22c55e"}`,
                boxShadow: `0 0 20px ${
                  isNaughty ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"
                }`,
              }}
            >
              {verdict}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-3 flex justify-between items-end">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] text-gray-500 font-mono">
              TAG_ANALYSIS
            </span>
            <div className="flex gap-1 max-w-[120px] overflow-hidden">
              {asset.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className={`text-[8px] px-1 rounded ${
                    isNaughty
                      ? "bg-red-900/30 text-red-300"
                      : "bg-green-900/30 text-green-300"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-0.5 items-end">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 4 }}
                animate={{ height: 4 + Math.random() * 8 }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5,
                  repeatType: "reverse",
                }}
                className={`w-1 rounded-sm ${
                  i < (isNaughty ? 4 : 5)
                    ? isNaughty
                      ? "bg-red-500"
                      : "bg-green-500"
                    : "bg-gray-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Polar Telemetry Module (Refined with Spectral Visualizer)
export const PolarTelemetry = ({ theme }: { theme: BezelTheme }) => {
  const { playback } = useStore();
  if (theme !== "christmas") return null;

  return (
    <div className="absolute top-8 right-8 z-[70] pointer-events-none flex flex-col gap-2">
      <div className="bg-black/80 backdrop-blur-xl border-l-2 border-cyan-400 p-3 rounded-r-lg shadow-2xl flex flex-col gap-2 w-40">
        <div className="flex justify-between items-center text-[9px] font-mono text-cyan-300">
          <span className="flex items-center gap-1 opacity-50">
            <MapPin size={8} /> LOC
          </span>
          <span className="font-bold tracking-tighter">NORTH_POLE_SEC_01</span>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-cyan-300">
          <span className="flex items-center gap-1 opacity-50">
            <Thermometer size={8} /> TEMP
          </span>
          <span className="font-bold">-42.8°C</span>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-cyan-300">
          <span className="flex items-center gap-1 opacity-50">
            <Wind size={8} /> WIND
          </span>
          <span className="font-bold text-amber-400">GUST_STORM</span>
        </div>

        {/* Spectral Monitor */}
        <div className="mt-2 border-t border-white/5 pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[7px] text-cyan-600 font-bold tracking-widest uppercase">
              Sonic_Spectra
            </span>
            <Music size={8} className="text-cyan-600 animate-pulse" />
          </div>
          <div className="flex items-end justify-between h-8 bg-black/40 rounded px-1.5 py-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-1 rounded-full ${
                  playback.isPlaying ? "bg-cyan-500" : "bg-slate-700 opacity-20"
                }`}
                initial={{ height: 2 }}
                animate={{
                  height: playback.isPlaying
                    ? [2, 4 + Math.random() * 20, 2]
                    : 2,
                  opacity: playback.isPlaying ? [0.4, 1, 0.4] : 0.2,
                }}
                transition={{
                  duration: 0.2 + Math.random() * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Holo-Gift Unboxing Transition
export const GiftUnboxOverlay = ({
  theme,
  assetId,
}: {
  theme: BezelTheme;
  assetId?: string;
}) => {
  if (theme !== "christmas") return null;
  return (
    <motion.div
      key={assetId}
      initial={{ clipPath: "circle(150% at 50% 50%)" }}
      animate={{ clipPath: "circle(0% at 50% 50%)" }}
      transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
      className="absolute inset-0 z-[65] pointer-events-none"
      style={{
        background:
          "radial-gradient(circle, rgba(250,204,21,0.1) 0%, rgba(185,28,28,0.4) 100%)",
        boxShadow: "inset 0 0 100px rgba(0,0,0,0.8)",
      }}
    >
      <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
      <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl drop-shadow-[0_0_30px_rgba(250,204,21,1)]">
        🎁
      </div>
    </motion.div>
  );
};

// 4. Cinematic Caption Overlay (New)
export const CaptionOverlay = ({
  caption,
  show,
}: {
  caption?: string;
  show: boolean;
}) => {
  return (
    <AnimatePresence>
      {show && caption && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-16 left-0 right-0 flex justify-center z-[65] pointer-events-none"
        >
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full shadow-2xl">
            <span className="text-sm font-medium text-white/90 font-serif tracking-wide italic text-center">
              {caption}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
