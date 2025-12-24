
import { ImageAsset } from '../types';

/**
 * PROMPTBUILDER.TS - Contextual Chain Engine
 * Constructs detailed instructions for Gemini by combining 
 * user intent with existing asset metadata and lineage.
 */

export class PromptBuilder {
  /**
   * Constructs a remix prompt that carries forward the high-fidelity context of the parent asset.
   * Utilizes the neural audit metadata for maximum semantic alignment.
   */
  static buildRemixPrompt(image: ImageAsset, instruction: string): string {
    const dna = [
      image.narrativeTitle ? `NARRATIVE_TITLE: "${image.narrativeTitle}"` : '',
      image.style ? `STYLE_TAXONOMY: ${image.style}` : '',
      image.cinematography ? `CINEMATOGRAPHY: [Lighting: ${image.cinematography.lighting_style}, Angle: ${image.cinematography.camera_angle}, Focal: ${image.cinematography.focal_intent}]` : '',
      image.tags.length > 0 ? `SEMANTIC_TAGS: ${image.tags.slice(0, 20).join(', ')}` : ''
    ].filter(Boolean).join(' | ');

    return `
      NEURAL_TRANSFORMATION_PROTOCOL:
      [ASSET_DNA]: ${dna}
      
      [USER_MODIFICATION_REQUEST]: "${instruction}"
      
      [ARCHITECTURAL_CONSTRAINTS]:
      1. SEMANTIC_ANCHORING: Absolute preservation of the core subjects and silhouettes identified in the DNA.
      2. LIGHTING_COHERENCE: Integrate new elements using the existing cinematographic lighting profile unless explicitly overridden.
      3. TEXTURE_SYNTHESIS: Apply high-frequency, 4K-fidelity details to the modified regions.
      4. NARRATIVE_CONTINUITY: Maintain the existing narrative arc and emotional energy of the source asset.
      5. COMPOSITIONAL_STASIS: Do not alter the fundamental framing or tension points of the scene.
    `.trim();
  }

  /**
   * Constructs a prop generation prompt that respects the scale and lighting of the target scene.
   */
  static buildPropPrompt(instruction: string, parentImage?: ImageAsset): string {
    if (!parentImage) {
      return `
        GENERATE HOLOGRAPHIC PROP:
        SUBJECT: ${instruction}
        REQUIREMENTS:
        - Isolate the subject on a clean, high-contrast solid background.
        - Style: High-fidelity, cinematic render.
        - Output: A single centered item.
      `.trim();
    }

    const { style, colors, cinematography, tags } = parentImage;
    const colorContext = colors && colors.length > 0 ? `Color Palette: ${colors.join(', ')}.` : '';
    const lightingContext = cinematography ? `Lighting Style: ${cinematography.lighting_style}.` : '';
    const envContext = `Environment Context: ${tags.slice(0, 5).join(', ')}.`;
    const aesthetic = style ? `Target Aesthetic: ${style}.` : 'Aesthetic: Cinematic realism.';

    return `
      GENERATE CONTEXT-AWARE PROP:
      SUBJECT: ${instruction}
      
      INTEGRATION DATA:
      ${envContext}
      ${aesthetic}
      ${colorContext}
      ${lightingContext}
      
      REQUIREMENTS:
      - The item must be rendered to match the lighting and material physics of the described environment.
      - Isolate the subject on a clean, neutral background for easy extraction.
      - Perspective: Match the camera intent (${cinematography?.camera_angle || 'standard perspective'}).
      - Output: High-fidelity 4K-ready asset.
    `.trim();
  }

  /**
   * Constructs a background generation prompt for a 16:9 abstract backdrop.
   */
  static buildBackgroundPrompt(image: ImageAsset): string {
    const colors = image.colors ? `COLOR_PALETTE: ${image.colors.join(', ')}` : '';
    const style = image.style ? `STYLE_TAXONOMY: ${image.style}` : '';
    const mood = image.narrativeTitle ? `ATMOSPHERIC_MOOD: ${image.narrativeTitle}` : '';

    return `
      GENERATE_NEURAL_BACKDROP:
      [CONTEXT_INPUTS]:
      ${mood}
      ${style}
      ${colors}
      
      [ARCHITECTURAL_SPECIFICATIONS]:
      1. TYPE: Abstract, cinematic atmospheric render.
      2. COMPOSITION: Deep spatial layering, soft-focus bokeh, and smooth spectral gradients.
      3. CHROMATIC_ALIGNMENT: The background must perfectly harmonize with the provided color palette.
      4. NARRATIVE_VIBE: Mirror the emotional energy and lighting physics of the source asset.
      5. OUTPUT: Pure atmosphere. No identifiable subjects or structures. High-frequency digital detail.
    `.trim();
  }
}
