/**
 * Audio Service
 * Handles audio analysis, BPM detection, and beat extraction.
 */

export interface AudioAnalysis {
  bpm: number;
  peaks: number[]; // Timestamps in ms
  duration: number;
}

export const analyzeAudio = async (url: string): Promise<AudioAnalysis> => {
  try {
    const audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    )();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Basic Peak Detection (Simplified Beat Detection)
    // This is a naive implementation. For robust BPM, use a library like 'web-audio-beat-detector'.
    // Here we'll just find significant energy peaks.

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Divide into small windows (e.g., 0.1s) and find max energy
    const winsize = Math.floor(sampleRate * 0.1);
    const peaks: number[] = [];
    let threshold = 0.8; // Dynamic thresholding would be better

    // First pass: Calculate average energy to set threshold
    let sum = 0;
    for (let i = 0; i < channelData.length; i += 100) {
      sum += Math.abs(channelData[i]);
    }
    const average = sum / (channelData.length / 100);
    threshold = average * 1.5; // Arbitrary multiplier

    for (let i = 0; i < channelData.length; i += winsize) {
      let max = 0;
      for (let j = 0; j < winsize && i + j < channelData.length; j++) {
        const val = Math.abs(channelData[i + j]);
        if (val > max) max = val;
      }

      if (max > threshold) {
        // Debounce: verify we are not just in the same beat
        const time = (i / sampleRate) * 1000; // ms
        if (peaks.length === 0 || time - peaks[peaks.length - 1] > 300) {
          peaks.push(time);
        }
      }
    }

    // Estimate BPM from peaks
    let bpm = 0;
    if (peaks.length > 1) {
      let intervals = 0;
      for (let i = 1; i < peaks.length; i++) {
        intervals += peaks[i] - peaks[i - 1];
      }
      const avgInterval = intervals / (peaks.length - 1);
      bpm = 60000 / avgInterval;
    }

    return {
      bpm: Math.round(bpm),
      peaks, // Return detected beat timestamps in ms
      duration,
    };
  } catch (error) {
    console.error('Audio analysis failed:', error);
    return { bpm: 0, peaks: [], duration: 0 };
  }
};

// Audio context singleton for holiday audio
let audioContext: AudioContext | null = null;
let masterBus: GainNode | null = null;

export const audioService = {
  getContext: () => {
    if (!audioContext) {
      audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
      )();
      masterBus = audioContext.createGain();
      masterBus.gain.value = 0.7;
      masterBus.connect(audioContext.destination);
    }
    return audioContext;
  },
  getMasterBus: () => {
    if (!masterBus) {
      audioService.getContext(); // Initialize if not done
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed by getContext call above
    return masterBus!;
  },
  resume: () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  },
};
