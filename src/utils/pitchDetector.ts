// Real-Time Audio DSP Pitch Detection Engine using the YIN Algorithm
// Optimized for Acoustic & Electric Guitars with Low E sensitivity, Harmonic Resolution, and Real-Time Waveform

export interface PitchDetectionResult {
  frequency: number | null;
  rawFrequency: number | null;
  noteName: string | null;
  octave: number | null;
  cents: number | null;
  volume: number;
  clarity: number;
  isStable: boolean;
  waveform?: Float32Array;
}

export interface GuitarStringInfo {
  name: string;
  octave: number;
  note: string;
  freq: number;
  color: string;
  stringIndex: number;
}

export const GUITAR_STRINGS: GuitarStringInfo[] = [
  { name: 'E', octave: 2, note: 'E2', freq: 82.41, color: '#ef4444', stringIndex: 0 },  // 6th (Low E) - Red
  { name: 'A', octave: 2, note: 'A2', freq: 110.00, color: '#facc15', stringIndex: 1 }, // 5th (A) - Yellow
  { name: 'D', octave: 3, note: 'D3', freq: 146.83, color: '#e2e8f0', stringIndex: 2 }, // 4th (D) - Silver/White
  { name: 'G', octave: 3, note: 'G3', freq: 196.00, color: '#f97316', stringIndex: 3 }, // 3rd (G) - Orange
  { name: 'B', octave: 3, note: 'B3', freq: 246.94, color: '#38bdf8', stringIndex: 4 }, // 2nd (B) - Cyan/Blue
  { name: 'e', octave: 4, note: 'E4', freq: 329.63, color: '#a855f7', stringIndex: 5 }, // 1st (High e) - Purple
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class PitchDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;

  // Optimized DSP thresholds for guitar
  private readonly bufferSize = 2048;
  private readonly rmsThreshold = 0.005; // Lowered to capture quiet Low E fundamental
  private readonly minFreq = 60; // Well below Low E (82.41 Hz)
  private readonly maxFreq = 950; // Above guitar frets

  // Temporal Smoothing & Stability Buffers
  private recentFrequencies: number[] = [];
  private readonly historySize = 5;
  private smoothedFreq: number | null = null;
  private stableCount = 0;

  private onPitchCallback: ((result: PitchDetectionResult) => void) | null = null;

  // Identify guitar string and compute exact logarithmic musical cents
  public static identifyGuitarString(freq: number): { string: GuitarStringInfo; cents: number; detectedNote: string } {
    let bestMatch: GuitarStringInfo = GUITAR_STRINGS[0];
    let minCentsDiff = 9999;
    let finalCents = 0;

    for (const str of GUITAR_STRINGS) {
      // Check fundamental (1x) and 2nd harmonic (2x) for Low E / A to handle missing fundamental
      const harmonics = [1];
      if (str.name === 'E') harmonics.push(2); // Low E harmonic at 164.8 Hz
      if (str.name === 'A') harmonics.push(2); // A harmonic at 220 Hz

      for (const h of harmonics) {
        const refFreq = str.freq * h;
        const cents = 1200 * Math.log2(freq / refFreq);
        const absCents = Math.abs(cents);

        // Disambiguate Low E vs High e:
        if (str.name === 'E' && freq > 230) continue; // That's High e!
        if (str.name === 'e' && freq < 230) continue; // That's Low E!

        if (absCents < minCentsDiff && absCents <= 80) {
          minCentsDiff = absCents;
          bestMatch = str;
          finalCents = cents;
        }
      }
    }

    // Fallback: If no string is within +/- 80 cents, find closest string by musical interval
    if (minCentsDiff > 80) {
      const midi = 12 * Math.log2(freq / 440) + 69;
      let smallestInterval = 999;

      for (const str of GUITAR_STRINGS) {
        const targetMidi = 12 * Math.log2(str.freq / 440) + 69;
        let effectiveTargetMidi = targetMidi;
        if (str.name === 'E' && freq > 130 && freq < 200) effectiveTargetMidi += 12;

        if (str.name === 'E' && freq > 230) continue;
        if (str.name === 'e' && freq < 230) continue;

        const interval = Math.abs(midi - effectiveTargetMidi);
        if (interval < smallestInterval) {
          smallestInterval = interval;
          bestMatch = str;
          finalCents = (midi - effectiveTargetMidi) * 100;
        }
      }
    }

    const noteInfo = PitchDetector.freqToNote(freq);
    return {
      string: bestMatch,
      cents: Math.round(finalCents * 10) / 10,
      detectedNote: `${noteInfo.note}${noteInfo.octave ?? ''}`,
    };
  }

  // Convert frequency to nearest Musical Note and Cents offset
  public static freqToNote(freq: number): { note: string; octave: number; cents: number; exactFreq: number } {
    const midiNumber = 12 * Math.log2(freq / 440) + 69;
    const roundedMidi = Math.round(midiNumber);
    const noteIndex = ((roundedMidi % 12) + 12) % 12;
    const octave = Math.floor(roundedMidi / 12) - 1;
    const exactFreq = 440 * Math.pow(2, (roundedMidi - 69) / 12);
    const cents = Math.round(1200 * Math.log2(freq / exactFreq));

    return {
      note: NOTE_NAMES[noteIndex],
      octave,
      cents,
      exactFreq,
    };
  }

  public static getCentsDiff(detectedFreq: number, targetFreq: number): number {
    return Math.round(1200 * Math.log2(detectedFreq / targetFreq));
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  // YIN Pitch Detection Algorithm with guitar-tuned threshold
  private detectPitchYIN(buffer: Float32Array, sampleRate: number): { freq: number; clarity: number } | null {
    const size = buffer.length;
    const minPeriod = Math.floor(sampleRate / this.maxFreq);
    const maxPeriod = Math.floor(sampleRate / this.minFreq);

    if (maxPeriod >= size) return null;

    // Step 1: Difference Function
    const d = new Float32Array(maxPeriod + 1);
    for (let tau = 1; tau <= maxPeriod; tau++) {
      let sum = 0;
      for (let i = 0; i < size - maxPeriod; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      d[tau] = sum;
    }

    // Step 2: Cumulative Mean Normalized Difference Function
    const dPrime = new Float32Array(maxPeriod + 1);
    dPrime[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau <= maxPeriod; tau++) {
      runningSum += d[tau];
      dPrime[tau] = runningSum > 0 ? d[tau] / (runningSum / tau) : 1;
    }

    // Step 3: Absolute Threshold Search (YIN threshold = 0.20 for guitar string resonance)
    const threshold = 0.20;
    let tauMatch = -1;
    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      if (dPrime[tau] < threshold) {
        while (tau + 1 <= maxPeriod && dPrime[tau + 1] < dPrime[tau]) {
          tau++;
        }
        tauMatch = tau;
        break;
      }
    }

    if (tauMatch === -1) {
      let minVal = 999;
      for (let tau = minPeriod; tau <= maxPeriod; tau++) {
        if (dPrime[tau] < minVal) {
          minVal = dPrime[tau];
          tauMatch = tau;
        }
      }
      if (minVal > 0.40) {
        return null;
      }
    }

    // Step 4: Parabolic Interpolation
    let finalTau = tauMatch;
    if (tauMatch > 1 && tauMatch < maxPeriod) {
      const s0 = dPrime[tauMatch - 1];
      const s1 = dPrime[tauMatch];
      const s2 = dPrime[tauMatch + 1];
      const denom = 2 * (2 * s1 - s0 - s2);
      if (denom !== 0) {
        const shift = (s2 - s0) / denom;
        if (!isNaN(shift) && Math.abs(shift) < 1) {
          finalTau += shift;
        }
      }
    }

    const freq = sampleRate / finalTau;
    if (freq < this.minFreq || freq > this.maxFreq) return null;

    const clarity = Math.max(0, Math.min(1, 1 - dPrime[tauMatch]));
    return { freq, clarity };
  }

  // Median filter to discard noise spikes
  private getMedianFrequency(val: number): number {
    this.recentFrequencies.push(val);
    if (this.recentFrequencies.length > this.historySize) {
      this.recentFrequencies.shift();
    }

    const sorted = [...this.recentFrequencies].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted[mid];
  }

  public async start(onPitch: (result: PitchDetectionResult) => void): Promise<{ success: boolean; error?: string }> {
    try {
      this.onPitchCallback = onPitch;
      this.recentFrequencies = [];
      this.smoothedFreq = null;
      this.stableCount = 0;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.stop();
        return { success: false, error: 'Microphone API is not supported in this browser environment.' };
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = this.bufferSize;

      this.sourceNode.connect(this.analyser);
      this.buffer = new Float32Array(this.bufferSize);

      this.isRunning = true;
      this.processLoop();

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.stop();
      return { success: false, error: errorMessage };
    }
  }

  private processLoop = () => {
    if (!this.isRunning || !this.analyser || !this.buffer || !this.audioCtx) return;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const rms = this.calculateRMS(this.buffer);

    if (rms < this.rmsThreshold) {
      this.recentFrequencies = [];
      this.stableCount = 0;
      this.onPitchCallback?.({
        frequency: null,
        rawFrequency: null,
        noteName: null,
        octave: null,
        cents: null,
        volume: rms,
        clarity: 0,
        isStable: false,
        waveform: this.buffer,
      });
    } else {
      const pitchResult = this.detectPitchYIN(this.buffer, this.audioCtx.sampleRate);

      if (pitchResult && pitchResult.clarity >= 0.65) {
        const medianFreq = this.getMedianFrequency(pitchResult.freq);

        if (this.smoothedFreq === null) {
          this.smoothedFreq = medianFreq;
        } else {
          // If large interval (>12%), reset to avoid lag between strings
          if (Math.abs(medianFreq - this.smoothedFreq) / this.smoothedFreq > 0.12) {
            this.smoothedFreq = medianFreq;
            this.stableCount = 0;
          } else {
            this.smoothedFreq = this.smoothedFreq * 0.70 + medianFreq * 0.30;
            this.stableCount = Math.min(20, this.stableCount + 1);
          }
        }

        const noteInfo = PitchDetector.freqToNote(this.smoothedFreq);
        this.onPitchCallback?.({
          frequency: this.smoothedFreq,
          rawFrequency: pitchResult.freq,
          noteName: noteInfo.note,
          octave: noteInfo.octave,
          cents: noteInfo.cents,
          volume: rms,
          clarity: pitchResult.clarity,
          isStable: this.stableCount >= 3,
          waveform: this.buffer,
        });
      } else {
        this.onPitchCallback?.({
          frequency: this.smoothedFreq,
          rawFrequency: null,
          noteName: this.smoothedFreq ? PitchDetector.freqToNote(this.smoothedFreq).note : null,
          octave: this.smoothedFreq ? PitchDetector.freqToNote(this.smoothedFreq).octave : null,
          cents: this.smoothedFreq ? PitchDetector.freqToNote(this.smoothedFreq).cents : null,
          volume: rms,
          clarity: pitchResult?.clarity || 0,
          isStable: false,
          waveform: this.buffer,
        });
      }
    }

    this.rafId = requestAnimationFrame(this.processLoop);
  };

  public stop() {
    this.isRunning = false;
    this.recentFrequencies = [];
    this.smoothedFreq = null;
    this.stableCount = 0;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const pitchDetector = new PitchDetector();
