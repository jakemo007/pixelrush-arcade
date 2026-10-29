import type { SoundCue } from './types';

interface ToneSpec {
  wave?: OscillatorType;
  noise?: boolean;
  from: number;
  to: number;
  duration: number;
  volume: number;
  delay?: number;
}

const CUES: Record<SoundCue, readonly ToneSpec[]> = {
  jump: [{ wave: 'square', from: 300, to: 620, duration: 0.11, volume: 0.06 }],
  land: [{ wave: 'triangle', from: 150, to: 80, duration: 0.07, volume: 0.07 }],
  collect: [
    { wave: 'sine', from: 988, to: 1318, duration: 0.08, volume: 0.09 },
    { wave: 'sine', from: 1318, to: 1760, duration: 0.1, volume: 0.07, delay: 0.06 },
  ],
  hit: [
    { noise: true, from: 0, to: 0, duration: 0.28, volume: 0.16 },
    { wave: 'sawtooth', from: 240, to: 50, duration: 0.35, volume: 0.08 },
  ],
  explode: [
    { noise: true, from: 0, to: 0, duration: 0.2, volume: 0.09 },
    { wave: 'square', from: 180, to: 40, duration: 0.18, volume: 0.04 },
  ],
  bounce: [{ wave: 'square', from: 440, to: 440, duration: 0.05, volume: 0.05 }],
  brick: [{ wave: 'square', from: 660, to: 880, duration: 0.06, volume: 0.05 }],
  brickHit: [{ wave: 'triangle', from: 520, to: 520, duration: 0.05, volume: 0.06 }],
  steel: [{ wave: 'triangle', from: 1200, to: 900, duration: 0.07, volume: 0.04 }],
  powerup: [{ wave: 'sine', from: 523, to: 1046, duration: 0.25, volume: 0.09 }],
  shoot: [{ wave: 'square', from: 900, to: 520, duration: 0.035, volume: 0.018 }],
  launch: [{ wave: 'triangle', from: 300, to: 600, duration: 0.1, volume: 0.07 }],
  levelUp: [
    { wave: 'square', from: 523, to: 523, duration: 0.1, volume: 0.06 },
    { wave: 'square', from: 659, to: 659, duration: 0.1, volume: 0.06, delay: 0.1 },
    { wave: 'square', from: 784, to: 784, duration: 0.16, volume: 0.06, delay: 0.2 },
  ],
  lifeLost: [{ wave: 'sawtooth', from: 400, to: 120, duration: 0.4, volume: 0.07 }],
  milestone: [
    { wave: 'sine', from: 784, to: 784, duration: 0.08, volume: 0.06 },
    { wave: 'sine', from: 1046, to: 1046, duration: 0.12, volume: 0.06, delay: 0.08 },
  ],
  gameOver: [
    { wave: 'triangle', from: 392, to: 392, duration: 0.16, volume: 0.08 },
    { wave: 'triangle', from: 330, to: 330, duration: 0.16, volume: 0.08, delay: 0.17 },
    { wave: 'triangle', from: 262, to: 200, duration: 0.4, volume: 0.08, delay: 0.34 },
  ],
  win: [
    { wave: 'square', from: 523, to: 523, duration: 0.12, volume: 0.06 },
    { wave: 'square', from: 659, to: 659, duration: 0.12, volume: 0.06, delay: 0.12 },
    { wave: 'square', from: 784, to: 784, duration: 0.12, volume: 0.06, delay: 0.24 },
    { wave: 'square', from: 1046, to: 1046, duration: 0.35, volume: 0.06, delay: 0.36 },
  ],
  select: [{ wave: 'triangle', from: 740, to: 740, duration: 0.04, volume: 0.05 }],
  place: [{ wave: 'triangle', from: 320, to: 240, duration: 0.06, volume: 0.07 }],
  invalid: [{ wave: 'square', from: 180, to: 150, duration: 0.12, volume: 0.04 }],
  match: [
    { wave: 'sine', from: 660, to: 660, duration: 0.07, volume: 0.07 },
    { wave: 'sine', from: 990, to: 990, duration: 0.1, volume: 0.07, delay: 0.06 },
  ],
  flip: [{ noise: true, from: 0, to: 0, duration: 0.05, volume: 0.05 }],
  pop: [{ wave: 'sine', from: 900, to: 300, duration: 0.07, volume: 0.07 }],
  swish: [
    { noise: true, from: 0, to: 0, duration: 0.18, volume: 0.07 },
    { wave: 'sine', from: 880, to: 1320, duration: 0.15, volume: 0.05, delay: 0.05 },
  ],
  tick: [{ wave: 'square', from: 1200, to: 1200, duration: 0.025, volume: 0.03 }],
  crash: [
    { noise: true, from: 0, to: 0, duration: 0.22, volume: 0.12 },
    { wave: 'sawtooth', from: 160, to: 60, duration: 0.2, volume: 0.06 },
  ],
  putt: [{ wave: 'triangle', from: 520, to: 380, duration: 0.05, volume: 0.08 }],
};

const MIN_GAP: Partial<Record<SoundCue, number>> = { shoot: 0.07, brick: 0.03, bounce: 0.03, explode: 0.05, pop: 0.03, tick: 0.05 };
const MASTER_VOLUME = 0.8;

type AudioContextCtor = typeof AudioContext;

export class SoundBoard {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private readonly lastPlayed = new Map<SoundCue, number>();

  constructor(private muted: boolean) {}

  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        return;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.ctx && this.master) {
      this.master.gain.setValueAtTime(muted ? 0 : MASTER_VOLUME, this.ctx.currentTime);
    }
  }

  play(cue: SoundCue): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const last = this.lastPlayed.get(cue) ?? -Infinity;
    if (now - last < (MIN_GAP[cue] ?? 0.02)) return;
    this.lastPlayed.set(cue, now);
    for (const spec of CUES[cue]) this.tone(ctx, this.master, spec, now + (spec.delay ?? 0));
  }

  private getNoise(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const length = Math.floor(ctx.sampleRate * 0.5);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  private tone(ctx: AudioContext, master: GainNode, spec: ToneSpec, at: number): void {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(spec.volume, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + spec.duration);
    gain.connect(master);

    let source: AudioScheduledSourceNode;
    if (spec.noise) {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoise(ctx);
      source = src;
    } else {
      const osc = ctx.createOscillator();
      osc.type = spec.wave ?? 'square';
      osc.frequency.setValueAtTime(spec.from, at);
      if (spec.to !== spec.from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, spec.to), at + spec.duration);
      source = osc;
    }
    source.connect(gain);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start(at);
    source.stop(at + spec.duration + 0.02);
  }

  destroy(): void {
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    if (ctx) ctx.close().catch(() => undefined);
  }
}
