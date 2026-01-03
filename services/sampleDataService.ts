import { useStore } from '../store/useStore';
import { AppMode, ImageAsset } from '../types';

// High-quality sample images from Unsplash (Landscape, Architecture, Portrait, Abstract, Sci-Fi)
const SAMPLE_URLS = [
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop', // Nature
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop', // Tech/Chip
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop', // Portrait
  'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=2080&auto=format&fit=crop', // Abstract
  'https://images.unsplash.com/photo-1504333638930-c8787321eee0?q=80&w=2070&auto=format&fit=crop', // Architecture
];

export const loadSampleData = async (): Promise<void> => {
  const addImage = useStore.getState().addImage;

  // Grid Layout Config
  const COLS = 5;
  const ITEM_SIZE = 300;
  const GAP = 40;
  const START_X = 100;
  const START_Y = 100;

  try {
    const promises = SAMPLE_URLS.map(async (url, i) => {
      // 1. Fetch Blob
      const response = await fetch(url);
      const blob = await response.blob();

      // 2. Create File object
      const filename = `sample_${i}_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: blob.type });

      // 3. Create Data URL for immediate display/persistence
      const dataUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.readAsDataURL(blob);
      });

      // 4. Get Dimensions
      const imgObj = await new Promise<HTMLImageElement>(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = dataUrl;
      });

      // 5. Calculate Layout
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const targetX = START_X + col * (ITEM_SIZE + GAP);
      const targetY = START_Y + row * (ITEM_SIZE + GAP);
      const scale = ITEM_SIZE / imgObj.width;

      // 6. Construct Asset
      const asset: ImageAsset = {
        id: Math.random().toString(36).substring(2, 11),
        url: dataUrl,
        file: file,
        width: imgObj.width,
        height: imgObj.height,
        x: targetX,
        y: targetY,
        scale: scale,
        rotation: 0,
        tags: ['sample', 'test-data'],
        analyzed: false,
        timestamp: Date.now(),
      };

      return asset;
    });

    const assets = await Promise.all(promises);

    // Add to store
    for (const asset of assets) {
      // Add one by one to trigger individual analysis queues
      await addImage(asset, { skipPhysics: true });
    }

    // Switch mode to canvas after loading samples
    const { setMode } = useStore.getState();
    setMode(AppMode.CANVAS);

    console.debug('[SampleData] Loaded', assets.length, 'sample assets');
  } catch (error) {
    console.error('Failed to load sample data:', error);
    useStore.getState().addCouncilLog('Failed to load sample data', 'error');
  }
};
