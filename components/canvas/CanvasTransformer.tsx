import React, { useRef, useEffect } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { useStore } from '../../store/useStore';

interface CanvasTransformerProps {
  selectedIds: string[];
}

export const CanvasTransformer: React.FC<CanvasTransformerProps> = ({ selectedIds }) => {
  const trRef = useRef<Konva.Transformer>(null);
  const updateImage = useStore(state => state.updateImage);

  useEffect(() => {
    if (!trRef.current) return;

    const stage = trRef.current.getStage();
    if (!stage) return;

    const transformer = trRef.current;
    const selectedNodes: Konva.Node[] = [];

    selectedIds.forEach(id => {
      const node = stage.findOne('#' + id);
      if (node) {
        selectedNodes.push(node);
      }
    });

    transformer.nodes(selectedNodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds]);

  const handleTransformEnd = () => {
    const transformer = trRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    nodes.forEach(node => {
      const id = node.id();
      if (id) {
        // Get the new attributes
        const scaleX = node.scaleX();
        const rotation = node.rotation();
        const x = node.x();
        const y = node.y();

        // Update store
        // Note: We reset scale to 1 on the node and update 'width'/'height'?
        // OR we keep scale property.
        // Our ImageAsset has 'scale' property. CanvasNode uses 'scaleX={image.scale}'.
        // Transformer changes scaleX/scaleY.

        // If we want to persist uniform scale:
        // We should probably averaging scaleX/Y or assuming locked aspect ratio.
        // But Transformer might distort aspect ratio if not configured.

        // Let's assume we want to keep using 'scale' property in store.
        // We take the new scaleX (assuming uniform) and update store.

        updateImage(id, {
          x,
          y,
          rotation,
          scale: scaleX,
        });

        // Reset node scale to match store?
        // The store update will trigger a re-render of CanvasNode with new props.
        // React-Konva will update the node.
        // So we don't need to manually reset the node, just update the data source.
      }
    });
  };

  return (
    <Transformer
      ref={trRef}
      keepRatio={true}
      boundBoxFunc={(oldBox, newBox) => {
        // Limit minimum size
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
      onTransformEnd={handleTransformEnd}
      // Style the handles
      anchorSize={10}
      anchorCornerRadius={5}
      anchorStroke="#6366f1" // Indigo-500
      anchorStrokeWidth={1}
      anchorFill="#ffffff"
      borderStroke="#6366f1"
      borderStrokeWidth={1}
      rotateAnchorOffset={30} // Distance for rotation handle
      enabledAnchors={[
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'middle-left',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ]}
    />
  );
};
