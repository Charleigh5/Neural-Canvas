
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Play, Plus, Trash2, X, Sparkles, Film, Layers, Tag, BrainCircuit, Crop, Wand2, Check } from 'lucide-react';

export const SelectionToolbar: React.FC = () => {
    const { 
        selectedIds, setSelectedIds, addToReel, playSelectedAssets, removeImage,
        batchAddTags, batchAnalyze, batchSmartCrop, batchEdit
    } = useStore();

    const [showBatchMenu, setShowBatchMenu] = useState(false);
    const [batchMode, setBatchMode] = useState<'none' | 'tag' | 'edit'>('none');
    const [inputValue, setInputValue] = useState('');

    if (selectedIds.length === 0) return null;

    const handleClear = () => {
        setSelectedIds([]);
        setShowBatchMenu(false);
        setBatchMode('none');
        setInputValue('');
    };
    
    const handleAddToReel = () => {
        addToReel(selectedIds);
        handleClear();
    };

    const handleInstantHighlight = () => {
        playSelectedAssets();
    };

    const handleDelete = () => {
        if (confirm(`Purge ${selectedIds.length} assets from neural memory?`)) {
            selectedIds.forEach(id => removeImage(id));
            handleClear();
        }
    };

    const executeBatch = async () => {
        if (!inputValue.trim() && (batchMode === 'tag' || batchMode === 'edit')) return;
        
        if (batchMode === 'tag') {
            batchAddTags(selectedIds, inputValue);
        } else if (batchMode === 'edit') {
            await batchEdit(selectedIds, inputValue);
        }
        
        setInputValue('');
        setBatchMode('none');
        setShowBatchMenu(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed bottom-32 left-1/2 z-[300] -translate-x-1/2 flex flex-col items-center gap-2">
                
                {/* BATCH MENU DROPDOWN */}
                <AnimatePresence>
                    {showBatchMenu && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 mb-2 shadow-2xl min-w-[300px]"
                        >
                            {batchMode === 'none' ? (
                                <div className="grid grid-cols-4 gap-1">
                                    <BatchActionBtn 
                                        icon={Tag} label="Tag" 
                                        onClick={() => setBatchMode('tag')} 
                                    />
                                    <BatchActionBtn 
                                        icon={BrainCircuit} label="Analyze" 
                                        onClick={() => { batchAnalyze(selectedIds); setShowBatchMenu(false); }} 
                                    />
                                    <BatchActionBtn 
                                        icon={Crop} label="Crop" 
                                        onClick={() => { batchSmartCrop(selectedIds); setShowBatchMenu(false); }} 
                                    />
                                    <BatchActionBtn 
                                        icon={Wand2} label="Remix" 
                                        onClick={() => setBatchMode('edit')} 
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-1">
                                    <button 
                                        onClick={() => setBatchMode('none')}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400"
                                    >
                                        <X size={14} />
                                    </button>
                                    <input 
                                        autoFocus
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && executeBatch()}
                                        placeholder={batchMode === 'tag' ? "Enter tag to apply..." : "Describe transformation..."}
                                        className="bg-transparent border-none outline-none text-xs text-white font-mono flex-1 placeholder-slate-600"
                                    />
                                    <button 
                                        onClick={executeBatch}
                                        disabled={!inputValue.trim()}
                                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
                                    >
                                        <Check size={14} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* MAIN TOOLBAR */}
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="flex items-center gap-2 p-2 bg-black/80 backdrop-blur-2xl border border-indigo-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(99,102,241,0.2)]"
                >
                    <div className="flex items-center gap-3 px-4 border-r border-white/10 mr-1">
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                            {selectedIds.length}
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest hidden md:block">Selected</span>
                    </div>

                    <ActionButton 
                        icon={Layers} 
                        label="Batch Ops" 
                        onClick={() => setShowBatchMenu(!showBatchMenu)} 
                        color={showBatchMenu ? "text-white bg-white/10" : "text-cyan-400"}
                        hoverBg="hover:bg-cyan-900/20"
                    />

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <ActionButton 
                        icon={Plus} 
                        label="Add to Reel" 
                        onClick={handleAddToReel} 
                        color="text-indigo-400"
                        hoverBg="hover:bg-indigo-500/10"
                    />

                    <ActionButton 
                        icon={Film} 
                        label="Instant Highlight" 
                        onClick={handleInstantHighlight} 
                        color="text-emerald-400"
                        hoverBg="hover:bg-emerald-500/10"
                        primary
                    />

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <ActionButton 
                        icon={Trash2} 
                        label="" 
                        onClick={handleDelete} 
                        color="text-rose-500"
                        hoverBg="hover:bg-rose-500/10"
                    />

                    <button 
                        onClick={handleClear}
                        className="p-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const ActionButton = ({ icon: Icon, label, onClick, color, hoverBg, primary = false }: any) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
            flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 group
            ${primary ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : `bg-white/5 ${hoverBg} ${color}`}
        `}
    >
        <Icon size={16} className={primary ? 'text-white' : ''} />
        {label && <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{label}</span>}
    </motion.button>
);

const BatchActionBtn = ({ icon: Icon, label, onClick }: any) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-white/10 transition-colors group"
    >
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-indigo-500 group-hover:text-white text-slate-400 transition-colors">
            <Icon size={16} />
        </div>
        <span className="text-[9px] font-mono text-slate-500 group-hover:text-white uppercase tracking-tighter">{label}</span>
    </button>
);
