import { createSprite, drawSprite, neonLine, PALETTE, roundRectPath, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import { createRng } from '@/lib/utils/random';
import { GROUND_Y, ND_HEIGHT, ND_WIDTH, PLAYER_SIZE, PLAYER_X, type NeonDashSimulation, type Obstacle } from './simulation';

const SKYLINE_WIDTH = 1920;

function makeSky(): Sprite {
  return createSprite(ND_WIDTH, ND_HEIGHT, 0, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, '#05061a');
    g.addColorStop(0.55, '#1a0b3d');
    g.addColorStop(1, '#3a0f4f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ND_WIDTH, GROUND_Y);

    const rng = createRng(7);
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.25 + rng() * 0.6;
      ctx.fillStyle = rng() < 0.2 ? PALETTE.cyan : PALETTE.white;
      const s = rng() < 0.85 ? 1.5 : 2.5;
      ctx.fillRect(rng() * ND_WIDTH, rng() * (GROUND_Y - 140), s, s);
    }
    ctx.globalAlpha = 1;

    const cx = ND_WIDTH * 0.68;
    const cy = GROUND_Y - 70;
    const r = 120;
    const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    sun.addColorStop(0, '#ffd23f');
    sun.addColorStop(0.5, '#ff6fb1');
    sun.addColorStop(1, '#a14bff');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = sun;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = '#1a0b3d';
    for (let i = 0; i < 7; i++) {
      const y = cy + 6 + i * 16;
      ctx.fillRect(cx - r, y, r * 2, 3 + i * 1.4);
    }
    ctx.restore();
  });
}

function makeSkyline(seed: number, minH: number, maxH: number, body: string, windows: string, windowChance: number): Sprite {
  return createSprite(SKYLINE_WIDTH, GROUND_Y, 0, (ctx) => {
    const rng = createRng(seed);
    let x = 0;
    while (x < SKYLINE_WIDTH) {
      const w = 40 + rng() * 90;
      const h = minH + rng() * (maxH - minH);
      const top = GROUND_Y - h;
      ctx.fillStyle = body;
      ctx.fillRect(x, top, w, h);
      if (rng() < 0.3) ctx.fillRect(x + w * 0.4, top - 18, 3, 18);
      ctx.fillStyle = windows;
      for (let wy = top + 10; wy < GROUND_Y - 8; wy += 14) {
        for (let wx = x + 6; wx < x + w - 8; wx += 12) {
          if (rng() < windowChance) ctx.fillRect(wx, wy, 5, 6);
        }
      }
      x += w + 4 + rng() * 14;
    }
  });
}

