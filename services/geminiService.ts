import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { ImageAsset, ThemeConfig } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models configuration - using gemini-2.0-flash (verified working)
const TEXT_MODEL = 'gemini-2.0-flash';
const VISION_MODEL = 'gemini-2.0-flash';
const REASONING_MODEL = 'gemini-2.0-flash';

// --- UTILS ---

/**
 * Robust JSON parser that handles Markdown code fences.
 */
const safeParseJson = <T>(text: string): T | null => {
  try {
    // 1. Clean Markdown code blocks (```json ... ``` or ``` ...)
    const cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[GEMINI] JSON Parse Error:', e, 'Raw text:', text);
    return null;
  }
};

// --- NEURAL GOVERNOR SYSTEM ---
// Centralized traffic controller for Gemini API with adaptive rate limiting
type NeuralTask<T = unknown> = () => Promise<T>;

interface QueueItem {
  task: NeuralTask;
  resolve: (val: unknown) => void;
  reject: (err: unknown) => void;
  priority: 'high' | 'low';
  retryCount: number; // Track retry attempts per request
}

class NeuralGovernor {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private quarantineUntil = 0;
  private lastRequestTime = 0;
  private activeKeys = new Set<string>(); // Tracks in-flight IDs to enforce 1-per-asset limit

  // --- ADAPTIVE THROTTLING CONFIG ---
  private maxConcurrent = 3; // Max simultaneous requests
  private activeRequests = 0; // Current in-flight count
  private currentRpm = 10; // Requests per minute (adaptive, conservative default)
  private readonly minRpm = 5; // Floor after 429
  private readonly maxRpm = 30; // Ceiling for auto-recovery (conservative for free tier)
  private readonly rpmRecoveryRate = 5; // RPM increase per success burst
  private successStreak = 0; // Used to slowly increase RPM

  // --- EXPONENTIAL BACKOFF CONFIG (per Perplexity research) ---
  private readonly maxRetries = 5; // Max retry attempts before surfacing error
  private readonly initialDelayMs = 1000; // First retry delay
  private readonly maxDelayMs = 30000; // Cap at 30 seconds
  private readonly jitterFactor = 0.2; // 20% jitter to prevent thundering herd

  public onLog: (msg: string, type: 'info' | 'warn' | 'error' | 'success') => void = () => {};

  /**
   * Calculate delay between requests based on current RPM limit.
   */
  private calculateDelay(): number {
    // RPM -> delay in ms: 15 RPM = 4000ms, 60 RPM = 1000ms
    return Math.ceil(60000 / this.currentRpm);
  }

  /**
   * Calculate exponential backoff delay with jitter for retries.
   * Formula: min(maxDelay, initialDelay * 2^retryCount) ± jitter
   */
  private calculateBackoff(retryCount: number): number {
    const exponentialDelay = this.initialDelayMs * Math.pow(2, retryCount);
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    // Add jitter: ±jitterFactor% to prevent thundering herd
    const jitter = cappedDelay * this.jitterFactor * (Math.random() * 2 - 1);
    return Math.floor(cappedDelay + jitter);
  }

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
        retryCount: 0, // Initialize retry counter
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

      // 1. Quarantine Check (429 Backoff)
      if (now < this.quarantineUntil) {
        const wait = Math.ceil((this.quarantineUntil - now) / 1000);
        if (wait % 10 === 0) this.onLog(`[QUOTA] Cooling down... ${wait}s remaining`, 'warn');
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      // 2. Concurrency Gate
      if (this.activeRequests >= this.maxConcurrent) {
        await new Promise(r => setTimeout(r, 100)); // Brief wait
        continue;
      }

      // 3. Rate Limit Pacing (Adaptive RPM)
      const minDelay = this.calculateDelay();
      const timeSinceLast = now - this.lastRequestTime;
      if (timeSinceLast < minDelay) {
        await new Promise(r => setTimeout(r, minDelay - timeSinceLast));
      }

      const item = this.queue.shift();
      if (!item) break;

      this.lastRequestTime = Date.now();
      this.activeRequests++;

      // 4. Execution (Fire and Forget to maintain throughput with concurrency)
      item
        .task()
        .then(result => {
          this.activeRequests--;
          this.handleSuccess();
          item.resolve(result);
        })
        .catch((error: unknown) => {
          this.activeRequests--;
          const msg = error instanceof Error ? error.message : String(error);
          const isQuota =
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('Quota exceeded');

          if (isQuota) {
            item.retryCount++;

            // Check if max retries exceeded
            if (item.retryCount > this.maxRetries) {
              this.onLog(
                `[FATAL] Max retries (${this.maxRetries}) exceeded. Surfacing error to user.`,
                'error'
              );
              item.reject(
                new Error('API rate limit exceeded after multiple retries. Please try again later.')
              );
              return;
            }

            // Calculate backoff with jitter
            const backoffMs = this.calculateBackoff(item.retryCount);
            this.onLog(
              `[RETRY] Attempt ${item.retryCount}/${this.maxRetries} after ${Math.round(backoffMs / 1000)}s backoff`,
              'warn'
            );

            // Apply global quota handling
            this.handleQuotaError();

            // Schedule retry with exponential backoff
            setTimeout(() => {
              this.queue.unshift(item);
              this.process();
            }, backoffMs);
          } else {
            this.onLog(`[ERROR] Gemini API: ${msg}`, 'error');
            item.reject(error);
          }
        });
    }

