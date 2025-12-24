import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Stage, Layer, Line, Group } from "react-konva";
import Konva from "konva";
import { useStore } from "../store/useStore";
import { ImageAsset } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingNanoForge } from "./FloatingNanoForge";
import { SelectionToolbar } from "./SelectionToolbar";
import { useShallow } from "zustand/react/shallow";
import { UploadCloud } from "lucide-react";
import { MidnightGrid } from "./canvas/MidnightGrid";
import { CanvasNode } from "./canvas/CanvasNode";
import { canvasWorker } from "../services/canvasWorkerService";

const getDistance = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
const getCenter = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

// --- SYNAPTIC LAYER: Visualizes AI Reasoning ---
const SynapticLayer = React.memo(
  ({
    images,
    hoveredId,
  }: {
    images: ImageAsset[];
    hoveredId: string | null;
  }) => {
    const groupRef = useRef<Konva.Group>(null);
    const [lines, setLines] = useState<any[]>([]);

    // Offload complex O(N^2) graph calculations to the worker thread
    useEffect(() => {
      let isMounted = true;

      const compute = async () => {
        try {
          // Ensure worker is available before calling
          if (canvasWorker) {
            const result = await canvasWorker.calculateSynapses(
              images,
              hoveredId
            );
            if (isMounted) {
              setLines(result || []);
            }
          }
        } catch (e) {
          console.debug("Synapse calculation skipped", e);
        }
      };

      compute();

      return () => {
        isMounted = false;
      };
    }, [images, hoveredId]);

    // Handle GPU Caching for the static vector lines
    useEffect(() => {
      const node = groupRef.current;
      if (node) {
        node.clearCache();
        if (lines.length > 0) {
          try {
            node.cache({ pixelRatio: 1 });
          } catch (e) {
            node.clearCache();
          }
        }
      }
    }, [lines]);

    return (
      <Group ref={groupRef} listening={false}>
        {lines.map((line) => (
          <Line
            key={line.key}
            points={line.points}
            stroke={line.stroke}
            strokeWidth={line.strokeWidth}
            opacity={line.opacity}
            listening={false}
            tension={0.5}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        ))}
      </Group>
    );
  }
);

