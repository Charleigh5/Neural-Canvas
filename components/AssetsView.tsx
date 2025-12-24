import React, { useRef, useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { TiltCard } from "./ui/TiltCard";
import {
  Upload,
  Box,
  Clock,
  Tag,
  Cloud,
  CloudLightning,
  Camera,
  CheckCircle2,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { GooglePhotosBrowser } from "./GooglePhotosBrowser";
import { useImage } from "../hooks/useImage";
import { motion, AnimatePresence } from "framer-motion";

// --- SMART THUMBNAIL COMPONENT ---
// Resolves secure IDB blobs into viewable URLs or draws ImageBitmap
const AssetThumbnail = ({
  url,
  className,
}: {
  url: string;
  className: string;
}) => {
  const [img, status] = useImage(url);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (
      status === "loaded" &&
      img instanceof ImageBitmap &&
      canvasRef.current
    ) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        // Ensure canvas resolution matches image
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        ctx.drawImage(img, 0, 0);
      }
    }
  }, [img, status]);

  if (status === "loading")
    return <div className="absolute inset-0 bg-white/5 animate-pulse" />;
  if (status === "failed" || !img)
    return (
      <div className="absolute inset-0 bg-rose-900/20 flex items-center justify-center text-[8px] text-rose-500">
        ERR
      </div>
    );

  if (img instanceof ImageBitmap) {
    return <canvas ref={canvasRef} className={className} />;
  }

  return (
    <img
      src={(img as HTMLImageElement).src}
      className={className}
      alt="asset"
    />
  );
};

export const AssetsView: React.FC = () => {
  const { images, addImage, selectedIds, setSelectedIds, setCameraOpen } =
    useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGooglePhotos, setShowGooglePhotos] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileProcess = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );

    // GRID CONFIG
    const COLS = 5;
    const CELL_SIZE = 250;

    fileArray.forEach((file: File, index) => {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const x = 100 + col * CELL_SIZE;
      const y = 100 + row * CELL_SIZE;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const imgObj = new window.Image();
        imgObj.src = src;
        imgObj.onload = () => {
          addImage({
            id: Math.random().toString(36).substring(2, 11),
            url: src,
            file: file,
            width: 200,
            height: 200 * (imgObj.height / imgObj.width),
            x: x,
            y: y,
            rotation: 0,
            scale: 1,
            tags: ["imported"],
            analyzed: false,
            timestamp: Date.now(),
          });
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only disable if we are leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files);
    }
  };

  const toggleSelection = (id: string, event: React.MouseEvent) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      setSelectedIds(
        selectedIds.includes(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  return (
    <div
      className="w-full h-full p-8 overflow-y-auto custom-scrollbar bg-[#050505] relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showGooglePhotos && (
        <GooglePhotosBrowser onClose={() => setShowGooglePhotos(false)} />
      )}

      {/* DRAG OVERLAY */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm border-4 border-dashed border-indigo-400/50 flex flex-col items-center justify-center pointer-events-none rounded-3xl m-4"
          >
            <div className="bg-black/80 p-8 rounded-3xl border border-white/10 flex flex-col items-center animate-bounce shadow-2xl backdrop-blur-md">
              <UploadCloud size={64} className="text-indigo-400 mb-4" />
              <span className="text-xl font-black text-white uppercase tracking-[0.2em]">
                Release Payload
              </span>
              <span className="text-xs font-mono text-indigo-300 mt-2">
                Ingesting assets to secure vault...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-4">
              <Box className="text-indigo-500" size={28} />
              INVENTORY_MANIFEST
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">
                Secure_Asset_Vault // System_Ready
              </p>
              {showGooglePhotos && (
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-in slide-in-from-left-2">
                  <Loader2 size={10} className="text-indigo-400 animate-spin" />
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                    Quantum_Bridge_Active
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Total_indexed
              </div>
              <div className="text-lg font-mono text-indigo-400">
                {images.length}
              </div>
            </div>
            {selectedIds.length > 0 && (
              <div className="text-right border-l border-white/10 pl-6">
                <div className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                  Selected_nodes
                </div>
                <div className="text-lg font-mono text-rose-500">
                  {selectedIds.length}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {/* --- PROMINENT UPLOAD BUTTON --- */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square bg-white/5 border-2 border-dashed border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center group hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all cursor-pointer"
            aria-label="Upload images"
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500 shadow-xl">
              <Upload className="text-indigo-400" size={24} />
            </div>
            <span className="text-[10px] font-black text-indigo-300 tracking-[0.3em] uppercase">
              Ingest_Data
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            aria-label="Select images to upload"
          />

          {/* --- GOOGLE PHOTOS CONNECT --- */}
          <button
            onClick={() => setShowGooglePhotos(true)}
            className="aspect-square bg-white/5 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center group hover:bg-slate-800/30 hover:border-slate-500 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500">
              <Cloud className="text-slate-400" size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase text-center px-4 leading-relaxed">
              Connect_Cloud
            </span>
          </button>

          {/* --- CAMERA INPUT --- */}
          <button
            onClick={() => setCameraOpen(true)}
            className="aspect-square bg-rose-500/5 border-2 border-dashed border-rose-500/20 rounded-2xl flex flex-col items-center justify-center group hover:bg-rose-500/10 hover:border-rose-500/50 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-500 shadow-xl">
              <Camera className="text-rose-500" size={24} />
            </div>
            <span className="text-[10px] font-black text-rose-400 tracking-[0.2em] uppercase text-center px-4 leading-relaxed">
              Neural_Optic
            </span>
          </button>

          {/* --- ASSET LIST --- */}
          {images.map((img) => {
            const isSelected = selectedIds.includes(img.id);
            return (
              <TiltCard
                key={img.id}
                className="aspect-square flex flex-col p-0 rounded-2xl group"
                selected={isSelected}
                onClick={(e: any) => toggleSelection(img.id, e)}
              >
                <div className="flex-1 relative overflow-hidden bg-black/40">
                  <AssetThumbnail
                    url={img.url}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                      isSelected
                        ? "scale-110 opacity-100"
                        : "opacity-60 group-hover:opacity-90"
                    }`}
                  />

                  {/* Selection Overlay */}
                  {isSelected && (
                    <div className="absolute top-3 left-3 z-30 bg-indigo-500 text-white p-1 rounded-full shadow-lg border border-indigo-400 animate-in zoom-in duration-200">
                      <CheckCircle2 size={14} />
                    </div>
                  )}

                  {img.analyzed ? (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                  ) : (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
                  )}

                  {img.variantType === "edit" && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-indigo-900/80 border border-indigo-500/50 rounded-md text-[8px] text-indigo-200 font-mono flex items-center gap-1.5 backdrop-blur-md">
                      <CloudLightning size={10} className="text-indigo-400" />{" "}
                      REMIX_V1
                    </div>
                  )}
                </div>
                <div
                  className={`h-20 border-t transition-colors duration-300 p-4 flex flex-col justify-center gap-1.5 ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500/30"
                      : "bg-slate-900/20 border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-white font-black tracking-widest uppercase truncate">
                    <Tag
                      size={12}
                      className={
                        isSelected ? "text-indigo-400" : "text-slate-600"
                      }
                    />
                    <span className="truncate">
                      {img.tags[0] || "INDEXING..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono tracking-tighter">
                    <Clock size={10} className="opacity-50" />
                    <span>
                      {new Date(img.timestamp).toLocaleTimeString()} //{" "}
                      {img.width}x{img.height}
                    </span>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
      {/* Ambient Background Grid Spacing */}
      <div className="h-40" />
    </div>
  );
};
