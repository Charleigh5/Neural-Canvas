import { GoogleGenAI, Modality, Type, FunctionDeclaration } from '@google/genai';

/**
 * LIVESERVICE.TS
 * Manages the real-time audio/visual link between the user and the Director.
 */

const AUDIO_IN_RATE = 16000;
const AUDIO_OUT_RATE = 24000;

export const directorTools: FunctionDeclaration[] = [
  {
    name: 'select_assets',
    description: 'Selects images or videos on the canvas based on a semantic description.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: {
          type: Type.STRING,
          description: 'Visual or conceptual description of the items to select.',
        },
        action: {
          type: Type.STRING,
          enum: ['SELECT', 'DESELECT', 'PURGE'],
          description: 'The operation to perform on the matches.',
        },
      },
      required: ['description', 'action'],
    },
  },
  {
    name: 'modify_assets',
    description:
      'Adjusts visual properties (brightness, contrast, saturation, blur, hue) of specific assets or currently selected ones.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        ids: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'Optional list of asset IDs to modify. If omitted, applies to currently selected assets.',
        },
        brightness: { type: Type.NUMBER, description: 'Brightness adjustment (-1.0 to 1.0).' },
        contrast: { type: Type.NUMBER, description: 'Contrast adjustment (-100 to 100).' },
        saturation: { type: Type.NUMBER, description: 'Saturation adjustment (-1.0 to 1.0).' },
        blur: { type: Type.NUMBER, description: 'Blur radius (0 to 40).' },
        hue: { type: Type.NUMBER, description: 'Hue rotation in degrees (0 to 360).' },
      },
    },
  },
  {
    name: 'adjust_environment',
    description: 'Changes the studio theme, playback speed, or display mode.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        theme: { type: Type.STRING, enum: ['standard', 'candy', 'gold', 'frost', 'christmas'] },
        speed: { type: Type.NUMBER, description: 'Seconds per slide.' },
        mode: { type: Type.STRING, enum: ['sequential', 'smart-shuffle'] },
      },
    },
  },
  {
    name: 'generate_theme',
    description: 'Generates a new custom UI theme for the studio based on a descriptive prompt.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'Description of the desired theme mood, colors, and atmosphere.',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'canvas_navigation',
    description: 'Pans or zooms the infinite canvas to specific coordinates or zoom levels.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        zoom: { type: Type.NUMBER },
        centerOnId: { type: Type.STRING, description: 'ID of a specific asset to center on.' },
      },
    },
  },
  {
    name: 'manage_reel',
    description:
      'Saves the current timeline/reel as a named project, or loads/deletes existing reels.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['SAVE', 'LOAD', 'DELETE', 'CLEAR'] },
        name: { type: Type.STRING, description: 'Name of the reel to save or load.' },
      },
      required: ['action'],
    },
  },
];

export class LiveDirectorSession {
  private session: any = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();

  constructor(
    private callbacks: {
      onMessage: (msg: string) => void;
      onStatusChange: (
        status: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking'
      ) => void;
      onToolCall: (name: string, args: any) => Promise<any>;
    }
  ) {}

  async start() {
    this.callbacks.onStatusChange('connecting');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: AUDIO_IN_RATE,
    });
    this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: AUDIO_OUT_RATE,
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction:
            "You are the 'Director' of STUDIO.OS. You orchestrate a spatial media environment. You can see and manipulate a canvas of images and videos. Be helpful, professional, and slightly technical. Use your tools to help the user manage and visually adjust their assets. When the user asks to brighten, blur, or stylize images, use the 'modify_assets' tool. If they ask for a new theme or look, use 'generate_theme'. You can also save their work using 'manage_reel'.",
          tools: [{ functionDeclarations: directorTools }],
        },
        callbacks: {
          onopen: () => {
            this.callbacks.onStatusChange('listening');
            const source = this.inputAudioCtx!.createMediaStreamSource(stream);
            const processor = this.inputAudioCtx!.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = e => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = this.createBlob(inputData);
              // CRITICAL: Solely rely on sessionPromise resolves to send data.
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(processor);
            processor.connect(this.inputAudioCtx!.destination);
          },
          onmessage: async (message: any) => {
            // Handle Audio Output
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              this.callbacks.onStatusChange('speaking');
              this.playAudio(audioData);
            }

            // Handle Tool Calls
            if (message.toolCall) {
              this.callbacks.onStatusChange('thinking');
              for (const fc of message.toolCall.functionCalls) {
                const result = await this.callbacks.onToolCall(fc.name, fc.args);
                sessionPromise.then(s =>
                  s.sendToolResponse({
                    functionResponses: [{ id: fc.id, name: fc.name, response: { result } }],
                  })
                );
              }
            }

            if (message.serverContent?.interrupted) {
              this.stopAllAudio();
            }

            if (message.serverContent?.turnComplete) {
              this.callbacks.onStatusChange('listening');
            }
          },
          onclose: () => this.callbacks.onStatusChange('idle'),
          onerror: e => {
            console.error('Live Director Error:', e);
            this.callbacks.onStatusChange('idle');
          },
        },
      });

      this.session = await sessionPromise;
    } catch (e) {
      console.error('Microphone access or connection failed', e);
      this.callbacks.onStatusChange('idle');
    }
  }

  stop() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.stopAllAudio();
    if (this.inputAudioCtx) this.inputAudioCtx.close();
    if (this.outputAudioCtx) this.outputAudioCtx.close();
    this.callbacks.onStatusChange('idle');
  }

  // Implementation of createBlob to encode raw PCM data
  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: `audio/pcm;rate=${AUDIO_IN_RATE}`,
    };
  }

  // Implementation of playAudio to decode and queue PCM chunks
  private async playAudio(base64: string) {
    if (!this.outputAudioCtx) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioCtx.currentTime);
    const audioBuffer = await decodeAudioData(
      decode(base64),
      this.outputAudioCtx,
      AUDIO_OUT_RATE,
      1
    );

    const source = this.outputAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioCtx.destination);
    source.addEventListener('ended', () => {
      this.activeSources.delete(source);
    });

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.activeSources.add(source);
  }

  // Implementation of stopAllAudio to handle interruptions
  private stopAllAudio() {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Ignore stop errors
      }
    }
    this.activeSources.clear();
    this.nextStartTime = 0;
  }
}

// Helper functions for audio encoding/decoding as per Gemini API guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
