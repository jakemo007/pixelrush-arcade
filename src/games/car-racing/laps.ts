import { segmentCrossing } from '../arcade-kit/geometry';
import type { Track } from './track';

export type GateEvent = 'gate' | 'lap' | 'back' | null;

export interface CrossResult {
  event: GateEvent;
  t: number;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export class LapTracker {
  progress = -1;
  lapsDone = 0;

  constructor(private readonly track: Track) {}

  get gateCount(): number {
    return this.track.gates.length;
  }

  get nextGate(): number {
    return mod(this.progress + 1, this.gateCount);
  }

  update(x0: number, y0: number, x1: number, y1: number): CrossResult {
    const n = this.gateCount;
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (dx === 0 && dy === 0) return { event: null, t: 0 };

    const next = this.track.gates[mod(this.progress + 1, n)]!;
    const tNext = segmentCrossing(x0, y0, x1, y1, next.ax, next.ay, next.bx, next.by);
    if (tNext >= 0 && dx * this.track.tx[next.index]! + dy * this.track.ty[next.index]! > 0) {
      this.progress++;
      if (this.progress >= n * (this.lapsDone + 1)) {
        this.lapsDone++;
        return { event: 'lap', t: tNext };
      }
      return { event: 'gate', t: tNext };
    }

    const last = this.track.gates[mod(this.progress, n)]!;
    const tLast = segmentCrossing(x0, y0, x1, y1, last.ax, last.ay, last.bx, last.by);
    if (tLast >= 0 && dx * this.track.tx[last.index]! + dy * this.track.ty[last.index]! < 0) {
      this.progress--;
      return { event: 'back', t: tLast };
    }
    return { event: null, t: 0 };
  }
}
