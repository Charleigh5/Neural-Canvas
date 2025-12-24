
import type { ImageAsset } from '../types';

const REPULSION_K = 2.0; // Stronger repulsion to prevent overlap
const VISUAL_WEIGHT_GRAVITY = 0.002; // Very weak gravity for expansive layout
const HOLIDAY_GRAVITY_BOOST = 1.3;

// Helper to sanitize numbers
const safeNum = (n: number, fallback: number = 0) => {
    return (Number.isNaN(n) || !Number.isFinite(n)) ? fallback : n;
};

const calculateVisualWeight = (img: ImageAsset): number => {
    const brightnessFactor = (img.brightness || 0) + 0.5;
    const sizeFactor = (img.width * img.height) / (640 * 480);
    const vibeFactor = (img.vibeScore || 0) + 0.2;
    const manualBoost = img.visualWeightMultiplier || 1;
    
    let holidayBoost = 1.0;
    // Simple tag check without regex for performance
    if (img.tags && img.tags.length > 0) {
        const tagsStr = img.tags.join(' ').toLowerCase();
        if (tagsStr.includes('christmas') || tagsStr.includes('red') || tagsStr.includes('gold')) {
            holidayBoost = HOLIDAY_GRAVITY_BOOST;
        }
    }

    return safeNum(sizeFactor * brightnessFactor * vibeFactor * manualBoost * holidayBoost, 1);
};

const resolveSpatialCollisions = (images: ImageAsset[]): ImageAsset[] => {
    // 1. Shallow copy for performance (vs JSON.parse/stringify). 
    // We only modify top-level x/y, so shallow copy of items is safe enough provided we don't mutate nested objects.
    const nextImages = images.map(img => ({ ...img }));
    
    // 2. Pre-calculate derived data to avoid property access in O(N^2) loop
    const nodes = nextImages.map(img => ({
        ref: img,
        x: safeNum(img.x),
        y: safeNum(img.y),
        radius: (Math.max(img.width * img.scale, img.height * img.scale) / 2) + 20, // +Padding
        weight: calculateVisualWeight(img),
        pinned: !!img.pinned,
        isStack: !!img.isStackChild
    }));

    const centerX = 0;
    const centerY = 0;

    // 3. Simulation Step
    for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.pinned || a.isStack) continue;

        // A. Center Gravity
        const distToCenter = Math.sqrt((a.x - centerX) ** 2 + (a.y - centerY) ** 2);
        
        if (distToCenter > 50) {
            const gx = (centerX - a.x) * VISUAL_WEIGHT_GRAVITY * a.weight;
            const gy = (centerY - a.y) * VISUAL_WEIGHT_GRAVITY * a.weight;
            a.x += gx;
            a.y += gy;
        }

        // B. Collision Repulsion
        for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const b = nodes[j];
            if (b.isStack) continue;

            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = dx * dx + dy * dy;
            
            // Optimization: Avoid sqrt if not needed (compare squared distances)
            const minDist = a.radius + b.radius;
            const minDistSq = minDist * minDist;

            if (distSq < minDistSq && distSq > 0.1) {
                const distance = Math.sqrt(distSq);
                const force = (minDist - distance) * REPULSION_K;
                
                // Normalized vector * force
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                
                // Weight distribution (heavier objects move less)
                const totalWeight = a.weight + b.weight;
                const influence = b.weight / totalWeight;
                
                a.x += fx * influence;
                a.y += fy * influence;
            }
        }
        
        // Write back to the object to be returned
        a.ref.x = safeNum(a.x);
        a.ref.y = safeNum(a.y);
    }

    return nextImages;
};

self.onerror = (e) => {
    console.error("Physics Worker Internal Global Error:", e);
};

self.onmessage = (e: MessageEvent) => {
    const { id, images } = e.data;
    try {
        const result = resolveSpatialCollisions(images);
        self.postMessage({ id, success: true, images: result });
    } catch (error: any) {
        console.error("Physics Worker Internal Error:", error);
        self.postMessage({ id, success: false, error: error.message || "Physics Calculation Failed" });
    }
};
export {};
