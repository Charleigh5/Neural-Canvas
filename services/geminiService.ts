import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { ImageAsset, ThemeConfig } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models configuration - using gemini-2.0-flash (verified working)
const TEXT_MODEL = 'gemini-2.0-flash';
const VISION_MODEL = 'gemini-2.0-flash';
const REASONING_MODEL = 'gemini-2.0-flash';

// --- NEURAL GOVERNOR SYSTEM ---
// Centralized traffic controller for Gemini API
type NeuralTask<T = unknown> = () => Promise<T>;

interface QueueItem {
  task: NeuralTask;
  resolve: (val: unknown) => void;
  reject: (err: unknown) => void;
  priority: 'high' | 'low';
}

class NeuralGovernor {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private quarantineUntil = 0;
  private lastRequestTime = 0;
  private minDelay = 1000 / 15; // Max 15 calls per second (~66ms)
  private activeKeys = new Set<string>(); // Tracks in-flight IDs to enforce 1-per-asset limit

  public onLog: (msg: string, type: 'info' | 'warn' | 'error') => void = () => {};

  /**
   * Enqueues a task for execution.
   * @param task The async API call
   * @param priority 'high' (user initiated) or 'low' (background)
   * @param key Optional unique ID (e.g., asset ID) to prevent concurrent calls for the same entity
   */
  async enqueue<T>(task: NeuralTask, priority: 'high' | 'low' = 'low', key?: string): Promise<T> {
    // 1. Idempotence / In-Flight Check
    if (key && this.activeKeys.has(key)) {
      this.onLog(`[GOVERNOR] Skipped duplicate request for ${key}`, 'warn');
      return Promise.resolve(null as T); // Return null to indicate skipped
    }

    if (key) this.activeKeys.add(key);

    return new Promise((resolve, reject) => {
      // Wrapper to clean up active key on completion
      const wrappedTask = async () => {
        try {
          const res = await task();
          return res;
        } finally {
          if (key) this.activeKeys.delete(key);
        }
      };

      const item: QueueItem = {
        task: wrappedTask,
        resolve: resolve as (val: unknown) => void,
        reject: reject as (err: unknown) => void,
        priority,
      };

      if (priority === 'high') {
        this.queue.unshift(item);
      } else {
        this.queue.push(item);
      }

      this.process();
    });
  }

  private async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();

      // 2. Quarantine Check (429 Backoff)
      if (now < this.quarantineUntil) {
        const wait = Math.ceil((this.quarantineUntil - now) / 1000);
        // Log only occasionally to avoid spam
        if (Math.random() < 0.05) this.onLog(`[QUOTA] Cooling down... ${wait}s`, 'warn');
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      // 3. Rate Limit Pacing (Token Bucket Simulation)
      const timeSinceLast = now - this.lastRequestTime;
      if (timeSinceLast < this.minDelay) {
        await new Promise(r => setTimeout(r, this.minDelay - timeSinceLast));
      }

      const item = this.queue.shift();
      if (!item) break;

      this.lastRequestTime = Date.now();

      // 4. Execution (Fire and Forget to maintain throughput)
      // We do NOT await here, or we'd be limited to 1 request per latency cycle (e.g. 1 req / 2 sec)
      item
        .task()
        .then(item.resolve)
        .catch((error: unknown) => {
          const msg = error instanceof Error ? error.message : String(error);
          const isQuota =
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('Quota exceeded');

          if (isQuota) {
            this.handleQuotaError();
            // Re-queue at the front (High Priority) to retry after cooldown
            this.queue.unshift(item);
          } else {
            this.onLog(`[ERROR] Gemini API: ${msg}`, 'error');
            item.reject(error);
          }
        });
    }

    this.isProcessing = false;
  }

  private handleQuotaError() {
    // Extend quarantine if not already set far enough
    const cooldown = 60000; // 60s
    const target = Date.now() + cooldown;
    if (target > this.quarantineUntil) {
      this.quarantineUntil = target;
      this.onLog(`[CRITICAL] 429 Quota Hit. Pausing for 60s.`, 'error');
    }
  }
}

export const governor = new NeuralGovernor();

// --- API WRAPPERS ---

