
import { useStore } from '../store/useStore';

/**
 * CANVAS WORKER SERVICE
 * Singleton bridge for offloading heavy canvas operations.
 * Uses Inlined Blob Worker to bypass CORS/Path resolution issues (Fixes 'Invalid URL' error).
 */

const WORKER_CODE = `
/* CANVAS WORKER GLOBAL SCOPE */
self.onerror = function(e) { 
    console.error("Canvas Worker Internal Error:", e); 
};

self.onmessage = async function(e) {
    const data = e.data;
    const id = data.id;
    const type = data.type;
    const payload = data.payload;

    try {
        if (type === 'DECODE_BITMAP') {
            const blob = payload.blob;
            if (!blob) throw new Error("No blob provided");
            // Decode bitmap for GPU acceleration
            const bitmap = await createImageBitmap(blob);
            self.postMessage({ id: id, success: true, result: bitmap }, [bitmap]);
        }
        else if (type === 'CALCULATE_SYNAPSES') {
            const nodes = payload.nodes;
            const hoveredId = payload.hoveredId;
            const lines = [];
            const maxDist = 800;
            const genericTags = ['image', 'photo', 'picture', 'upload', 'generated'];
            
            // O(N^2) Spatial & Semantic Graph Calculation
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                if (a.isStackChild) continue;

                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    if (b.isStackChild) continue;

                    // 1. Spatial Check (Bounding Box Optimization)
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    if (Math.abs(dx) > maxDist || Math.abs(dy) > maxDist) continue;

                    // 2. Exact Distance Check
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > maxDist) continue;

                    // 3. Semantic Check (Tag Intersection)
                    let shared = false;
                    if (a.tags && b.tags) {
                        for (let t = 0; t < a.tags.length; t++) {
                            const tag = a.tags[t];
                            if (!genericTags.includes(tag) && b.tags.includes(tag)) {
                                shared = true;
                                break;
                            }
                        }
                    }
                    // 4. Lineage Check
                    if (!shared && (a.parentId === b.id || b.parentId === a.id)) {
                        shared = true;
                    }

                    if (shared) {
                        const isRelevant = hoveredId === a.id || hoveredId === b.id;
                        const aCx = a.x + (a.width * a.scale) / 2;
                        const aCy = a.y + (a.height * a.scale) / 2;
                        const bCx = b.x + (b.width * b.scale) / 2;
                        const bCy = b.y + (b.height * b.scale) / 2;

                        lines.push({
                            points: [aCx, aCy, bCx, bCy],
                            stroke: isRelevant ? '#6366f1' : '#475569',
                            strokeWidth: isRelevant ? 2 : Math.max(0.5, 1.5 - (dist / 400)),
                            opacity: isRelevant ? 0.8 : Math.max(0.05, 0.4 - (dist / maxDist)),
                            key: a.id + '-' + b.id
                        });
                    }
                }
            }
            self.postMessage({ id: id, success: true, result: lines });
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        self.postMessage({ id: id, success: false, error: msg });
    }
};
`;

type Priority = 'high' | 'low';

interface QueueItem {
    type: string;
    payload: any;
    resolve: (val: any) => void;
    reject: (err: any) => void;
    id: number;
}

