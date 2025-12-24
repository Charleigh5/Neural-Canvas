
import { CropData } from '../types';

/**
 * SMART CROP V4 - Hero-First Narratives
 * Calculates the optimal 16:9 crop that fits within the image.
 * Prioritizes the Hero Subject Box (Protagonist identification).
 * 
 * @param imgW Original Image Width
 * @param imgH Original Image Height
 * @param box High-confidence Hero Box or fallback subject box [ymin, xmin, ymax, xmax] Normalized
 * @param focalPoint Aesthetically suggested focal center {x, y} Normalized
 * @param compositionRule Optional bias for composition ('center', 'thirds', 'golden')
 */
export const calculateSmartCrop = (
  imgW: number, 
  imgH: number, 
  box?: number[], 
  focalPoint?: { x: number; y: number },
  compositionRule: 'center' | 'thirds' | 'golden' = 'center'
): CropData => {
    // 1. Determine Target Center (Default to center)
    let cx = imgW / 2;
    let cy = imgH / 2;

    // A. Use Aesthetic Focal Point if provided (High Fidelity)
    if (focalPoint) {
        cx = focalPoint.x * imgW;
        cy = focalPoint.y * imgH;
    } 
    // B. Fallback to Hero/Subject Box Center
    else if (box && box.length === 4) {
        const [y1, x1, y2, x2] = box;
        cx = ((x1 + x2) / 2) * imgW;
        cy = ((y1 + y2) / 2) * imgH;
    }

    // 2. Calculate Max Crop Dimensions for 16:9
    const targetRatio = 16 / 9;
    let cropW = imgW;
    let cropH = imgH;

    if (imgW / imgH > targetRatio) {
        // Landscape/Panoramic: Height is limiting
        cropH = imgH;
        cropW = cropH * targetRatio;
    } else {
        // Portrait/Square: Width is limiting
        cropW = imgW;
        cropH = cropW / targetRatio;
    }

    // 3. Narrative Bias - Shift the crop
    let x = cx - (cropW / 2);
    let y = cy - (cropH / 2);

    // Rule of Thirds / Golden Ratio bias:
    if (compositionRule === 'thirds' || compositionRule === 'golden') {
        const ratioLeft = compositionRule === 'thirds' ? 0.33 : 0.382;
        const ratioRight = compositionRule === 'thirds' ? 0.66 : 0.618;

        const leftX = cx - (cropW * ratioLeft);  // Place subject at left line
        const rightX = cx - (cropW * ratioRight); // Place subject at right line
        
        // Check bounds validity for left shift
        const canShiftLeft = leftX >= 0 && (leftX + cropW) <= imgW;
        // Check bounds validity for right shift
        const canShiftRight = rightX >= 0 && (rightX + cropW) <= imgW;

        if (canShiftLeft && !canShiftRight) {
            x = leftX;
        } else if (!canShiftLeft && canShiftRight) {
            x = rightX;
        } else if (canShiftLeft && canShiftRight) {
            // If both valid, pick the one that centers closer to the image center (less extreme)
            // or alternate. Default to Right (classic cinematic framing)
            x = rightX;
        }
    }

    // 4. Boundary Clamping & Subject Preservation
    if (box && box.length === 4) {
        const [by1, bx1, by2, bx2] = box;
        const bpx1 = bx1 * imgW;
        const bpy1 = by1 * imgH;
        const bpx2 = bx2 * imgW;
        const bpy2 = by2 * imgH;
        
        // Ensure HERO is contained within bounds
        if (x > bpx1) x = bpx1 - (cropW * 0.1); 
        if (x + cropW < bpx2) x = bpx2 - cropW + (cropW * 0.1);
        
        if (y > bpy1) y = bpy1 - (cropH * 0.1);
        if (y + cropH < bpy2) y = bpy2 - cropH + (cropH * 0.1);
    }

    // Final Clamping to image boundaries
    if (x < 0) x = 0;
    if (x + cropW > imgW) x = imgW - cropW;
    if (y < 0) y = 0;
    if (y + cropH > imgH) y = imgH - cropH;

    return { x, y, width: cropW, height: cropH };
};
