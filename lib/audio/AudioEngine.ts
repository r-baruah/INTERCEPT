import * as Tone from 'tone';
import { AudioEngineState, AudioParameters } from '@/types/audio';

// ========================================================================
// INTERCEPT - HELIOSPHERIC AUDIO ENGINE v4.0
// Implementing the full 4-Layer architecture:
//   Layer 1: Carrier Wave (Drone) - LFO-modulated ambient pads
//   Layer 2: Atmosphere (Lo-Fi) - Persistent pink noise, signal-lock controlled
//   Layer 3: Interference (Glitch) - BitCrusher + Tape Warble, Kp-controlled
//   Layer 4: Operator (Voice) - TTS with sidechain ducking
// ========================================================================

// Deep Space Chord Progressions (Csus2 variants for that Interstellar feel)
const HELIO_CHORDS = [
  ['C2', 'G2', 'D3', 'G3'],      // Csus2 (foundation)
  ['A1', 'E2', 'B2', 'E3'],      // Asus2
  ['F2', 'C3', 'G3', 'C4'],      // Fsus2
  ['D2', 'A2', 'E3', 'A3'],      // Dsus2
  ['G1', 'D2', 'A2', 'D3'],      // Gsus2 (resolution)
];

// Crystalline shimmer notes for celestial arpeggios
const SHIMMER_NOTES = ['E5', 'G5', 'A5', 'C6', 'D6', 'E6'];
const COSMIC_SCALE = ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4'];

