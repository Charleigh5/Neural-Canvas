import React, { useRef, useState, useEffect } from 'react';
import Konva from 'konva';
import { Group, Line } from 'react-konva';
import { ImageAsset } from '../../types';
import { canvasWorker } from '../../services/canvasWorkerService';

/**
 * SynapticLayer - Visualizes AI Reasoning between images
 * Extracted from InfiniteCanvas for better code organization and memoization
 */

export interface SynapseLineData {
  key: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

interface SynapticLayerProps {
  images: ImageAsset[];
  hoveredId: string | null;
}

export const SynapticLayer = React.memo(function SynapticLayerInner({
  images,
  hoveredId,
}: SynapticLayerProps) {
  const groupRef = useRef<Konva.Group>(null);
  const [lines, setLines] = useState<SynapseLineData[]>([]);

  // Offload complex O(N^2) graph calculations to the worker thread
  useEffect(() => {
    let isMounted = true;

    const compute = async () => {
      try {
        // Ensure worker is available before calling
        if (canvasWorker) {
          const result = await canvasWorker.calculateSynapses(images, hoveredId);
          if (isMounted) {
            setLines(result || []);
          }
        }
      } catch (e) {
        console.debug('Synapse calculation skipped', e);
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
        } catch {
          node.clearCache();
        }
      }
    }
  }, [lines]);

  return (
    <Group ref={groupRef} listening={false}>
      {lines.map(line => (
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
});
