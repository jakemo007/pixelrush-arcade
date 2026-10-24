/**
 * Fixed-capacity particle pool for purely cosmetic effects (sparks, trails).
 * Dead particles are reused, so the pool never grows past its capacity no
 * matter how long a run lasts.
 */

import type { Rng } from '@/lib/utils/random';

export interface Particle {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

export interface BurstOptions {
  x: number;
  y: number;
  count: number;
  color: string;
  speed: number;
  size?: number;
  life?: number;
  gravity?: number;
  /** Direction in radians and spread around it; defaults to a full circle. */
  angle?: number;
  spread?: number;
}

export class ParticlePool {
  readonly items: Particle[];
  private cursor = 0;

  constructor(
    readonly capacity: number,
    private readonly rng: Rng,
  ) {
    this.items = Array.from({ length: capacity }, () => ({
      alive: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 2,
      color: '#fff',
      gravity: 0,
    }));
  }

  private next(): Particle {
    // Prefer a dead slot; otherwise recycle the oldest one (ring buffer).
    for (let i = 0; i < this.capacity; i++) {
      const p = this.items[(this.cursor + i) % this.capacity]!;
      if (!p.alive) {
        this.cursor = (this.cursor + i + 1) % this.capacity;
        return p;
      }
    }
    const p = this.items[this.cursor]!;
    this.cursor = (this.cursor + 1) % this.capacity;
    return p;
  }

  burst(o: BurstOptions): void {
    const spread = o.spread ?? Math.PI * 2;
    const base = o.angle ?? 0;
    for (let i = 0; i < o.count; i++) {
      const p = this.next();
      const a = base + (this.rng() - 0.5) * spread;
      const s = o.speed * (0.35 + this.rng() * 0.65);
      p.alive = true;
      p.x = o.x;
      p.y = o.y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.maxLife = (o.life ?? 0.6) * (0.6 + this.rng() * 0.4);
      p.life = p.maxLife;
      p.size = (o.size ?? 3) * (0.6 + this.rng() * 0.6);
      p.color = o.color;
      p.gravity = o.gravity ?? 0;
    }
  }

  update(dt: number): void {
    for (const p of this.items) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  /** Shifts all live particles (used when a scrolling world moves under them). */
  offset(dx: number, dy: number): void {
    for (const p of this.items) {
      if (!p.alive) continue;
      p.x += dx;
      p.y += dy;
    }
  }

  get aliveCount(): number {
    let n = 0;
    for (const p of this.items) if (p.alive) n++;
    return n;
  }

  clear(): void {
    for (const p of this.items) p.alive = false;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, pool: ParticlePool): void {
  for (const p of pool.items) {
    if (!p.alive) continue;
    const t = p.life / p.maxLife;
    ctx.globalAlpha = t;
    ctx.fillStyle = p.color;
    const s = p.size * (0.5 + t * 0.5);
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}