export const analyzeImage = async (
  base64: string,
  assetId?: string
): Promise<Partial<ImageAsset>> => {
  return governor.enqueue(
    async () => {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            {
              text: `Analyze visual content. Return valid JSON with detailed composition metrics.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              primaryTag: {
                type: Type.STRING,
                description: 'The single most dominant subject or concept in the image.',
              },
              vibeScore: {
                type: Type.NUMBER,
                description:
                  'A score from 0.0 to 1.0 representing the energy, mood, and festive impact.',
              },
              composition: {
                type: Type.OBJECT,
                properties: {
                  dominant_rule: {
                    type: Type.STRING,
                    description:
                      'The primary composition rule used (e.g., Rule of Thirds, Golden Ratio, Symmetry, Leading Lines).',
                  },
                  aestheticScore: {
                    type: Type.NUMBER,
                    description: 'A score from 0.0 to 1.0 indicating visual beauty and balance.',
                  },
                  improvementAdvisory: {
                    type: Type.STRING,
                    description: 'Short actionable advice to improve the framing or lighting.',
                  },
                  tensionPoints: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                      },
                    },
                    description:
                      'Key points of visual interest or tension (0.0-1.0 normalized coordinates).',
                  },
                },
              },
            },
          },
        },
      });
      return JSON.parse(response.text || '{}');
    },
    'low',
    assetId
  ); // Low priority, keyed by assetId
};

export const editImage = async (
  base64: string,
  mime: string,
  prompt: string,
  assetId?: string
): Promise<string | null> => {
  return governor.enqueue(
    async () => {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: {
          parts: [{ inlineData: { data: base64, mimeType: mime } }, { text: prompt }],
        },
      });
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      return part?.inlineData?.data || null;
    },
    'high',
    assetId ? `${assetId}_edit` : undefined
  );
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  return governor.enqueue(async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData?.data || null;
  }, 'high');
};

export const generateThemeConfig = async (prompt: string): Promise<ThemeConfig | null> => {
  return governor.enqueue(async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [
          {
            text: `Generate a UI theme configuration based on this description: "${prompt}". Return a valid JSON object matching the schema.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: {
              type: Type.STRING,
              description: 'A short, creative name for the theme.',
            },
            description: {
              type: Type.STRING,
              description: "Brief description of the theme's mood.",
            },
            bezelColor: {
              type: Type.STRING,
              description: 'Hex color code for the bezel frame.',
            },
            bezelTexture: {
              type: Type.STRING,
              description:
                "CSS background property value (e.g. 'none', 'url(...)', 'linear-gradient(...)').",
            },
            overlayType: {
              type: Type.STRING,
              enum: ['none', 'snow', 'rain', 'dust', 'glitter', 'embers'],
            },
            particleDensity: {
              type: Type.INTEGER,
              description: 'Particle count 0-100',
            },
            audioAmbience: {
              type: Type.STRING,
              enum: ['none', 'holiday', 'lofi', 'storm', 'cinematic'],
            },
            fontFamily: {
              type: Type.STRING,
              enum: ['Inter', 'serif', 'monospace'],
            },
            accentColor: {
              type: Type.STRING,
              description: 'Hex color code for accents/glows.',
            },
          },
          required: [
            'name',
            'bezelColor',
            'overlayType',
            'audioAmbience',
            'accentColor',
            'particleDensity',
          ],
        },
      },
    });
    return JSON.parse(response.text || 'null');
  }, 'high');
};

export interface ReelSequenceItem {
  id: string;
  transition: string;
  duration: number;
}

export interface ReelCuration {
  sequence: ReelSequenceItem[];
  rationale: string;
}

export const curateReelSequence = async (images: ImageAsset[]): Promise<ReelCuration | null> => {
  return governor.enqueue(
    async () => {
      const payload = images.map(img => ({
        id: img.id,
        tags: img.tags,
        colors: img.colors,
        style: img.style,
        composition: img.composition?.dominant_rule,
      }));

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: {
          parts: [
            {
              text: `Organize these assets into a narrative reel. JSON Schema: { sequence: [{ id, transition, duration }], rationale }\n\nAssets: ${JSON.stringify(payload)}`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rationale: { type: Type.STRING },
              sequence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    transition: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                  },
                  required: ['id', 'transition', 'duration'],
                },
              },
            },
            required: ['sequence', 'rationale'],
          },
        },
      });
      return JSON.parse(response.text || 'null');
    },
    'high',
    'reel_orchestration'
  );
};

export const suggestNextImage = async (
  _tags: string[],
  _pool: ImageAsset[],
  _history: string[]
): Promise<string | null> => {
  return governor.enqueue(async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [
          {
            text: `Pick next ID from pool based on history and tags. Return JSON { "id": "..." }`,
          },
        ],
      },
      config: { responseMimeType: 'application/json' },
    });
    const data = JSON.parse(response.text || '{}');
    return data.id || null;
  }, 'low');
};

export const generateCaption = async (tags: string[]): Promise<string | null> => {
  return governor.enqueue(async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts: [{ text: `Caption for tags: ${tags.join(',')}` }] },
    });
    return response.text?.trim() || null;
  }, 'low');
};

export const refinePrompt = async (original: string): Promise<string | null> => {
  return governor.enqueue(async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [{ text: `Refine into high-detail visual prompt: "${original}". One paragraph.` }],
      },
    });
    return response.text?.trim() || null;
  }, 'high');
};
