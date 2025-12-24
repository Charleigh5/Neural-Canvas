
import { assetDB } from '../services/db';

// Simple LRU-like cache for Blob URLs to prevent repeated IDB reads and flickering
const blobUrlCache = new Map<string, string>();
const MAX_CACHE = 50; 

export const resolveAssetUrl = async (url: string): Promise<string | null> => {
    if (!url) return null;
    
    // 1. Data URL
    if (url.startsWith('data:')) return url;

    // 2. Local IDB Asset
    if (url.startsWith('local://')) {
        const id = url.replace('local://', '');
        
        // Cache Hit
        if (blobUrlCache.has(id)) {
            return blobUrlCache.get(id)!;
        }

        try {
            const data = await assetDB.get(id);
            if (!data) return null;
            
            if (typeof data === 'string') {
                return data; 
            }
            
            if (data instanceof Blob) {
                const objectUrl = URL.createObjectURL(data);
                
                // Manage Cache Size
                if (blobUrlCache.size >= MAX_CACHE) {
                    const first = blobUrlCache.keys().next().value;
                    if (first) {
                        URL.revokeObjectURL(blobUrlCache.get(first)!);
                        blobUrlCache.delete(first);
                    }
                }

                blobUrlCache.set(id, objectUrl);
                return objectUrl;
            }
        } catch (e) {
            console.error(`Failed to resolve local asset ${id}`, e);
            return null;
        }
    }

    // 3. Remote URL
    return url;
};

/**
 * Pre-fetches an asset into the browser's image cache / blob cache.
 * Useful for smoothing out playback transitions.
 */
export const preloadAsset = async (url: string) => {
    const resolved = await resolveAssetUrl(url);
    if (!resolved) return;
    
    // Create detached image to force browser decode
    const img = new Image();
    img.src = resolved;
    // We don't need to wait for onload, just triggering the request helps
};
