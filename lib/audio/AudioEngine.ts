import * as Tone from 'tone';
import { AudioEngineState, AudioParameters } from '@/types/audio';
import { getRandomNote } from './scales';

// ========================================================================
// COSMIC RADIO - ENHANCED AUDIO ENGINE v2.0
// Synthwave-inspired deep space soundscape with clear announcements
// ========================================================================

// Cinematic Deep Space Scales - More dramatic and haunting
const COSMIC_SCALE = ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4'];
const DEEP_SPACE_CHORDS = [
  ['A2', 'E3', 'A3', 'C4'],      // Am (foundation)
  ['F2', 'C3', 'F3', 'A3'],       // Fmaj 
  ['D2', 'A2', 'D3', 'F3'],       // Dm
  ['E2', 'B2', 'E3', 'G#3'],      // E (dramatic tension)
  ['G2', 'D3', 'G3', 'B3'],       // G (resolution hint)
];

// High shimmer notes for celestial arpeggios
const SHIMMER_NOTES = ['E5', 'G5', 'A5', 'C6', 'D6', 'E6'];

/**
 * Enhanced Singleton Audio Engine for Cosmic Radio
 * Professional-grade audio with clear speech, dramatic effects, and immersive soundscape
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  // === SYNTHS ===
  private padSynth: Tone.PolySynth | null = null;      // Deep ambient pads
  private arpsSynth: Tone.MonoSynth | null = null;     // Crystalline arpeggios
  private bassSynth: Tone.MonoSynth | null = null;     // Sub bass drone
  private shimmerSynth: Tone.PolySynth | null = null;  // High celestial sparkles
  private alertSynth: Tone.PolySynth | null = null;    // UI alerts & notifications
  private announceSynth: Tone.PolySynth | null = null; // Pre-announcement chime

  // === EFFECTS ===
  private reverb: Tone.Reverb | null = null;
  private delay: Tone.PingPongDelay | null = null;
  private filter: Tone.Filter | null = null;
  private chorus: Tone.Chorus | null = null;           // Space widening
  private compressor: Tone.Compressor | null = null;
  private limiter: Tone.Limiter | null = null;         // Prevent clipping
  private analyzer: Tone.Analyser | null = null;
  private masterVolume: Tone.Volume | null = null;
  private fftAnalyzer: Tone.FFT | null = null;

  // === LOOPS ===
  private chordLoop: Tone.Loop | null = null;
  private arpLoop: Tone.Loop | null = null;
  private bassLoop: Tone.Loop | null = null;
  private shimmerLoop: Tone.Loop | null = null;

  // === SPEECH ===
  private speechSynth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;

  // === STATE ===
  private state: AudioEngineState = {
    isInitialized: false,
    isPlaying: false,
    volume: -6,           // Louder default (-6dB instead of -10dB)
    bpm: 55,              // Slower, more atmospheric
    distortion: 0,
    filterFrequency: 1800
  };

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

    console.log('🎵 Cosmic Radio AudioEngine v2.0 initializing...');
    await Tone.start();

    // 1. Deep Ambient Pad Synth (Warm, enveloping strings)
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatcustom',
        partials: [0.3, 1, 0.2, 0.4, 0.1, 0.05],
        spread: 50,
        count: 4
      },
      envelope: { attack: 3, decay: 4, sustain: 0.7, release: 5 }
    });
    this.padSynth.volume.value = -14; // Softer pads for background

    // 2. Crystalline Arpeggiator (Delicate, shimmering)
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

    // 3. Sub Bass Drone (Deep, pulsing foundation)
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 2, sustain: 0.9, release: 4 },
      filter: { type: 'lowpass', frequency: 80, Q: 1 }
    });
    this.bassSynth.volume.value = -10;

    // 4. High Shimmer Synth (Celestial sparkles)
    this.shimmerSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0, release: 1.5 }
    });
    this.shimmerSynth.volume.value = -24;

    // 5. Alert Synth (Clear, distinct notifications)
    this.alertSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.2 }
    }).toDestination();  // Direct to output for clarity
    this.alertSynth.volume.value = -4; // LOUD alerts

    // 6. Announcement Chime Synth
    this.announceSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 }
    }).toDestination();
    this.announceSynth.volume.value = -6;

    // === EFFECTS CHAIN ===

    // Warm Low-pass Filter
    this.filter = new Tone.Filter(this.state.filterFrequency, "lowpass", -24);

    // Massive Space Reverb
    this.reverb = new Tone.Reverb({
      decay: 12,
      wet: 0.4,
      preDelay: 0.05
    });
    await this.reverb.generate();

    // Stereo Delay
    this.delay = new Tone.PingPongDelay({
      delayTime: "8n.",
      feedback: 0.3,
      wet: 0.25
    });

    // Space Widening Chorus
    this.chorus = new Tone.Chorus({
      frequency: 0.3,
      delayTime: 4,
      depth: 0.4,
      wet: 0.3
    }).start();

    // Dynamics Control
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.05,
      release: 0.2
    });

    // Prevent Clipping
    this.limiter = new Tone.Limiter(-1);

    // Analysis
    this.analyzer = new Tone.Analyser('waveform', 512);

    // Master Volume
    this.masterVolume = new Tone.Volume(this.state.volume);

    // === ROUTING ===
    const destination = Tone.Destination;

    // Pads -> Chorus -> Filter -> Reverb -> Compressor -> Limiter -> Analyzer -> Master
    this.padSynth.chain(
      this.chorus,
      this.filter,
      this.reverb,
      this.compressor,
      this.limiter,
      this.analyzer,
      this.masterVolume,
      destination
    );

    // Arps -> Delay -> Reverb -> Compressor -> Master
    this.arpsSynth.chain(
      this.delay,
      this.reverb,
      this.compressor,
      this.limiter,
      this.analyzer,
      this.masterVolume,
      destination
    );

    // Bass -> Filter -> Compressor -> Master (less reverb for punch)
    this.bassSynth.chain(
      this.filter,
      this.compressor,
      this.limiter,
      this.analyzer,
      this.masterVolume,
      destination
    );

    // Shimmer -> Delay -> Reverb -> Master
    this.shimmerSynth.chain(
      this.delay,
      this.reverb,
      this.limiter,
      this.masterVolume,
      destination
    );

    // Set BPM
    Tone.Transport.bpm.value = this.state.bpm;

    this.createSequences();
    this.state.isInitialized = true;

    console.log('✅ Cosmic Radio AudioEngine ready!');
  }

  private createSequences(): void {
    let chordIndex = 0;
    let beatCount = 0;

    // === CHORD PROGRESSION (Every 2 measures) ===
    this.chordLoop = new Tone.Loop((time) => {
      const currentChord = DEEP_SPACE_CHORDS[chordIndex % DEEP_SPACE_CHORDS.length];
      this.padSynth?.triggerAttackRelease(currentChord, "2m", time);

      // Progress chord every 2nd iteration
      if (beatCount % 2 === 0) {
        chordIndex = (chordIndex + 1) % DEEP_SPACE_CHORDS.length;
      }
      beatCount++;
    }, "2m");

    // === MELODIC ARPEGGIO (Probabilistic, space-y) ===
    this.arpLoop = new Tone.Loop((time) => {
      // Only 30% chance to play - creates space
      if (Math.random() > 0.7) {
        const note = COSMIC_SCALE[Math.floor(Math.random() * COSMIC_SCALE.length)];
        const velocity = 0.3 + Math.random() * 0.4; // Dynamic velocity
        this.arpsSynth?.triggerAttackRelease(note, "8n", time, velocity);
      }
    }, "4n");

    // === BASS DRONE (Every 4 measures, very slow) ===
    this.bassLoop = new Tone.Loop((time) => {
      const bassNotes = ['A1', 'D1', 'E1', 'G1'];
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
    this.chordLoop?.start(0);
    this.arpLoop?.start("1m");
    this.bassLoop?.start(0);
    this.shimmerLoop?.start("2m");

    this.state.isPlaying = true;
    console.log('▶️ Cosmic Radio: Transmission started');
  }

  stop(): void {
    Tone.Transport.stop();
    this.chordLoop?.stop();
    this.arpLoop?.stop();
    this.bassLoop?.stop();
    this.shimmerLoop?.stop();
    this.state.isPlaying = false;

    // Release all hanging notes
    this.padSynth?.releaseAll();
    this.shimmerSynth?.releaseAll();
    this.speechSynth?.cancel();

    console.log('⏹️ Cosmic Radio: Transmission stopped');
  }

  updateParameters(params: AudioParameters): void {
    if (!this.state.isInitialized) return;

    // BPM from solar wind (slower for dramatic effect)
    if (params.bpm) {
      const targetBpm = Math.max(45, Math.min(120, 40 + params.bpm * 0.1));
      Tone.Transport.bpm.rampTo(targetBpm, 8);
    }

    // Filter modulation - solar density affects clarity
    if (params.filterFrequency) {
      const freq = Math.max(400, Math.min(3000, params.filterFrequency));
      this.filter?.frequency.rampTo(freq, 4);
    }

    // Geomagnetic chaos = more delay feedback & wider stereo
    if (params.distortion !== undefined) {
      const chaos = Math.min(0.9, params.distortion);
      if (this.delay) {
        this.delay.feedback.rampTo(0.2 + (chaos * 0.5), 2);
        this.delay.wet.rampTo(0.2 + (chaos * 0.4), 2);
      }
      if (this.chorus) {
        this.chorus.depth = 0.3 + (chaos * 0.7);
      }
    }
  }

  /**
   * Trigger distinct alert sounds
   */
  triggerAlert(severity: 'info' | 'warning' | 'danger' = 'info'): void {
    if (!this.alertSynth) return;

    const now = Tone.now();
    switch (severity) {
      case 'info':
        // Pleasant ascending chime
        this.alertSynth.triggerAttackRelease("C5", "16n", now, 0.6);
        this.alertSynth.triggerAttackRelease("E5", "16n", now + 0.08, 0.7);
        this.alertSynth.triggerAttackRelease("G5", "8n", now + 0.16, 0.8);
        break;
      case 'warning':
        // Urgent two-tone
        this.alertSynth.triggerAttackRelease(["E5", "A5"], "8n", now, 0.8);
        this.alertSynth.triggerAttackRelease(["E5", "A5"], "8n", now + 0.25, 0.9);
        this.alertSynth.triggerAttackRelease(["E5", "A5"], "8n", now + 0.5, 1);
        break;
      case 'danger':
        // Dramatic alarm - tritone for tension
        for (let i = 0; i < 4; i++) {
          this.alertSynth.triggerAttackRelease(["C5", "F#5"], "16n", now + i * 0.12, 1);
        }
        // Low rumble
        this.alertSynth.triggerAttackRelease(["C3", "G3"], "4n", now + 0.5, 0.5);
        break;
    }
  }

  /**
   * Pre-announcement signature chime (NASA-style)
   */
  private playAnnouncementChime(): void {
    if (!this.announceSynth) return;

    const now = Tone.now();
    // Ascending major chord - clear signal that voice is coming
    this.announceSynth.triggerAttackRelease("C5", "16n", now, 0.7);
    this.announceSynth.triggerAttackRelease("E5", "16n", now + 0.1, 0.8);
    this.announceSynth.triggerAttackRelease("G5", "16n", now + 0.2, 0.9);
    this.announceSynth.triggerAttackRelease("C6", "8n", now + 0.35, 1);
  }

  /**
   * Gentle music ducking - NOT too aggressive
   */
  private duckMusic(): void {
    if (this.masterVolume) {
      // Only reduce by -15dB (was -25dB) over 0.5s
      this.masterVolume.volume.rampTo(this.state.volume - 15, 0.5);
    }
  }

  /**
   * Restore music volume smoothly
   */
  private unduckMusic(): void {
    if (this.masterVolume) {
      this.masterVolume.volume.rampTo(this.state.volume, 1.5);
    }
    this.isSpeaking = false;
  }

  /**
   * Solar flare explosion effect - dramatic!
   */
  public createExplosion(): void {
    if (!this.state.isInitialized) return;

    const noise = new Tone.Noise('brown').start();  // Brown noise = deeper rumble
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
    filter.frequency.rampTo(50, 1);  // Sweep down for impact

    setTimeout(() => {
      noise.stop();
      noise.dispose();
      filter.dispose();
      envelope.dispose();
      explosionGain.dispose();
    }, 2000);
  }

  /**
   * Radio static/interference effect
   */
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

  /**
   * Main speech synthesis - with proper volume & cues
   */
  async speak(text: string): Promise<void> {
    if (!this.state.isInitialized || this.isSpeaking) return;
    this.isSpeaking = true;

    console.log('📢 Preparing announcement:', text.substring(0, 50) + '...');

    // 1. Play announcement chime
    this.playAnnouncementChime();

    // 2. Wait for chime, then duck music
    await new Promise(resolve => setTimeout(resolve, 600));
    this.duckMusic();

    // 3. Brief pause then speak
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

      // Much louder speech gain - goes DIRECTLY to destination
      const speechGain = new Tone.Gain(4.0);  // +12dB boost

      // Route speech DIRECT to destination (bypasses music effects)
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

  /**
   * Web Speech API fallback with optimal settings
   */
  private speakWithWebSpeech(text: string): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Web Speech API unavailable');
      this.unduckMusic();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;   // Slightly slower for clarity
    utterance.pitch = 0.95;  // Slightly deeper
    utterance.volume = 1.0;  // Maximum volume!

    utterance.onend = () => this.unduckMusic();
    utterance.onerror = () => this.unduckMusic();

    // Find good English voice
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
}

export const getAudioEngine = () => AudioEngine.getInstance();