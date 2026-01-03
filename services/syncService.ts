import { useStore } from '../store/useStore';
import apiService from './apiService';
// import { useAuth } from './authContext'; // Unused for now

class SyncService {
  private isSyncing = false;

  /**
   * Sync local state with backend
   */
  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Sync User Profile
      // (Handled by AuthContext on mount usually, but good to force refresh)

      // 2. Sync Assets
      await this.syncAssets();

      // 3. Sync Reels/Themes (To be implemented)
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync assets between local store and cloud
   * Current strategy: Fetch cloud assets and merge/append to local
   */
  private async syncAssets() {
    try {
      const cloudAssets = await apiService.assets.list();
      const { images } = useStore.getState();

      const existingIds = new Set(images.map(img => img.id));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cloudAssets.forEach((cloudAsset: any) => {
        // Map backend asset to frontend ImageAsset
        // Note: Backend might need to return signed URLs or frontend needs to handle S3 URLs

        // Check if we already have it
        if (!existingIds.has(cloudAsset.id)) {
          // For now, we just log.
          // Real implementation requires mapping backend Asset schema to ImageAsset
          // and handling the URL (presigned vs public).
          console.debug('Found new cloud asset:', cloudAsset.filename);
        }
      });
    } catch (error) {
      console.error('Asset sync error:', error);
    }
  }
}

export const syncService = new SyncService();