    this.isProcessing = false;
  }

  private handleSuccess() {
    this.successStreak++;
    // Every 10 successful requests, try to gently increase RPM
    if (this.successStreak >= 10 && this.currentRpm < this.maxRpm) {
      this.currentRpm = Math.min(this.maxRpm, this.currentRpm + this.rpmRecoveryRate);
      this.successStreak = 0;
      this.onLog(`[GOVERNOR] Increasing rate to ${this.currentRpm} RPM`, 'info');
    }
  }

  private handleQuotaError() {
    // Drop RPM significantly
    this.currentRpm = Math.max(this.minRpm, Math.floor(this.currentRpm / 2));
    this.successStreak = 0;

    // Extend quarantine
    const cooldown = 60000; // 60s
    const target = Date.now() + cooldown;
    if (target > this.quarantineUntil) {
      this.quarantineUntil = target;
      this.onLog(
        `[CRITICAL] 429 Quota Hit. Dropping to ${this.currentRpm} RPM. Pausing 60s.`,
        'error'
      );
    }
  }

  /**
   * Get current rate limiter state for UI consumption.
   * Exposes minimal, actionable metrics for graceful degradation UI.
   */
  getQuarantineInfo(): { isQuarantined: boolean; remainingMs: number; currentRpm: number } {
    const now = Date.now();
    const isQuarantined = now < this.quarantineUntil;
    const remainingMs = isQuarantined ? this.quarantineUntil - now : 0;
    return {
      isQuarantined,
      remainingMs,
      currentRpm: this.currentRpm,
    };
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
      return safeParseJson<Partial<ImageAsset>>(response.text || '{}') || {};
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
    return safeParseJson<ThemeConfig>(response.text || 'null');
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
      return safeParseJson<ReelCuration>(response.text || 'null');
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
    const data = safeParseJson<{ id?: string }>(response.text || '{}');
    return data?.id || null;
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

/**
 * Generate an ambient 16:9 background that matches the mood and colors of the source image.
 * @param colors Array of dominant hex colors from the image
 * @param mood Description of the image mood/style (e.g., "warm sunset", "festive holiday")
 * @param tags Optional tags from image analysis
 * @returns Base64 encoded image data or null on failure
 */
export const generateAmbientBackground = async (
  colors: string[],
  mood: string,
  tags?: string[]
): Promise<string | null> => {
  return governor.enqueue(async () => {
    const colorDescription =
      colors.length > 0
        ? `using these dominant colors: ${colors.join(', ')}`
        : 'with a harmonious color palette';

    const tagContext = tags && tags.length > 0 ? `inspired by: ${tags.slice(0, 5).join(', ')}` : '';

    const prompt = `Generate a beautiful abstract 16:9 cinematic background. 
Style: ${mood}. ${colorDescription}. ${tagContext}.
Requirements:
- Ultra-wide 16:9 aspect ratio
- Soft, blurred, dreamlike quality
- No recognizable objects or faces
- Suitable as a backdrop behind photos
- Elegant gradients, bokeh, or atmospheric effects
- Professional quality, high resolution feel`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseModalities: ['Text', 'Image'],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData?.data || null;
  }, 'high');
};

/**
 * Analyze image to extract mood and color context for ambient generation
 */
export const extractAmbientContext = async (
  base64: string,
  assetId?: string
): Promise<{ mood: string; colors: string[]; style: string } | null> => {
  return governor.enqueue(
    async () => {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            {
              text: `Analyze this image for ambient background generation. Extract mood, colors, and style.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mood: {
                type: Type.STRING,
                description:
                  'Overall mood/atmosphere (e.g., "warm sunset glow", "cozy winter evening", "vibrant celebration")',
              },
              colors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of 3-5 dominant hex color codes',
              },
              style: {
                type: Type.STRING,
                description:
                  'Visual style suitable for background (e.g., "soft bokeh", "gradient wash", "atmospheric fog")',
              },
            },
            required: ['mood', 'colors', 'style'],
          },
        },
      });
      return safeParseJson<{ mood: string; colors: string[]; style: string }>(
        response.text || 'null'
      );
    },
    'high',
    assetId ? `${assetId}_ambient` : undefined
  );
};
