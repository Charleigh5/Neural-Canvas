
import { useState, useEffect } from 'react';
import { assetDB } from '../services/db';
import { canvasWorker } from '../services/canvasWorkerService';

interface CacheEntry {
    element: ImageBitmap | HTMLImageElement;
    status: 'loaded' | 'failed';
    timestamp: number;
    blobUrl?: string; 
}

// Global LRU Cache shared across components
const imageCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 60; 

const pruneCache = () => {
    if (imageCache.size <= MAX_CACHE_SIZE) return;
    const sorted = Array.from(imageCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = sorted.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    
    toRemove.forEach(([key, entry]) => {
        if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
        if (entry.element instanceof ImageBitmap) {
            entry.element.close();
        }
        imageCache.delete(key);
    });
};

/**
 * Loads an asset into an ImageBitmap (optimized) or HTMLImageElement (fallback).
 * Handles caching and worker offloading.
 * @param url The asset URL
 * @param priority 'high' for immediate UI visibility, 'low' for background preloading
 */
export const loadAsset = async (url: string, priority: 'high' | 'low' = 'high'): Promise<ImageBitmap | HTMLImageElement> => {
    if (!url) throw new Error("No URL provided");

    // 1. CACHE HIT
    if (imageCache.has(url)) {
        const entry = imageCache.get(url)!;
        entry.timestamp = Date.now();
        if (entry.status === 'loaded') return entry.element;
        throw new Error("Asset previously failed to load");
    }

    try {
        let blob: Blob | null = null;

        // A. Resolve Blob Source
        if (url.startsWith('local://')) {
            const id = url.replace('local://', '');
            const data = await assetDB.get(id);
            if (data instanceof Blob) {
                blob = data;
            } else if (typeof data === 'string') {
                const res = await fetch(data);
                blob = await res.blob();
            }
        } else if (url.startsWith('data:')) {
            const res = await fetch(url);
            blob = await res.blob();
        } else {
            // Remote URL
            const res = await fetch(url, { mode: 'cors' });
            blob = await res.blob();
        }

        if (!blob) throw new Error("Could not resolve blob");

        // B. Offload Decoding to Worker (Returns ImageBitmap)
        // Pass priority to worker to prevent blocking the UI with preloads
        const bitmap = await canvasWorker.decodeBitmap(blob, priority);
        
        const entry: CacheEntry = { 
            element: bitmap, 
            status: 'loaded', 
            timestamp: Date.now() 
        };
        imageCache.set(url, entry);
        pruneCache();
        return bitmap;

    } catch (e) {
        console.warn("Bitmap Worker Load Failed, falling back to main thread:", url);
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            
            img.onload = () => {
                imageCache.set(url, { element: img, status: 'loaded', timestamp: Date.now() });
                resolve(img);
            };
            img.onerror = (err) => {
                imageCache.set(url, { element: img, status: 'failed', timestamp: Date.now() });
                reject(err);
            };
        });
    }
};

/**
 * Fire-and-forget preloader.
 * Uses Low Priority to ensure it doesn't compete with visible assets.
 */
export const preloadImage = (url: string) => loadAsset(url, 'low').catch(e => console.debug("Preload skipped", url));

export const useImage = (url: string | undefined, crossOrigin?: string) => {
  const [image, setImage] = useState<ImageBitmap | HTMLImageElement | undefined>(undefined);
  const [status, setStatus] = useState<string>('loading');

  useEffect(() => {
    if (!url) {
        setStatus('failed');
        return;
    }

    // Immediate Cache Check
    if (imageCache.has(url)) {
        const entry = imageCache.get(url)!;
        entry.timestamp = Date.now();
        if (entry.status === 'loaded') {
            setImage(entry.element);
            setStatus('loaded');
        } else {
            setStatus('failed');
        }
        return;
    }

    let isMounted = true;

    // Use High Priority for useImage hook as it implies visual rendering
    loadAsset(url, 'high')
        .then(img => {
            if (isMounted) {
                setImage(img);
                setStatus('loaded');
            }
        })
        .catch(() => {
            if (isMounted) setStatus('failed');
        });

    return () => {
        isMounted = false;
    };
  }, [url, crossOrigin]);

  return [image, status] as const;
};