export const InfiniteCanvas: React.FC = () => {
  const images = useStore(useShallow((state) => state.images));
  const selectedIds = useStore(useShallow((state) => state.selectedIds));
  const activeTool = useStore((state) => state.activeTool);
  const forgeImageId = useStore((state) => state.forgeImageId);
  const addImage = useStore((state) => state.addImage);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [forgeAnchor, setForgeAnchor] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const [snapLines, setSnapLines] = useState<
    Array<{ vertical: boolean; x?: number; y?: number }>
  >([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number>(0);

  // Keep refs for performant drag operations without re-rendering
  const imagesRef = useRef(images);
  const scaleRef = useRef(scale);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const snapFunc = useCallback(
    (pos: { x: number; y: number }, activeId: string) => {
      const scaleVal = scaleRef.current;
      const BASE_THRESHOLD = 10 / scaleVal;
      const GRID = 100;

      const active = imagesRef.current.find((i) => i.id === activeId);
      if (!active) return pos;

      const w = active.width * active.scale;
      const h = active.height * active.scale;

      const getSnapStrength = (target: ImageAsset) => {
        let strength = 1.0;
        const targetArea =
          target.width * target.scale * (target.height * target.scale);
        const activeArea = w * h;
        if (targetArea > activeArea * 1.5) strength += 0.5;
        if (targetArea > activeArea * 3.0) strength += 0.8;
        if (active.tags && target.tags) {
          const commonTags = active.tags.some(
            (t) =>
              t.length > 2 &&
              !["image", "photo", "upload", "generated"].includes(t) &&
              target.tags.includes(t)
          );
          if (commonTags) strength += 2.0;
        }
        return strength;
      };

      let newX = pos.x;
      let newY = pos.y;
      const newLines: Array<{ vertical: boolean; x?: number; y?: number }> = [];
      const xOffsets = [0, w / 2, w];
      const yOffsets = [0, h / 2, h];

      // --- X AXIS ---
      let bestDistX = BASE_THRESHOLD;
      let bestX = pos.x;
      let snappedX = false;
      let guideX: number | null = null;

      // 1. Grid Snapping
      for (const offset of xOffsets) {
        const edgeX = pos.x + offset;
        const rounded = Math.round(edgeX / GRID) * GRID;
        const diff = Math.abs(edgeX - rounded);
        if (diff < bestDistX) {
          bestDistX = diff;
          bestX = rounded - offset;
          snappedX = true;
          guideX = rounded;
        }
      }

      // 2. Object Snapping
      const searchBuffer = w + 600;
      imagesRef.current.forEach((other) => {
        if (other.id === activeId || other.isStackChild) return;
        if (Math.abs(other.x - pos.x) > searchBuffer) return;

        const strength = getSnapStrength(other);
        const effectiveThreshold = BASE_THRESHOLD * strength;
        const ow = other.width * other.scale;
        const otherEdges = [other.x, other.x + ow / 2, other.x + ow];

        xOffsets.forEach((offsetA) => {
          otherEdges.forEach((edgeB) => {
            const currentX = pos.x + offsetA;
            const diff = Math.abs(currentX - edgeB);
            if (diff < effectiveThreshold) {
              if (diff < bestDistX) {
                bestDistX = diff;
                bestX = edgeB - offsetA;
                snappedX = true;
                guideX = edgeB;
              }
            }
          });
        });
      });

      if (snappedX && guideX !== null) {
        newX = bestX;
        newLines.push({ vertical: true, x: guideX });
      }

      // --- Y AXIS ---
      let bestDistY = BASE_THRESHOLD;
      let bestY = pos.y;
      let snappedY = false;
      let guideY: number | null = null;

      for (const offset of yOffsets) {
        const edgeY = pos.y + offset;
        const rounded = Math.round(edgeY / GRID) * GRID;
        const diff = Math.abs(edgeY - rounded);
        if (diff < bestDistY) {
          bestDistY = diff;
          bestY = rounded - offset;
          snappedY = true;
          guideY = rounded;
        }
      }

      const hBuffer = h + 600;
      imagesRef.current.forEach((other) => {
        if (other.id === activeId || other.isStackChild) return;
        if (Math.abs(other.y - pos.y) > hBuffer) return;

        const strength = getSnapStrength(other);
        const effectiveThreshold = BASE_THRESHOLD * strength;
        const oh = other.height * other.scale;
        const otherEdges = [other.y, other.y + oh / 2, other.y + oh];

        yOffsets.forEach((offsetA) => {
          otherEdges.forEach((edgeB) => {
            const currentY = pos.y + offsetA;
            const diff = Math.abs(currentY - edgeB);
            if (diff < effectiveThreshold) {
              if (diff < bestDistY) {
                bestDistY = diff;
                bestY = edgeB - offsetA;
                snappedY = true;
                guideY = edgeB;
              }
            }
          });
        });
      });

      if (snappedY && guideY !== null) {
        newY = bestY;
        newLines.push({ vertical: false, y: guideY });
      }

      setSnapLines(newLines);
      return { x: newX, y: newY };
    },
    []
  );

  const handleDragEnd = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      useStore.getState().updateImage(id, pos);
      setSnapLines([]);
    },
    []
  );

  const handleSelect = useCallback((id: string, multi: boolean) => {
    const currentSelected = useStore.getState().selectedIds;
    useStore.getState().setSelectedIds(multi ? [...currentSelected, id] : [id]);
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const oldScale = scale;
      const pointer = stageRef.current?.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };
      const newScale = Math.min(
        Math.max(e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1, 0.02),
        10
      );
      setScale(newScale);
      setPosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    } else {
      setPosition((prev) => ({
        x: prev.x - e.evt.deltaX,
        y: prev.y - e.evt.deltaY,
      }));
    }
  };

  const handleTouchMove = (e: any) => {
    const touches = e.evt.touches;
    if (touches.length === 2) {
      e.evt.preventDefault();
      const p1 = { x: touches[0].clientX, y: touches[0].clientY };
      const p2 = { x: touches[1].clientX, y: touches[1].clientY };
      const center = getCenter(p1, p2);
      const dist = getDistance(p1, p2);
      if (!lastCenter.current) {
        lastCenter.current = center;
        lastDist.current = dist;
        return;
      }
      const pointTo = {
        x: (lastCenter.current.x - position.x) / scale,
        y: (lastCenter.current.y - position.y) / scale,
      };
      const newScale = Math.min(
        Math.max(scale * (dist / lastDist.current), 0.02),
        10
      );
      setScale(newScale);
      setPosition({
        x: center.x - pointTo.x * newScale,
        y: center.y - pointTo.y * newScale,
      });
      lastDist.current = dist;
      lastCenter.current = center;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    const stage = stageRef.current;
    if (!stage) return;

    stage.setPointersPositions(e);
    const pointerPos = stage.getPointerPosition();

    let dropX = 0;
    let dropY = 0;

    if (pointerPos) {
      dropX = (pointerPos.x - position.x) / scale;
      dropY = (pointerPos.y - position.y) / scale;
    } else {
      dropX = -position.x / scale + window.innerWidth / 2 / scale;
      dropY = -position.y / scale + window.innerHeight / 2 / scale;
    }

    const files = Array.from(e.dataTransfer.files).filter((f: File) =>
      f.type.startsWith("image/")
    );

    // GRID LAYOUT CONFIGURATION
    const COLS = 5;
    const ITEM_WIDTH = 320;
    const GAP = 40;
    // Estimate row height based on width, though actual height depends on image aspect
    const ROW_ESTIMATE = 320 + GAP;

    files.forEach((file: File, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      // Calculate grid position relative to drop point
      const offsetX = col * (ITEM_WIDTH + GAP);
      const offsetY = row * ROW_ESTIMATE;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const imgObj = new window.Image();
        imgObj.src = src;
        imgObj.onload = () => {
          addImage({
            id: Math.random().toString(36).substring(2, 11),
            url: src,
            file,
            width: ITEM_WIDTH,
            height: ITEM_WIDTH * (imgObj.height / imgObj.width),
            x: dropX + offsetX,
            y: dropY + offsetY,
            scale: 1,
            rotation: 0,
            tags: ["dropped"],
            analyzed: false,
            timestamp: Date.now(),
          });
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleNodeDblClick = useCallback(
    (img: ImageAsset, pos: { x: number; y: number }) => {
      setForgeAnchor(pos);
      useStore.getState().setForgeImageId(img.id);
    },
    []
  );

  return (
    <div
      className="w-full h-full bg-[#050508] relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchStart={() => setIsInteracting(true)}
        onTouchEnd={() => setIsInteracting(false)}
      >
        <Layer>
          <MidnightGrid
            scale={scale}
            x={position.x}
            y={position.y}
            width={window.innerWidth}
            height={window.innerHeight}
            isInteracting={isInteracting}
          />
          <SynapticLayer images={images} hoveredId={hoveredNodeId} />
          {images.map((img) => (
            <Group
              key={img.id}
              onMouseEnter={() => setHoveredNodeId(img.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              <CanvasNode
                image={img}
                isSelected={selectedIds.includes(img.id)}
                activeTool={activeTool}
                snapFunc={snapFunc}
                onSelect={handleSelect}
                onDblClick={handleNodeDblClick}
                onDragEnd={handleDragEnd}
              />
            </Group>
          ))}
          {snapLines.map((line, i) => (
            <Line
              key={i}
              points={
                line.vertical
                  ? [line.x!, -100000, line.x!, 100000]
                  : [-100000, line.y!, 100000, line.y!]
              }
              stroke="#22d3ee"
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
              opacity={0.8}
            />
          ))}
        </Layer>
      </Stage>

      <SelectionToolbar />

      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm border-4 border-dashed border-indigo-400 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="bg-black/60 p-8 rounded-3xl border border-white/10 flex flex-col items-center animate-bounce shadow-2xl">
              <UploadCloud size={64} className="text-indigo-400 mb-4" />
              <span className="text-xl font-black text-white uppercase tracking-[0.2em]">
                Drop Media Here
              </span>
              <span className="text-xs font-mono text-indigo-300 mt-2">
                Ingesting to Neural Canvas...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {forgeImageId && (
          <FloatingNanoForge
            image={images.find((i) => i.id === forgeImageId)!}
            anchorPosition={forgeAnchor}
            onClose={() => useStore.getState().setForgeImageId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
