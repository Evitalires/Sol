// Web Audio API Sound Engine for realistic guitar synthesis and UI sound effects

class GuitarAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Standard guitar tuning open string frequencies (E2, A2, D3, G3, B3, E4)
  private readonly STRING_BASE_FREQS = [
    82.41,  // 0: E2 (Low E)
    110.00, // 1: A2
    146.83, // 2: D3
    196.00, // 3: G3
    246.94, // 4: B3
    329.63  // 5: E4 (High e)
  ];

  // Plucks an individual guitar string at given fret
  public playPluck(stringIndex: number, fret: number = 0, duration: number = 1.2, velocity = 1, timbre: 'guitar' | 'pure' = 'guitar') {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const baseFreq = this.STRING_BASE_FREQS[stringIndex] || 110;
      // Formula for fretted note frequency: f = f0 * 2^(fret/12)
      const freq = baseFreq * Math.pow(2, fret / 12);

      const now = this.ctx.currentTime;

      // Complex plucked string timbre: fundamental oscillator + harmonic + noise impulse
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Triangle / Saw combination gives warm guitar string texture
      osc1.type = timbre === 'pure' ? 'sine' : 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = timbre === 'pure' ? 'sine' : 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 2, now); // Second harmonic

      // Low pass filter with pluck attack
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 5, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 200), now + duration);

      // Amplitude envelope: sudden pluck attack + exponential decay
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.4 * Math.max(0.05, Math.min(1, velocity)), now + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Connect nodes
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {
      // Audio autoplay or web audio context error safeguard
    }
  }

  public playDynamicsDemo(stringIndex: number, fret: number) {
    this.playPluck(stringIndex, fret, 0.7, 0.2);
    window.setTimeout(() => this.playPluck(stringIndex, fret, 0.7, 1), 850);
  }

  public playTimbreDemo(stringIndex: number, fret: number) {
    this.playPluck(stringIndex, fret, 0.9, 0.8, 'guitar');
    window.setTimeout(() => this.playPluck(stringIndex, fret, 0.9, 0.8, 'pure'), 1050);
  }

  // Strum a full chord (e.g. 'Em', 'G', 'C', 'D', 'Am')
  public playChord(chordName: string = 'Em') {
    if (this.isMuted) return;
    this.initContext();

    const chordFingerings: Record<string, number[]> = {
      Em: [0, 2, 2, 0, 0, 0],
      G:  [3, 2, 0, 0, 0, 3],
      C:  [-1, 3, 2, 0, 1, 0],
      D:  [-1, -1, 0, 2, 3, 2],
      Am: [-1, 0, 2, 2, 1, 0],
      A:  [-1, 0, 2, 2, 2, 0],
      E:  [0, 2, 2, 1, 0, 0],
      F:  [1, 3, 3, 2, 1, 1],
    };

    const frets = chordFingerings[chordName] || [0, 2, 2, 0, 0, 0];
    
    // Rapid downward strum with slight delay per string (natural guitar strumming)
    frets.forEach((fret, strIdx) => {
      if (fret >= 0) {
        setTimeout(() => {
          this.playPluck(strIdx, fret, 1.8);
        }, strIdx * 35);
      }
    });
  }

  public playSequence(notes: { stringIndex: number; fret: number; duration?: number }[], gapMs = 420) {
    notes.forEach((note, index) => {
      window.setTimeout(() => this.playPluck(note.stringIndex, note.fret, note.duration ?? 0.55), index * gapMs);
    });
  }

  // UI Sound Effects
  public playSuccessSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Ignored
    }
  }

  public playNoteHit(accuracy: 'perfect' | 'great' | 'ok') {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = accuracy === 'perfect' ? 880 : accuracy === 'great' ? 660 : 440;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignored
    }
  }

  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Ignored
    }
  }

  // Sustained rich tuner tone with harmonics for clear mobile & speaker audibility
  public playTunerReference(frequency: number, duration: number = 2.5) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Dual oscillator with fundamental and 2nd harmonic
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(frequency, now);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(frequency * 2, now); // 2nd harmonic enables mobile speakers to hear low bass notes

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.max(400, frequency * 4), now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(250, frequency * 1.5), now + duration);

      // Volume envelope: smooth pluck attack and sustained ring
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gainNode.gain.setValueAtTime(0.3, now + duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {
      // Ignored
    }
  }
}

export const sound = new GuitarAudioEngine();