/**
 * Heliospheric Audio Engine v4.0
 * Professional 4-layer audio system driven by space weather telemetry
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  // === LAYER 1: CARRIER WAVE (THE DRONE) ===
  private droneSynth: Tone.PolySynth | null = null;
  private droneLFO: Tone.LFO | null = null;           // Solar wind → breathing rate
  private droneGain: Tone.Gain | null = null;         // LFO target
  private droneFilter: Tone.Filter | null = null;     // Density → cutoff

  // === LAYER 2: ATMOSPHERE (LO-FI TEXTURE) ===
  private atmosphereNoise: Tone.Noise | null = null;  // Always-on pink noise
  private atmosphereGain: Tone.Gain | null = null;    // Signal lock → volume
  private atmosphereFilter: Tone.Filter | null = null;// K-index → color (bright/dark)
  private atmosphereSaturation: Tone.Chebyshev | null = null;

  // === LAYER 3: INTERFERENCE (THE GLITCH) ===
  private masterBitCrusher: Tone.BitCrusher | null = null;  // On master bus
  private tapeWobble: Tone.Vibrato | null = null;           // Pitch warble for mid-Kp
  private glitchTremolo: Tone.Tremolo | null = null;        // Stutter effect

  // === LAYER 4: OPERATOR (VOICE) ===
  private speechSynth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;

  // === SUPPORT SYNTHS ===
  private arpsSynth: Tone.MonoSynth | null = null;
  private shimmerSynth: Tone.PolySynth | null = null;
  private bassSynth: Tone.MonoSynth | null = null;
  private alertSynth: Tone.PolySynth | null = null;
  private announceSynth: Tone.PolySynth | null = null;

  // === EFFECTS ===
  private reverb: Tone.Reverb | null = null;
  private delay: Tone.PingPongDelay | null = null;
  private chorus: Tone.Chorus | null = null;
  private compressor: Tone.Compressor | null = null;
  private limiter: Tone.Limiter | null = null;
  private analyzer: Tone.Analyser | null = null;
  private masterVolume: Tone.Volume | null = null;
  private fftAnalyzer: Tone.FFT | null = null;

  // === LOOPS ===
  private chordLoop: Tone.Loop | null = null;
  private arpLoop: Tone.Loop | null = null;
  private bassLoop: Tone.Loop | null = null;
  private shimmerLoop: Tone.Loop | null = null;

  // === TUNING RITUAL (Temporary, user-controlled) ===
  private tuningNoise: Tone.Noise | null = null;
  private tuningGain: Tone.Gain | null = null;
  private tuningFilter: Tone.Filter | null = null;

  // === STATE ===
  private state: AudioEngineState = {
    isInitialized: false,
    isPlaying: false,
    volume: -6,
    bpm: 55,
    distortion: 0,
    filterFrequency: 1800
  };

  // Current telemetry cache for real-time control
  private currentKpIndex: number = 0;
  private currentSignalLock: number = 0; // 0 = unlocked, 1 = locked
  private currentWindSpeed: number = 400; // km/s

  private constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynth = window.speechSynthesis;
    }
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.state.isInitialized) return;

    console.log('🎛️ Heliospheric Audio Engine v4.0 initializing...');
    await Tone.start();

    // =====================================================================
    // LAYER 1: CARRIER WAVE (THE DRONE)
    // Deep ambient pad with LFO-controlled "breathing"
    // =====================================================================

    this.droneSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsawtooth',
        spread: 40,
        count: 3
      },
      envelope: {
        attack: 4,
        decay: 3,
        sustain: 0.8,
        release: 6
      }
    });

    // Drone filter (Density → cutoff)
    this.droneFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 1800,
      rolloff: -24,
      Q: 1
    });

    // Drone gain (LFO target for "breathing")
    this.droneGain = new Tone.Gain(0.7);

    // LFO for drone breathing (Solar Wind Speed → Rate)
    this.droneLFO = new Tone.LFO({
      frequency: 0.1, // Very slow default (calm solar wind)
      min: 0.4,
      max: 1.0,
      type: 'sine'
    });
    this.droneLFO.connect(this.droneGain.gain);

    // =====================================================================
    // LAYER 2: ATMOSPHERE (LO-FI TEXTURE)
    // Persistent pink noise - always on, volume controlled by signal lock
    // =====================================================================

    this.atmosphereNoise = new Tone.Noise('pink');

    // Saturation for warmth
    this.atmosphereSaturation = new Tone.Chebyshev(20);

    // Filter for "color" (K-index → brightness)
    this.atmosphereFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 800,    // Dark by default
      rolloff: -12
    });

    // Gain controlled by signal lock
    this.atmosphereGain = new Tone.Gain(0.15); // Default: audible hiss (unlocked)

    // =====================================================================
    // LAYER 3: INTERFERENCE (THE GLITCH)
    // BitCrusher + Tape Warble on master bus, Kp-controlled
    // =====================================================================

    // Master BitCrusher (Kp → bit depth + wet)
    this.masterBitCrusher = new Tone.BitCrusher({
      bits: 16,  // Clean by default
    });
    this.masterBitCrusher.wet.value = 0; // Bypassed initially

    // Tape Warble (Vibrato for pitch wobble at mid-Kp)
    this.tapeWobble = new Tone.Vibrato({
      frequency: 2,     // Hz - tape flutter speed
      depth: 0,         // No wobble initially
      type: 'sine'
    });

    // Glitch Tremolo (stutter at high Kp)
    this.glitchTremolo = new Tone.Tremolo({
      frequency: 8,
      depth: 0,         // Off initially
      type: 'square'
    }).start();

    // =====================================================================
    // SUPPORT SYNTHS (Arps, Shimmer, Bass, Alerts)
    // =====================================================================

    this.arpsSynth = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.05, release: 1.5 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.6,
        sustain: 0.1,
        baseFrequency: 400,
        octaves: 5
      }
    });
    this.arpsSynth.volume.value = -18;

    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 2, sustain: 0.9, release: 4 },
      filter: { type: 'lowpass', frequency: 80, Q: 1 }
    });
    this.bassSynth.volume.value = -10;

    this.shimmerSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0, release: 1.5 }
    });
    this.shimmerSynth.volume.value = -24;

    this.alertSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.2 }
    }).toDestination();
    this.alertSynth.volume.value = -4;

    this.announceSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 }
    }).toDestination();
    this.announceSynth.volume.value = -6;

    // =====================================================================
    // EFFECTS CHAIN
    // =====================================================================

    this.chorus = new Tone.Chorus({
      frequency: 0.3,
      delayTime: 4,
      depth: 0.4,
      wet: 0.3
    }).start();

    this.reverb = new Tone.Reverb({
      decay: 12,
      wet: 0.4,
      preDelay: 0.05
    });
    await this.reverb.generate();

    this.delay = new Tone.PingPongDelay({
      delayTime: "8n.",
      feedback: 0.3,
      wet: 0.25
    });

    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.05,
      release: 0.2
    });

    this.limiter = new Tone.Limiter(-1);
    this.analyzer = new Tone.Analyser('waveform', 512);
    this.masterVolume = new Tone.Volume(this.state.volume);

    // =====================================================================
    // ROUTING - THE SIGNAL FLOW
    // =====================================================================

    const destination = Tone.Destination;

    // DRONE PATH: Synth → Filter → Gain(LFO) → Chorus → Reverb → BitCrusher → Wobble → Tremolo → Compressor → Limiter → Master
    this.droneSynth.chain(
      this.droneFilter,
      this.droneGain,
      this.chorus,
      this.reverb,
      this.masterBitCrusher,
      this.tapeWobble,
      this.glitchTremolo,
      this.compressor,
      this.limiter,
      this.analyzer,
      this.masterVolume,
      destination
    );

    // ATMOSPHERE PATH: Noise → Saturation → Filter → Gain → BitCrusher → ...Master
    this.atmosphereNoise.chain(
      this.atmosphereSaturation,
      this.atmosphereFilter,
      this.atmosphereGain,
      this.masterBitCrusher // Shares interference effects
    );

    // ARPS PATH: → Delay → Reverb → Master chain
    this.arpsSynth.chain(
      this.delay,
      this.reverb,
      this.masterBitCrusher
    );

    // BASS PATH: → Filter (reuse drone filter for cohesion) → Master
    this.bassSynth.chain(
      this.compressor,
      this.limiter,
      this.masterVolume,
      destination
    );

    // SHIMMER PATH: → Delay → Reverb → Master
    this.shimmerSynth.chain(
      this.delay,
      this.reverb,
      this.masterBitCrusher
    );

    // Set BPM
    Tone.Transport.bpm.value = this.state.bpm;

    this.createSequences();
    this.state.isInitialized = true;

    console.log('✅ Heliospheric Audio Engine v4.0 ready!');
    console.log('   Layer 1: Carrier Wave (Drone) ✓');
    console.log('   Layer 2: Atmosphere (Lo-Fi) ✓');
    console.log('   Layer 3: Interference (Glitch) ✓');
    console.log('   Layer 4: Operator (Voice) ✓');
  }

  private createSequences(): void {
    let chordIndex = 0;
    let beatCount = 0;

    // === CHORD PROGRESSION (Every 4 measures - very slow) ===
    this.chordLoop = new Tone.Loop((time) => {
      const currentChord = HELIO_CHORDS[chordIndex % HELIO_CHORDS.length];
      this.droneSynth?.triggerAttackRelease(currentChord, "4m", time);

      // Progress chord every 2nd iteration
      if (beatCount % 2 === 0) {
        chordIndex = (chordIndex + 1) % HELIO_CHORDS.length;
      }
      beatCount++;
    }, "4m");

    // === MELODIC ARPEGGIO (Probabilistic, space-y) ===
    this.arpLoop = new Tone.Loop((time) => {
      if (Math.random() > 0.7) {
        const note = COSMIC_SCALE[Math.floor(Math.random() * COSMIC_SCALE.length)];
        const velocity = 0.3 + Math.random() * 0.4;
        this.arpsSynth?.triggerAttackRelease(note, "8n", time, velocity);
      }
    }, "4n");

    // === BASS DRONE (Every 4 measures) ===
    this.bassLoop = new Tone.Loop((time) => {
      const bassNotes = ['C1', 'A0', 'F1', 'G1', 'D1'];
      const bassNote = bassNotes[chordIndex % bassNotes.length];
      this.bassSynth?.triggerAttackRelease(bassNote, "4m", time);
    }, "4m");

    // === HIGH SHIMMER (Occasional celestial sparkles) ===
    this.shimmerLoop = new Tone.Loop((time) => {
      if (Math.random() > 0.85) {
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) {
          const note = SHIMMER_NOTES[Math.floor(Math.random() * SHIMMER_NOTES.length)];
          const delay = Math.random() * 0.3;
          this.shimmerSynth?.triggerAttackRelease(note, "16n", time + delay, 0.2 + Math.random() * 0.3);
        }
      }
    }, "2n");
  }

  play(): void {
    if (!this.state.isInitialized) throw new Error('AudioEngine not initialized');
    if (this.state.isPlaying) return;

    Tone.Transport.start();

    // Start LFO for drone breathing
    this.droneLFO?.start();

    // Start atmosphere (always-on noise)
    this.atmosphereNoise?.start();

    // Start loops
    this.chordLoop?.start(0);
    this.arpLoop?.start("1m");
    this.bassLoop?.start(0);
    this.shimmerLoop?.start("2m");

    this.state.isPlaying = true;
    console.log('▶️ Heliospheric Audio Engine: Transmission started');
  }

  stop(): void {
    Tone.Transport.stop();

    // Stop LFO
    this.droneLFO?.stop();

    // Stop atmosphere
    this.atmosphereNoise?.stop();

    // Stop loops
    this.chordLoop?.stop();
    this.arpLoop?.stop();
    this.bassLoop?.stop();
    this.shimmerLoop?.stop();

    // Release all hanging notes
    this.droneSynth?.releaseAll();
    this.shimmerSynth?.releaseAll();
    this.speechSynth?.cancel();

    this.state.isPlaying = false;
    console.log('⏹️ Heliospheric Audio Engine: Transmission stopped');
  }

  // =========================================================================
  // CORE TELEMETRY UPDATE - THE DATA LOOP
  // This is where space weather data transforms into audio
  // =========================================================================
  updateParameters(params: AudioParameters): void {
    if (!this.state.isInitialized) return;

    // -----------------------------------------------------------------------
    // LAYER 1: SOLAR WIND SPEED → LFO RATE (Drone Breathing)
    // Slow wind (300): The drone breathes slowly (ocean waves)
    // Fast wind (800): The drone pulses rapidly (helicopter tension)
    // -----------------------------------------------------------------------
    if (params.bpm !== undefined) {
      // BPM param carries the solar wind speed for us
      const windSpeed = params.bpm; // Actually wind speed in disguise
      this.currentWindSpeed = windSpeed;

      // Map wind speed (300-800 km/s) to LFO frequency (0.05 - 2.0 Hz)
      const normalizedSpeed = Math.max(0, Math.min(1, (windSpeed - 300) / 500));
      const lfoRate = 0.05 + (normalizedSpeed * 1.95);

      if (this.droneLFO) {
        this.droneLFO.frequency.rampTo(lfoRate, 2);
      }

      // Also subtly affect transport BPM for the sequences
      const targetBpm = Math.max(45, Math.min(80, 45 + normalizedSpeed * 35));
      Tone.Transport.bpm.rampTo(targetBpm, 4);
    }

    // -----------------------------------------------------------------------
    // LAYER 1: DENSITY → FILTER CUTOFF (Drone Clarity)
    // Low density: Sound is muffled, dark, underwater
    // High density: Filter opens up, sound becomes bright and buzzing
    // -----------------------------------------------------------------------
    if (params.filterFrequency !== undefined || params.filterFreq !== undefined) {
      const freq = params.filterFrequency ?? params.filterFreq ?? 1000;
      const clampedFreq = Math.max(200, Math.min(5000, freq));
      this.droneFilter?.frequency.rampTo(clampedFreq, 2);
    }

    // -----------------------------------------------------------------------
    // LAYER 3: KP INDEX → INTERFERENCE (BitCrusher + Tape Warble)
    // Kp < 4 (Nominal): Clean audio, no effects
    // Kp 5-6 (Warning): Tape warble - vintage sampler vibe
    // Kp 7-9 (Critical): Digital shredding - 4-bit destruction
    // -----------------------------------------------------------------------
    if (params.distortion !== undefined) {
      // distortion param is actually normalized Kp (0-1 from kpIndexToDistortion)
      // We need to reverse-engineer the Kp index
      const normalizedKp = params.distortion;
      const kpIndex = Math.sqrt(normalizedKp / 0.8) * 9; // Reverse exponential
      this.currentKpIndex = kpIndex;

      this.applyInterference(kpIndex);
    }

    // -----------------------------------------------------------------------
    // LAYER 2: ATMOSPHERE INTENSITY (Signal Lock State)
    // This is handled separately via setSignalLock()
    // -----------------------------------------------------------------------

    // -----------------------------------------------------------------------
    // INTENSITY MIXING (The "Vibe Switch")
    // -----------------------------------------------------------------------
    if (params.intensity !== undefined) {
      const i = params.intensity;

      // Arps: More prominent at high intensity
      const arpsTarget = -40 + (i * 24);
      this.arpsSynth?.volume.rampTo(arpsTarget, 2);

      // Shimmer: Off below 0.4, then fades in
      const shimmerTarget = i < 0.4 ? -60 : -30 + (i * 10);
      this.shimmerSynth?.volume.rampTo(shimmerTarget, 3);

      // Drone breathing depth increases with intensity
      if (this.droneLFO) {
        this.droneLFO.min = 0.3 + (i * 0.2);  // More variance at high intensity
        this.droneLFO.max = 0.8 + (i * 0.2);
      }

      // Bass presence
      this.bassSynth?.volume.rampTo(-10 + (i * 3), 2);
    }

    // -----------------------------------------------------------------------
    // VOLUME BOOST (Flares)
    // -----------------------------------------------------------------------
    if (params.volumeBoost !== undefined) {
      const boost = params.volumeBoost;
      this.masterVolume?.volume.rampTo(this.state.volume + boost, 0.5);
    }
  }

  // =========================================================================
  // LAYER 3: INTERFERENCE SYSTEM
  // Kp Index controls BitCrusher, Tape Warble, and Tremolo
  // =========================================================================
  private applyInterference(kpIndex: number): void {
    if (!this.masterBitCrusher || !this.tapeWobble || !this.glitchTremolo) return;

    if (kpIndex < 4) {
      // NOMINAL: Clean audio
      this.masterBitCrusher.wet.rampTo(0, 0.5);
      this.tapeWobble.depth.rampTo(0, 0.5);
      this.glitchTremolo.depth.rampTo(0, 0.5);

      // Atmosphere stays calm and warm
      this.atmosphereFilter?.frequency.rampTo(600, 1);

    } else if (kpIndex < 7) {
      // WARNING: Tape Warble (Vintage Sampler)
      this.masterBitCrusher.wet.rampTo(0.25, 0.5);
      this.masterBitCrusher.bits.value = 8;

      // Pitch wobble like old magnetic tape
      this.tapeWobble.depth.rampTo(0.15, 0.5);
      this.tapeWobble.frequency.value = 3 + (kpIndex - 4) * 1.5; // Faster at higher Kp

      this.glitchTremolo.depth.rampTo(0, 0.5);

      // Atmosphere gets brighter/harsher
      this.atmosphereFilter?.frequency.rampTo(1500, 1);

    } else {
      // CRITICAL: Digital Shredding
      this.masterBitCrusher.wet.rampTo(0.7, 0.3);
      this.masterBitCrusher.bits.value = 4;

      // Extreme tape warble
      this.tapeWobble.depth.rampTo(0.35, 0.3);
      this.tapeWobble.frequency.value = 6;

      // Stutter effect
      const stutterIntensity = (kpIndex - 7) / 2; // 0-1 for Kp 7-9
      this.glitchTremolo.depth.rampTo(stutterIntensity * 0.6, 0.3);
      this.glitchTremolo.frequency.value = 10 + stutterIntensity * 10;

      // Atmosphere becomes harsh white-ish static
      this.atmosphereFilter?.frequency.rampTo(4000, 0.5);
    }
  }

  // =========================================================================
  // LAYER 2: SIGNAL LOCK → ATMOSPHERE NOISE VOLUME
  // Called by the Tuner component or when signal quality changes
  // =========================================================================
  setSignalLock(quality: number): void {
    if (!this.atmosphereGain) return;

    this.currentSignalLock = quality;

    // Quality 0 (unlocked): Noise is loud (-10dB)
    // Quality 1 (locked): Noise is tucked away (-35dB)
    const targetGain = 0.25 - (quality * 0.23); // 0.25 → 0.02
    this.atmosphereGain.gain.rampTo(targetGain, 0.3);

    console.log(`📡 Signal Lock: ${(quality * 100).toFixed(0)}% → Atmosphere: ${(targetGain * 100).toFixed(1)}%`);
  }

  // =========================================================================
  // TUNING RITUAL (User-controlled static overlay)
  // This is ADDITIONAL to the atmosphere layer
  // =========================================================================
  public startTuning(): void {
    if (!this.state.isInitialized || this.tuningNoise) return;

    this.tuningNoise = new Tone.Noise('pink').start();
    this.tuningFilter = new Tone.Filter(1000, 'bandpass');
    this.tuningGain = new Tone.Gain(0);

    this.tuningNoise.chain(this.tuningFilter, this.tuningGain, this.limiter || Tone.Destination);
    this.tuningGain.gain.rampTo(0.15, 0.5);
  }

  public setTuning(quality: number): void {
    if (!this.tuningNoise || !this.tuningGain || !this.tuningFilter) return;

    const inverseQuality = 1 - quality;
    const targetGain = Math.max(0, inverseQuality * 0.2);
    this.tuningGain.gain.rampTo(targetGain, 0.1);

    const clampedQuality = Math.max(0, Math.min(1, quality));
    const targetFreq = 500 + (clampedQuality * 2500);
    this.tuningFilter.frequency.rampTo(targetFreq, 0.1);

    // Also update global signal lock state
    this.setSignalLock(quality);
  }

  public stopTuning(): void {
    if (!this.tuningNoise) return;

    this.tuningGain?.gain.rampTo(0, 0.5);

    setTimeout(() => {
      this.tuningNoise?.stop();
      this.tuningNoise?.dispose();
      this.tuningFilter?.dispose();
      this.tuningGain?.dispose();

      this.tuningNoise = null;
      this.tuningFilter = null;
      this.tuningGain = null;
    }, 500);
  }

  // =========================================================================
  // ALERT SOUNDS
  // =========================================================================
  triggerAlert(severity: 'info' | 'warning' | 'danger' = 'info'): void {
    if (!this.alertSynth) return;

    const now = Tone.now();
    switch (severity) {
      case 'info':
        this.alertSynth.triggerAttackRelease("C5", "16n", now, 0.6);
        this.alertSynth.triggerAttackRelease("E5", "16n", now + 0.08, 0.7);
        this.alertSynth.triggerAttackRelease("G5", "8n", now + 0.16, 0.8);
        break;
      case 'warning':
        this.alertSynth.triggerAttackRelease(["E5", "A5"], "8n", now, 0.8);
        this.alertSynth.triggerAttackRelease(["E5", "A5"], "8n", now + 0.25, 0.9);
        this.alertSynth.triggerAttackRelease(["E5", "A5"], "8n", now + 0.5, 1);
        break;
      case 'danger':
        for (let i = 0; i < 4; i++) {
          this.alertSynth.triggerAttackRelease(["C5", "F#5"], "16n", now + i * 0.12, 1);
        }
        this.alertSynth.triggerAttackRelease(["C3", "G3"], "4n", now + 0.5, 0.5);
        break;
    }
  }

  // =========================================================================
  // LAYER 4: OPERATOR (VOICE) SYSTEM
  // =========================================================================
  private playAnnouncementChime(): void {
    if (!this.announceSynth) return;

    const now = Tone.now();
    this.announceSynth.triggerAttackRelease("C5", "16n", now, 0.7);
    this.announceSynth.triggerAttackRelease("E5", "16n", now + 0.1, 0.8);
    this.announceSynth.triggerAttackRelease("G5", "16n", now + 0.2, 0.9);
    this.announceSynth.triggerAttackRelease("C6", "8n", now + 0.35, 1);
  }

  private duckMusic(): void {
    if (this.masterVolume) {
      this.masterVolume.volume.rampTo(this.state.volume - 15, 0.5);
    }
    // Also reduce atmosphere during speech
    this.atmosphereGain?.gain.rampTo(0.02, 0.3);
  }

  private unduckMusic(): void {
    if (this.masterVolume) {
      this.masterVolume.volume.rampTo(this.state.volume, 1.5);
    }
    // Restore atmosphere based on current signal lock
    if (this.atmosphereGain) {
      const targetGain = 0.25 - (this.currentSignalLock * 0.23);
      this.atmosphereGain.gain.rampTo(targetGain, 1);
    }
    this.isSpeaking = false;
  }

  async speak(text: string): Promise<void> {
    if (!this.state.isInitialized || this.isSpeaking) return;
    this.isSpeaking = true;

    console.log('📢 Preparing announcement:', text.substring(0, 50) + '...');

    this.playAnnouncementChime();
    await new Promise(resolve => setTimeout(resolve, 600));
    this.duckMusic();
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
      const response = await fetch('/api/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.warn(`TTS API returned ${response.status}, using Web Speech fallback`);
        this.speakWithWebSpeech(text);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength < 200) {
        console.warn('TTS response too small, using Web Speech fallback');
        this.speakWithWebSpeech(text);
        return;
      }

      const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
      const player = new Tone.Player(audioBuffer);
      const speechGain = new Tone.Gain(4.0);

      player.chain(speechGain, this.limiter || Tone.Destination);
      player.start();

      console.log('🔊 Playing TTS audio');

      player.onstop = () => {
        speechGain.dispose();
        player.dispose();
        this.unduckMusic();
      };

    } catch (error) {
      console.error('TTS error:', error);
      this.speakWithWebSpeech(text);
    }
  }

  private speakWithWebSpeech(text: string): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Web Speech API unavailable');
      this.unduckMusic();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;

    utterance.onend = () => this.unduckMusic();
    utterance.onerror = () => this.unduckMusic();

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft David') ||
      v.name.includes('Microsoft Mark') ||
      v.name.includes('Alex') ||
      (v.lang.startsWith('en') && v.name.includes('Male'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    try {
      window.speechSynthesis.speak(utterance);
      console.log('🗣️ Using Web Speech API');
    } catch (e) {
      console.error('Web Speech failed:', e);
      this.unduckMusic();
    }
  }

  // =========================================================================
  // SPECIAL EFFECTS
  // =========================================================================
  public createExplosion(): void {
    if (!this.state.isInitialized) return;

    const noise = new Tone.Noise('brown').start();
    const filter = new Tone.Filter(2000, 'lowpass');
    const envelope = new Tone.AmplitudeEnvelope({
      attack: 0.02,
      decay: 1.0,
      sustain: 0.2,
      release: 0.5
    });
    const explosionGain = new Tone.Gain(0.6);

    noise.connect(filter);
    filter.connect(envelope);
    envelope.connect(explosionGain);

    if (this.limiter) {
      explosionGain.connect(this.limiter);
    } else {
      explosionGain.toDestination();
    }

    envelope.triggerAttackRelease(1.2);
    filter.frequency.rampTo(50, 1);

    setTimeout(() => {
      noise.stop();
      noise.dispose();
      filter.dispose();
      envelope.dispose();
      explosionGain.dispose();
    }, 2000);
  }

  public createStatic(duration: number = 0.5): void {
    if (!this.state.isInitialized) return;

    const noise = new Tone.Noise('pink').start();
    const bitCrusher = new Tone.BitCrusher(3);
    const filter = new Tone.Filter(3000, 'bandpass');
    const gain = new Tone.Gain(0.25);

    noise.chain(bitCrusher, filter, gain, this.limiter || Tone.Destination);

    setTimeout(() => {
      gain.gain.rampTo(0, 0.15);
      setTimeout(() => {
        noise.stop();
        noise.dispose();
        bitCrusher.dispose();
        filter.dispose();
        gain.dispose();
      }, 250);
    }, duration * 1000);
  }

  // =========================================================================
  // DIRECT KP INDEX UPDATE (for Simulation Panel)
  // =========================================================================
  public setKpIndex(kpIndex: number): void {
    this.currentKpIndex = kpIndex;
    this.applyInterference(kpIndex);
  }

  // =========================================================================
  // DIRECT WIND SPEED UPDATE
  // =========================================================================
  public setWindSpeed(speed: number): void {
    this.currentWindSpeed = speed;
    const normalizedSpeed = Math.max(0, Math.min(1, (speed - 300) / 500));
    const lfoRate = 0.05 + (normalizedSpeed * 1.95);
    this.droneLFO?.frequency.rampTo(lfoRate, 2);
  }

  // =========================================================================
  // ANALYSIS / GETTERS
  // =========================================================================
  getAnalyzer(): Tone.Analyser | null {
    return this.analyzer;
  }

  getWaveformData(): Float32Array | null {
    if (!this.analyzer) return null;
    return this.analyzer.getValue() as Float32Array;
  }

  getFrequencyData(): Float32Array | null {
    if (!this.state.isInitialized) return null;

    if (!this.fftAnalyzer) {
      this.fftAnalyzer = new Tone.FFT(256);
      this.masterVolume?.connect(this.fftAnalyzer);
    }

    return this.fftAnalyzer.getValue() as Float32Array;
  }

  getAmplitude(): number {
    const waveform = this.getWaveformData();
    if (!waveform) return 0;

    let sum = 0;
    for (let i = 0; i < waveform.length; i++) {
      sum += waveform[i] * waveform[i];
    }
    return Math.sqrt(sum / waveform.length);
  }

  getState(): AudioEngineState {
    return { ...this.state };
  }

  isAudioPlaying(): boolean {
    return this.state.isPlaying;
  }

  setVolume(volumeDb: number): void {
    if (this.masterVolume) {
      const clampedVolume = Math.max(-40, Math.min(0, volumeDb));
      this.masterVolume.volume.rampTo(clampedVolume, 0.3);
      this.state.volume = clampedVolume;
    }
  }

  // Get current telemetry state (for debugging/display)
  getTelemetryState(): { kpIndex: number; signalLock: number; windSpeed: number } {
    return {
      kpIndex: this.currentKpIndex,
      signalLock: this.currentSignalLock,
      windSpeed: this.currentWindSpeed
    };
  }
}

export const getAudioEngine = () => AudioEngine.getInstance();