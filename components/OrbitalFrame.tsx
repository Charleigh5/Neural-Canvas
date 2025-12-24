
import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { AppMode } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Palette, Activity, Snowflake, Menu, 
    Maximize, Minimize, Settings, Bell, Search, Mic, MicOff
} from 'lucide-react';
import { NavigationDock } from './ui/NavigationDock';
import { InspectorPanel } from './InspectorPanel';
import { StudioSequencer } from './StudioSequencer';
import { ThemeStudio } from './ThemeStudio';
import { HighlightConfigPanel } from './HighlightConfigPanel';
import { LiveDirector } from './LiveDirector';
import { CameraCapture } from './CameraCapture';
import { CouncilLogs } from './CouncilLogs';
import { LiveDirectorSession } from '../services/liveService';

interface OrbitalFrameProps {
    children: React.ReactNode;
}

const TelemetryItem = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className="flex flex-col items-center">
        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
        <span className={`text-xs font-mono font-bold ${color}`}>{value}</span>
    </div>
);

export const OrbitalFrame: React.FC<OrbitalFrameProps> = ({ children }) => {
    const { 
        mode, 
        ui, 
        toggleUiPanel, 
        neuralTemperature, 
        holidaySpirit, 
        reel, 
        playReel,
        isCameraOpen,
        setCameraOpen,
        setLiveStatus,
        saveReel,
        loadReel,
        deleteReel,
        clearReel,
        savedReels,
        setBezelTheme,
        setPlaybackSpeed,
        setPlaybackMode,
        setSelectedIds,
        updateImage,
        generateCustomTheme,
        images
    } = useStore();

    const sessionRef = useRef<LiveDirectorSession | null>(null);

    // --- LIVE DIRECTOR SESSION MANAGEMENT ---
    useEffect(() => {
        if (ui.isLiveActive) {
            if (!sessionRef.current) {
                sessionRef.current = new LiveDirectorSession({
                    onMessage: (msg) => console.log('Director:', msg),
                    onStatusChange: (status) => setLiveStatus(status),
                    onToolCall: async (name, args) => {
                        console.log('Tool Call:', name, args);
                        switch (name) {
                            case 'manage_reel':
                                if (args.action === 'SAVE') {
                                    saveReel(args.name || `Reel_${Date.now()}`);
                                    return `Saved reel as ${args.name || 'Untitled'}`;
                                } else if (args.action === 'LOAD') {
                                    const target = savedReels.find(r => r.name.toLowerCase().includes(args.name.toLowerCase()));
                                    if (target) {
                                        loadReel(target.id);
                                        return `Loaded reel: ${target.name}`;
                                    }
                                    return `Could not find reel named ${args.name}`;
                                } else if (args.action === 'CLEAR') {
                                    clearReel();
                                    return "Reel cleared.";
                                }
                                return "Action not recognized.";

                            case 'adjust_environment':
                                if (args.theme) setBezelTheme(args.theme);
                                if (args.speed) setPlaybackSpeed(args.speed);
                                if (args.mode) setPlaybackMode(args.mode);
                                return "Environment adjusted.";

                            case 'select_assets':
                                // Mock semantic selection logic (normally would use vector search)
                                if (args.action === 'SELECT') {
                                    const allIds = images.map(i => i.id);
                                    setSelectedIds(allIds.slice(0, 5)); // Just select first 5 for now
                                    return "Selected assets.";
                                }
                                if (args.action === 'DESELECT') {
                                    setSelectedIds([]);
                                    return "Deselected all.";
                                }
                                return "Selection updated.";

                            case 'modify_assets':
                                const targets = args.ids || useStore.getState().selectedIds;
                                if (targets.length === 0) return "No assets selected.";
                                targets.forEach((id: string) => updateImage(id, {
                                    brightness: args.brightness,
                                    contrast: args.contrast,
                                    saturation: args.saturation,
                                    blur: args.blur,
                                    hue: args.hue
                                }));
                                return `Modified ${targets.length} assets.`;

                            case 'generate_theme':
                                await generateCustomTheme(args.prompt);
                                return "Theme generated and applied.";

                            default:
                                return "Tool not implemented.";
                        }
                    }
                });
                sessionRef.current.start();
            }
        } else {
            if (sessionRef.current) {
                sessionRef.current.stop();
                sessionRef.current = null;
            }
        }
        return () => {
            // Cleanup on unmount
            if (sessionRef.current) {
                sessionRef.current.stop();
                sessionRef.current = null;
            }
        };
    }, [ui.isLiveActive, images, savedReels]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black text-white flex flex-col">
            
            {/* --- COMMAND DECK (HEADER) --- */}
            {mode !== AppMode.PLAYER && (
                <div className="h-14 border-b border-white/10 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-6 z-50 shrink-0">
                    
                    {/* LEFT: SYSTEM STATUS */}
                    <div className="flex items-center gap-6 w-1/3">
                        <div className="flex items-center gap-2">
                            <Menu size={18} className="text-slate-400 hover:text-white cursor-pointer" onClick={() => toggleUiPanel('isSidebarOpen')} />
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/80">Studio.OS</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <div className={`w-1.5 h-1.5 rounded-full ${neuralTemperature > 0 ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[8px] font-mono text-slate-400 uppercase">
                                {neuralTemperature > 0 ? 'Processing...' : 'System_Ready'}
                            </span>
                        </div>
                    </div>

                    {/* CENTER: SEARCH / ORMNI-BAR */}
                    <div className="flex-1 flex justify-center">
                        <div className="relative w-96 group">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-black/50 border border-white/10 rounded-full flex items-center px-4 py-2 gap-3 transition-colors group-hover:border-indigo-500/30">
                                <Search size={14} className="text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search assets, tags, or neural commands..." 
                                    className="bg-transparent border-none outline-none text-[10px] font-mono text-white placeholder-slate-600 w-full"
                                />
                                <div className="text-[8px] font-black text-slate-700 border border-slate-800 px-1.5 rounded bg-black">⌘K</div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: ACTIONS & TELEMETRY */}
                    <div className="flex items-center justify-end gap-4 w-1/3">
                        
                        <div className="hidden md:flex items-center gap-4 bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
                             <TelemetryItem label="NEURAL" value={`${Math.round(neuralTemperature)}%`} color="text-indigo-400" />
                             <div className="w-px h-3 bg-white/10" />
                             <TelemetryItem label="SPIRIT" value={`${Math.round(holidaySpirit)}%`} color="text-rose-400" />
                        </div>

                        <div className="flex items-center gap-2">
                            {/* LIVE DIRECTOR TOGGLE */}
                            <motion.button
                                onClick={() => toggleUiPanel('isLiveActive')}
                                whileHover={{ scale: 1.05 }}
                                className={`p-2 rounded-full transition-colors border ${ui.isLiveActive ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 animate-pulse' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}
                            >
                                {ui.isLiveActive ? <Mic size={16} /> : <MicOff size={16} />}
                            </motion.button>

                            <motion.button
                                onClick={() => toggleUiPanel('isThemeStudioOpen')}
                                whileHover={{ scale: 1.05 }}
                                className="p-2 text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 rounded-full transition-colors border border-indigo-500/20"
                            >
                                <Palette size={16} />
                            </motion.button>
                            
                            <motion.button
                                onClick={() => { if(reel.length > 0) playReel(); }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={reel.length === 0}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full transition-all shadow-lg
                                    ${reel.length > 0 
                                        ? 'bg-emerald-500/10 border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                                        : 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'}
                                `}
                            >
                                <Play size={12} fill="currentColor" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Play</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN VIEWPORT --- */}
            <div className="flex-1 relative overflow-hidden flex">
                
                {/* CANVAS/CONTENT */}
                <div className="flex-1 relative z-0">
                    {children}
                </div>

                {/* RIGHT SIDEBAR (INSPECTOR) */}
                <AnimatePresence>
                    {ui.isInspectorOpen && mode === AppMode.CANVAS && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="h-full border-l border-white/10 bg-[#050505] z-10 flex flex-col shadow-2xl relative"
                        >
                            <div className="absolute top-0 left-0 bottom-0 w-px bg-indigo-500/20 shadow-[0_0_10px_#6366f1]" />
                            <InspectorPanel />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- SEQUENCER (BOTTOM PANEL) --- */}
            <AnimatePresence>
                {ui.isTimelineOpen && mode === AppMode.CANVAS && (
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: 220 }}
                        exit={{ height: 0 }}
                        className="border-t border-white/10 bg-[#08080a] z-20 shrink-0 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
                    >
                        <StudioSequencer />
                        <button 
                            onClick={() => toggleUiPanel('isTimelineOpen')}
                            className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-3 bg-[#08080a] rounded-t-lg border-t border-l border-r border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer"
                        >
                            <div className="w-6 h-0.5 bg-slate-600 rounded-full" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- FLOATING UI ELEMENTS --- */}
            
            {/* Live Director (Always present, state controlled) */}
            <LiveDirector />

            {/* Council Logs Terminal */}
            {mode !== AppMode.PLAYER && <CouncilLogs />}

            {/* Navigation Dock (Floating Bottom) */}
            {mode !== AppMode.PLAYER && !isCameraOpen && <NavigationDock />}

            {/* --- MODALS & OVERLAYS --- */}
            <AnimatePresence>
                {ui.isThemeStudioOpen && <ThemeStudio onClose={() => toggleUiPanel('isThemeStudioOpen')} />}
            </AnimatePresence>

            {isCameraOpen && <CameraCapture onClose={() => setCameraOpen(false)} />}

        </div>
    );
};
