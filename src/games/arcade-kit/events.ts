import type { SoundCue } from '../engine/types';

const NO_CUES: SoundCue[] = [];
const NO_MESSAGES: string[] = [];

export class SimEvents {
  private cues: SoundCue[] = [];
  private messages: string[] = [];

  cue(cue: SoundCue): void {
    this.cues.push(cue);
  }

  say(message: string): void {
    this.messages.push(message);
  }

  drainCues(): SoundCue[] {
    if (this.cues.length === 0) return NO_CUES;
    const out = this.cues;
    this.cues = [];
    return out;
  }

  drainAnnouncements(): string[] {
    if (this.messages.length === 0) return NO_MESSAGES;
    const out = this.messages;
    this.messages = [];
    return out;
  }
}