class CanvasWorkerService {
    private worker: Worker | null = null;
    private callbacks = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void }>();
    private idCounter = 0;
    private initPromise: Promise<void>;
    private workerUrl: string | null = null;

    // Queue for low priority tasks (background loading)
    private lowPriorityQueue: QueueItem[] = [];
    private activeLowPriorityCount = 0;
    private readonly MAX_CONCURRENT_LOW_PRIORITY = 1;

    constructor() {
        this.initPromise = this.init();
    }

    private async init() {
        if (typeof window === 'undefined') return;

        try {
            // Create a Blob from the inlined code to avoid URL construction errors with 'import.meta.url'
            const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
            
            // Create an Object URL for the Blob
            this.workerUrl = URL.createObjectURL(blob);
            
            // Initialize Worker with the Blob URL
            this.worker = new Worker(this.workerUrl, { name: 'StudioOS_CanvasWorker' });

            this.worker.onmessage = (e) => {
                const { id, success, result, error } = e.data;
                if (this.callbacks.has(id)) {
                    const { resolve, reject } = this.callbacks.get(id)!;
                    if (success) {
                        resolve(result);
                    } else {
                        console.warn(`Canvas Worker Task ${id} Failed:`, error);
                        reject(new Error(error));
                    }
                    this.callbacks.delete(id);
                }
            };
            
            this.worker.onerror = (e: ErrorEvent) => {
                console.error("Canvas Worker Runtime Error:", e.message);
                useStore.getState().addCouncilLog(`Canvas Worker Error: ${e.message}`, 'error');
            };

        } catch (e: any) {
            console.error("Canvas Worker Initialization Failed:", e);
            useStore.getState().addCouncilLog(`Worker Init Failed: ${e.message}`, 'error');
            this.worker = null;
        }
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        if (this.workerUrl) {
            URL.revokeObjectURL(this.workerUrl);
            this.workerUrl = null;
        }
    }

    private executeTask(task: QueueItem, isLowPriority = false) {
        this.callbacks.set(task.id, {
            resolve: (val) => {
                task.resolve(val);
                if (isLowPriority) {
                    this.activeLowPriorityCount--;
                    this.processQueue();
                }
            },
            reject: (err) => {
                task.reject(err);
                if (isLowPriority) {
                    this.activeLowPriorityCount--;
                    this.processQueue();
                }
            }
        });

        if (this.worker) {
            this.worker.postMessage({ id: task.id, type: task.type, payload: task.payload });
        } else {
            // Fallback if worker failed to init
            if (task.type === 'DECODE_BITMAP') {
               // Try main thread decode as backup
               const { blob } = task.payload;
               createImageBitmap(blob)
                   .then(bmp => this.callbacks.get(task.id)?.resolve(bmp))
                   .catch(err => this.callbacks.get(task.id)?.reject(err))
                   .finally(() => this.callbacks.delete(task.id));
            } else {
               // For synapes, just return empty to prevent crash
               task.resolve([]); 
            }
        }
    }

    private processQueue() {
        if (this.activeLowPriorityCount < this.MAX_CONCURRENT_LOW_PRIORITY && this.lowPriorityQueue.length > 0) {
            const task = this.lowPriorityQueue.shift();
            if (task) {
                this.activeLowPriorityCount++;
                this.executeTask(task, true);
            }
        }
    }

    async decodeBitmap(blob: Blob, priority: Priority = 'high'): Promise<ImageBitmap> {
        await this.initPromise;
        
        const id = ++this.idCounter;
        return new Promise((resolve, reject) => {
            const task: QueueItem = { type: 'DECODE_BITMAP', payload: { blob }, resolve, reject, id };
            if (priority === 'high') {
                this.executeTask(task, false);
            } else {
                if (this.activeLowPriorityCount < this.MAX_CONCURRENT_LOW_PRIORITY) {
                    this.activeLowPriorityCount++;
                    this.executeTask(task, true);
                } else {
                    this.lowPriorityQueue.push(task);
                }
            }
        });
    }

    async calculateSynapses(nodes: any[], hoveredId: string | null): Promise<any[]> {
        await this.initPromise;
        // Strip heavy objects
        const lightNodes = nodes.map((n: any) => ({
            id: n.id, 
            x: n.x, 
            y: n.y, 
            width: n.width, 
            height: n.height, 
            scale: n.scale, 
            tags: n.tags, 
            isStackChild: n.isStackChild, 
            parentId: n.parentId
        }));
        
        const id = ++this.idCounter;
        return new Promise((resolve, reject) => {
            const task: QueueItem = { 
                type: 'CALCULATE_SYNAPSES', 
                payload: { nodes: lightNodes, hoveredId }, 
                resolve, reject, id 
            };
            this.executeTask(task, false);
        });
    }
}

export const canvasWorker = new CanvasWorkerService();
