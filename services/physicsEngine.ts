
import { ImageAsset } from '../types';
import { useStore } from '../store/useStore';

/**
 * PHYSICS_ENGINE.TS (BRIDGE)
 * Connects the main thread to the high-performance Physics Web Worker.
 */

// --- INLINED WORKER CODE TO BYPASS CORS/PATH ISSUES ---
const WORKER_CODE = `
const REPULSION_K = 2.0;
const VISUAL_WEIGHT_GRAVITY = 0.002;
const HOLIDAY_GRAVITY_BOOST = 1.3;

const safeNum = (n, fallback = 0) => (Number.isNaN(n) || !Number.isFinite(n)) ? fallback : n;

const calculateVisualWeight = (img) => {
    const brightnessFactor = (img.brightness || 0) + 0.5;
    const sizeFactor = (img.width * img.height) / (640 * 480);
    const vibeFactor = (img.vibeScore || 0) + 0.2;
    const manualBoost = img.visualWeightMultiplier || 1;
    let holidayBoost = 1.0;
    if (img.tags && img.tags.length > 0) {
        const tagsStr = img.tags.join(' ').toLowerCase();
        if (tagsStr.includes('christmas') || tagsStr.includes('red') || tagsStr.includes('gold')) {
            holidayBoost = HOLIDAY_GRAVITY_BOOST;
        }
    }
    return safeNum(sizeFactor * brightnessFactor * vibeFactor * manualBoost * holidayBoost, 1);
};

const resolveSpatialCollisions = (images) => {
    const nextImages = images.map(img => ({ ...img }));
    const nodes = nextImages.map(img => ({
        ref: img,
        x: safeNum(img.x),
        y: safeNum(img.y),
        radius: (Math.max(img.width * img.scale, img.height * img.scale) / 2) + 20,
        weight: calculateVisualWeight(img),
        pinned: !!img.pinned,
        isStack: !!img.isStackChild
    }));
    const centerX = 0;
    const centerY = 0;

    for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.pinned || a.isStack) continue;
        
        const distToCenter = Math.sqrt((a.x - centerX) ** 2 + (a.y - centerY) ** 2);
        if (distToCenter > 50) {
            const gx = (centerX - a.x) * VISUAL_WEIGHT_GRAVITY * a.weight;
            const gy = (centerY - a.y) * VISUAL_WEIGHT_GRAVITY * a.weight;
            a.x += gx;
            a.y += gy;
        }

        for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const b = nodes[j];
            if (b.isStack) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = dx * dx + dy * dy;
            const minDist = a.radius + b.radius;
            const minDistSq = minDist * minDist;
            if (distSq < minDistSq && distSq > 0.1) {
                const distance = Math.sqrt(distSq);
                const force = (minDist - distance) * REPULSION_K;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                const totalWeight = a.weight + b.weight;
                const influence = b.weight / totalWeight;
                a.x += fx * influence;
                a.y += fy * influence;
            }
        }
        a.ref.x = safeNum(a.x);
        a.ref.y = safeNum(a.y);
    }
    return nextImages;
};

self.onerror = (e) => { console.error("Physics Worker Error:", e); };
self.onmessage = (e) => {
    const { id, images } = e.data;
    try {
        const result = resolveSpatialCollisions(images);
        self.postMessage({ id, success: true, images: result });
    } catch (error) {
        self.postMessage({ id, success: false, error: error.message });
    }
};
`;

let workerPromise: Promise<Worker | null> | null = null;
let reqId = 0;
const pendingRequests = new Map<number, { resolve: (images: ImageAsset[]) => void, reject: (err: any) => void }>();

const getPhysicsWorker = async (): Promise<Worker | null> => {
    if (!workerPromise) {
        workerPromise = (async () => {
            try {
                // Create worker from Blob to avoid CORS/Path issues
                const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
                const workerUrl = URL.createObjectURL(blob);
                const worker = new Worker(workerUrl);

                worker.onmessage = (e: MessageEvent) => {
                    const { id, success, images, error } = e.data;
                    if (pendingRequests.has(id)) {
                        const { resolve, reject } = pendingRequests.get(id)!;
                        if (success) {
                            resolve(images);
                        } else {
                            let errMsg = 'Physics Calc Failed';
                            if (error) errMsg = typeof error === 'string' ? error : error.message ?? JSON.stringify(error);
                            
                            // Log quietly to avoid spamming the HUD
                            console.warn('Physics Worker Reported Error', error);
                            resolve(images); // Fail graceful
                        }
                        pendingRequests.delete(id);
                    }
                };

                worker.onerror = (e: ErrorEvent | Event) => {
                    console.error('Physics Worker CRITICAL Error', e);
                    let msg = 'Physics Worker Crashed';
                    const evt = e as any;
                    if (evt instanceof ErrorEvent) msg = evt.message;
                    else if ('message' in evt) msg = evt.message;
                    
                    useStore.getState().addCouncilLog(msg, 'error');
                    
                    // CRITICAL: Reject all pending requests to prevent Deadlock
                    for (const [id, { reject }] of pendingRequests.entries()) {
                        reject(new Error("Worker terminated unexpectedly"));
                    }
                    pendingRequests.clear();
                    workerPromise = null;
                };

                return worker;
            } catch (e: any) {
                console.error("Failed to init Physics Worker:", e);
                useStore.getState().addCouncilLog(`Physics Init Failed: ${e?.message}`, 'error');
                return null;
            }
        })();
    }
    return workerPromise;
};

export const resolveSpatialCollisions = async (images: ImageAsset[]): Promise<ImageAsset[]> => {
    const w = await getPhysicsWorker();
    if (!w) return images; 

    const currentId = ++reqId;
    
    return new Promise<ImageAsset[]>((resolve, reject) => {
        pendingRequests.set(currentId, { resolve, reject });
        
        // Strip non-serializable data before sending
        const serializableImages = images.map(({ file, ...rest }) => rest);
        
        w.postMessage({ id: currentId, images: serializableImages });
    }).catch(err => {
        console.warn("Physics fallback triggered:", err);
        return images;
    });
};

export const calculateVisualWeightLegacy = (img: ImageAsset): number => {
    const sizeFactor = (img.width * img.height) / (640 * 480);
    return sizeFactor * 1.0; 
};
