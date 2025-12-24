
import React from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, ShieldAlert } from 'lucide-react';

export const CouncilLogs: React.FC = () => {
    const logs = useStore(state => state.ui.councilLogs);
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="fixed bottom-24 right-10 z-[200] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-72 h-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
                    >
                        <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between bg-white/5">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-indigo-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Council_Logs</span>
                            </div>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar font-mono text-[9px]">
                            {logs.length === 0 && <div className="text-slate-600 italic">Standby... No transactions detected.</div>}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 leading-relaxed">
                                    <span className="text-slate-600 shrink-0">[{new Date(log.time).toLocaleTimeString([], {hour12: false})}]</span>
                                    <span className={
                                        log.type === 'error' ? 'text-rose-400 font-bold' : 
                                        log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                                    }>
                                        {log.msg}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-all pointer-events-auto backdrop-blur-md shadow-xl"
            >
                {logs.some(l => l.type === 'error') ? <ShieldAlert className="text-rose-500 animate-pulse" size={20} /> : <Activity size={20} />}
            </button>
        </div>
    );
};
