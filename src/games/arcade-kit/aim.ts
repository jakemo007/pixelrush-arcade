import type { PointerSnapshot } from '../engine/types';

export interface DragAimOptions {
  maxDrag: number;
  minPower: number;
}

export type DragResult = 'idle' | 'aiming' | 'fire' | 'cancel';

export class DragAim {
  active = false;
  originX = 0;
  originY = 0;
  x = 0;
  y = 0;
  angle = 0;
  power = 0;

  constructor(private readonly options: DragAimOptions) {}

  update(p: Readonly<PointerSnapshot>, canStart: boolean): DragResult {
    if (p.pressed && canStart && !this.active) {
      this.active = true;
      this.originX = p.x;
      this.originY = p.y;
      this.power = 0;
    }
    if (!this.active) return 'idle';
    this.x = p.x;
    this.y = p.y;
    const dx = this.originX - p.x;
    const dy = this.originY - p.y;
    const len = Math.hypot(dx, dy);
    this.power = Math.min(1, len / this.options.maxDrag);
    if (len > 1e-6) this.angle = Math.atan2(dy, dx);
    if (p.released && !p.down) {
      this.active = false;
      return this.power >= this.options.minPower ? 'fire' : 'cancel';
    }
    return 'aiming';
  }

  cancel(): void {
    this.active = false;
    this.power = 0;
  }
}