function makePlayer(): Sprite {
  return createSprite(PLAYER_SIZE, PLAYER_SIZE, 12, (ctx) => {
    ctx.shadowColor = PALETTE.cyan;
    ctx.shadowBlur = 14;
    const g = ctx.createLinearGradient(0, 0, PLAYER_SIZE, PLAYER_SIZE);
    g.addColorStop(0, '#9ff6ff');
    g.addColorStop(1, '#18b4d8');
    ctx.fillStyle = g;
    roundRectPath(ctx, 0, 0, PLAYER_SIZE, PLAYER_SIZE, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#071226';
    roundRectPath(ctx, 14, 9, 17, 9, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.magenta;
    ctx.fillRect(25, 11, 4, 4);
  });
}

function makeSpikes(count: number): Sprite {
  const w = 30 * count;
  return createSprite(w, 32, 10, (ctx) => {
    ctx.shadowColor = PALETTE.magenta;
    ctx.shadowBlur = 12;
    for (let i = 0; i < count; i++) {
      const x = i * 30;
      const g = ctx.createLinearGradient(0, 0, 0, 32);
      g.addColorStop(0, '#ff9be8');
      g.addColorStop(1, '#c2189a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x + 15, 0);
      ctx.lineTo(x + 30, 32);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function makeBlock(h: number): Sprite {
  return createSprite(44, h, 10, (ctx) => {
    ctx.shadowColor = PALETTE.violet;
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#2a1760';
    roundRectPath(ctx, 0, 0, 44, h, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = PALETTE.violet;
    ctx.lineWidth = 2;
    roundRectPath(ctx, 1, 1, 42, h - 2, 4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
    for (let y = 14; y < h - 6; y += 14) {
      ctx.beginPath();
      ctx.moveTo(6, y);
      ctx.lineTo(38, y);
      ctx.stroke();
    }
  });
}

function makeDrone(): Sprite {
  return createSprite(46, 30, 12, (ctx) => {
    ctx.shadowColor = PALETTE.orange;
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#3a1a08';
    ctx.beginPath();
    ctx.moveTo(23, 0);
    ctx.lineTo(46, 15);
    ctx.lineTo(23, 30);
    ctx.lineTo(0, 15);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = PALETTE.orange;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = PALETTE.orange;
    ctx.fillRect(4, 13, 38, 4);
  });
}

function makeShard(): Sprite {
  return createSprite(20, 26, 10, (ctx) => {
    ctx.shadowColor = PALETTE.yellow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = PALETTE.yellow;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(20, 13);
    ctx.lineTo(10, 26);
    ctx.lineTo(0, 13);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff6c7';
    ctx.fillRect(8, 7, 4, 8);
  });
}

export function createNeonDashRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<NeonDashSimulation> {
  const sky = makeSky();
  const far = makeSkyline(11, 60, 170, '#160b33', 'rgba(56, 232, 255, 0.35)', 0.18);
  const near = makeSkyline(23, 40, 120, '#0e0826', 'rgba(255, 79, 216, 0.45)', 0.12);
  const player = makePlayer();
  const spikes = [makeSpikes(1), makeSpikes(2), makeSpikes(3)];
  const blocks = new Map<number, Sprite>([56, 72, 88].map((h) => [h, makeBlock(h)]));
  const drone = makeDrone();
  const shard = makeShard();
  const floor = ctx.createLinearGradient(0, GROUND_Y, 0, ND_HEIGHT);
  floor.addColorStop(0, '#1b0a3a');
  floor.addColorStop(1, '#05030f');
  const trail: number[] = [];

  function drawSkyline(sprite: Sprite, offset: number): void {
    const x = -(offset % SKYLINE_WIDTH);
    drawSprite(ctx, sprite, x, 0);
    drawSprite(ctx, sprite, x + SKYLINE_WIDTH, 0);
  }

  function drawFloor(sim: NeonDashSimulation): void {
    ctx.fillStyle = floor;
    ctx.fillRect(0, GROUND_Y, ND_WIDTH, ND_HEIGHT - GROUND_Y);

    ctx.strokeStyle = 'rgba(255, 79, 216, 0.28)';
    ctx.lineWidth = 1;
    const spacing = 80;
    const shift = sim.scroll % spacing;
    ctx.beginPath();
    for (let i = -6; i < 20; i++) {
      const x = i * spacing - shift;
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x + (x - ND_WIDTH / 2) * 1.4, ND_HEIGHT);
    }
    for (const y of [GROUND_Y + 14, GROUND_Y + 34, GROUND_Y + 62, GROUND_Y + 98]) {
      ctx.moveTo(0, y);
      ctx.lineTo(ND_WIDTH, y);
    }
    ctx.stroke();

    let segmentStart = 0;
    for (const o of sim.obstacles) {
      if (o.kind !== 'pit') continue;
      const x = o.x - sim.scroll;
      if (x > ND_WIDTH || x + o.w < 0) continue;
      ctx.fillStyle = '#020108';
      ctx.fillRect(x, GROUND_Y - 1, o.w, ND_HEIGHT - GROUND_Y + 1);
      ctx.fillStyle = 'rgba(255, 79, 216, 0.5)';
      ctx.fillRect(x, GROUND_Y, 3, ND_HEIGHT - GROUND_Y);
      ctx.fillRect(x + o.w - 3, GROUND_Y, 3, ND_HEIGHT - GROUND_Y);
      if (x > segmentStart) neonLine(ctx, segmentStart, GROUND_Y, x, GROUND_Y, PALETTE.cyan, 2);
      segmentStart = x + o.w;
    }
    if (segmentStart < ND_WIDTH) neonLine(ctx, segmentStart, GROUND_Y, ND_WIDTH, GROUND_Y, PALETTE.cyan, 2);
  }

  function drawObstacle(sim: NeonDashSimulation, o: Obstacle): void {
    const x = o.x - sim.scroll;
    if (x > ND_WIDTH + 20 || x + o.w < -20) return;
    if (o.kind === 'spike') {
      drawSprite(ctx, spikes[o.count - 1] ?? spikes[0]!, x, GROUND_Y - o.h);
    } else if (o.kind === 'block') {
      const sprite = blocks.get(o.h);
      if (sprite) drawSprite(ctx, sprite, x, GROUND_Y - o.h);
    } else if (o.kind === 'drone') {
      const top = sim.droneTop(o);
      drawSprite(ctx, drone, x, top);
      if (Math.sin(sim.time * 10 + o.phase) > 0) {
        ctx.fillStyle = PALETTE.red;
        ctx.fillRect(x + 21, top + 26, 4, 4);
      }
    }
  }

  return {
    render(sim) {
      ctx.save();
      if (!reducedMotion && sim.shake > 0) {
        const m = sim.shake * 8;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }

      drawSprite(ctx, sky, 0, 0);
      drawSkyline(far, sim.scroll * 0.08);
      drawSkyline(near, sim.scroll * 0.22);
      drawFloor(sim);

      for (const o of sim.obstacles) drawObstacle(sim, o);

      for (const s of sim.shards) {
        if (s.taken) continue;
        const x = s.x - sim.scroll;
        if (x < -30 || x > ND_WIDTH + 30) continue;
        const spin = Math.abs(Math.cos(sim.time * 3 + s.phase));
        const w = 20 * Math.max(0.25, spin);
        drawSprite(ctx, shard, x - w / 2, s.y - 13 + Math.sin(sim.time * 4 + s.phase) * 3, w, 26);
      }

      if (!sim.dying) {
        trail.unshift(sim.playerY);
        if (trail.length > 6) trail.length = 6;
      }
      if (!sim.dying || sim.fell) {
        for (let i = trail.length - 1; i >= 1; i--) {
          ctx.globalAlpha = 0.12 * (1 - i / trail.length);
          ctx.fillStyle = PALETTE.cyan;
          ctx.fillRect(PLAYER_X - i * 9, (trail[i] ?? sim.playerY) + 4, PLAYER_SIZE - 6, PLAYER_SIZE - 8);
        }
        ctx.globalAlpha = 1;

        const stretch = sim.onGround ? 1 + sim.squash * 0.18 : 1 - Math.min(0.12, Math.abs(sim.vy) / 9000);
        const w = PLAYER_SIZE * stretch;
        const h = PLAYER_SIZE / stretch;
        const tilt = sim.onGround ? 0 : Math.max(-0.35, Math.min(0.35, sim.vy / 2600));
        ctx.save();
        ctx.translate(PLAYER_X + PLAYER_SIZE / 2, sim.playerY + PLAYER_SIZE - h / 2);
        ctx.rotate(tilt);
        drawSprite(ctx, player, -w / 2, -h / 2, w, h);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(-sim.scroll, 0);
      drawParticles(ctx, sim.particles);
      ctx.restore();

      if (!reducedMotion && sim.speed > 600 && !sim.dying) {
        ctx.fillStyle = 'rgba(238, 242, 255, 0.18)';
        const rng = createRng(Math.floor(sim.time * 20));
        for (let i = 0; i < 6; i++) ctx.fillRect(rng() * ND_WIDTH, rng() * GROUND_Y, 40 + rng() * 60, 1.5);
      }

      if (sim.flash > 0) {
        ctx.globalAlpha = (reducedMotion ? 0.25 : 0.55) * sim.flash;
        ctx.fillStyle = sim.dying ? PALETTE.red : PALETTE.yellow;
        ctx.fillRect(0, 0, ND_WIDTH, ND_HEIGHT);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
  };
}
