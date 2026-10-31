import { createSprite, drawBanner, drawSprite, FONT_STACK, neonLine, PALETTE, roundRectPath, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import { CELL, COLS, ROWS, SNAKE_HEIGHT, SNAKE_WIDTH, type Cell, type Direction, type SnakeSimulation } from './simulation';

const HEAD = [77, 255, 181] as const;
const TAIL = [26, 169, 201] as const;
const DEAD = '#ff4d6d';
const FOOD_SIZE = CELL - 8;

function mix(t: number): string {
  const c = (i: 0 | 1 | 2) => Math.round(HEAD[i] + (TAIL[i] - HEAD[i]) * t);
  return `rgb(${c(0)}, ${c(1)}, ${c(2)})`;
}

function makeBackground(): Sprite {
  return createSprite(SNAKE_WIDTH, SNAKE_HEIGHT, 0, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, SNAKE_HEIGHT);
    grad.addColorStop(0, '#0a0f26');
    grad.addColorStop(1, '#050816');
    g.fillStyle = grad;
    g.fillRect(0, 0, SNAKE_WIDTH, SNAKE_HEIGHT);
    g.fillStyle = 'rgba(77, 255, 181, 0.035)';
    for (let y = 0; y < ROWS; y++) {
      for (let x = (y % 2); x < COLS; x += 2) g.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
    g.strokeStyle = 'rgba(77, 255, 181, 0.06)';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= COLS; x++) {
      g.moveTo(x * CELL + 0.5, 0);
      g.lineTo(x * CELL + 0.5, SNAKE_HEIGHT);
    }
    for (let y = 0; y <= ROWS; y++) {
      g.moveTo(0, y * CELL + 0.5);
      g.lineTo(SNAKE_WIDTH, y * CELL + 0.5);
    }
    g.stroke();
  });
}

function makeFood(): Sprite {
  const r = FOOD_SIZE / 2;
  return createSprite(FOOD_SIZE, FOOD_SIZE, 10, (ctx) => {
    ctx.shadowColor = PALETTE.magenta;
    ctx.shadowBlur = 14;
    const g = ctx.createRadialGradient(r - 3, r - 3, 1, r, r, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, '#ff9be8');
    g.addColorStop(1, PALETTE.magenta);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r, r, r - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.green;
    ctx.beginPath();
    ctx.ellipse(r + 4, 2, 5, 2.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function makeHeadGlow(): Sprite {
  return createSprite(CELL, CELL, 12, (ctx) => {
    ctx.shadowColor = PALETTE.green;
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(77, 255, 181, 0.55)';
    roundRectPath(ctx, 3, 3, CELL - 6, CELL - 6, 9);
    ctx.fill();
  });
}

const EYE_OFFSETS: Record<Direction, [number, number, number, number]> = {
  right: [5, -6, 5, 6],
  left: [-5, -6, -5, 6],
  up: [-6, -5, 6, -5],
  down: [-6, 5, 6, 5],
};

export function createSnakeRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<SnakeSimulation> {
  const background = makeBackground();
  const food = makeFood();
  const headGlow = makeHeadGlow();

  const center = (c: Cell) => ({ x: (c.x + 0.5) * CELL, y: (c.y + 0.5) * CELL });

  function drawFood(sim: SnakeSimulation): void {
    if (!sim.food) return;
    const { x, y } = center(sim.food);
    const pulse = reducedMotion ? 1 : 1 + 0.08 * Math.sin(sim.time * 6);
    const size = FOOD_SIZE * pulse;
    drawSprite(ctx, food, x - size / 2, y - size / 2, size, size);
  }

  function drawSnake(sim: SnakeSimulation): void {
    const body = sim.snake;
    const n = body.length;
    const dead = sim.phase === 'dying';
    const flash = dead && !reducedMotion && sim.sinceEnd < 0.6 && Math.floor(sim.sinceEnd * 10) % 2 === 0;
    const inset = 3;
    const size = CELL - inset * 2;

    for (let i = n - 1; i >= 1; i--) {
      const a = body[i]!;
      const b = body[i - 1]!;
      const t = n > 1 ? i / (n - 1) : 0;
      ctx.fillStyle = dead ? (flash ? PALETTE.white : DEAD) : mix(t);
      const x = Math.min(a.x, b.x) * CELL + inset + 2;
      const y = Math.min(a.y, b.y) * CELL + inset + 2;
      const w = (Math.abs(a.x - b.x) + 1) * CELL - (inset + 2) * 2;
      const h = (Math.abs(a.y - b.y) + 1) * CELL - (inset + 2) * 2;
      ctx.fillRect(x, y, w, h);
    }

    for (let i = n - 1; i >= 0; i--) {
      const seg = body[i]!;
      const t = n > 1 ? i / (n - 1) : 0;
      ctx.fillStyle = dead ? (flash ? PALETTE.white : DEAD) : mix(t);
      const shrink = i === n - 1 && n > 2 ? 2 : 0;
      roundRectPath(ctx, seg.x * CELL + inset + shrink, seg.y * CELL + inset + shrink, size - shrink * 2, size - shrink * 2, 8);
      ctx.fill();
    }

    const head = body[0]!;
    if (!dead) drawSprite(ctx, headGlow, head.x * CELL, head.y * CELL);
    ctx.fillStyle = dead ? '#ffd6de' : '#c9fff0';
    roundRectPath(ctx, head.x * CELL + inset, head.y * CELL + inset, size, size, 8);
    ctx.fill();
    const c = center(head);
    const [x1, y1, x2, y2] = EYE_OFFSETS[sim.dir];
    ctx.fillStyle = '#04121c';
    if (dead) {
      ctx.strokeStyle = '#04121c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [ex, ey] of [
        [x1, y1],
        [x2, y2],
      ] as const) {
        ctx.moveTo(c.x + ex - 3, c.y + ey - 3);
        ctx.lineTo(c.x + ex + 3, c.y + ey + 3);
        ctx.moveTo(c.x + ex + 3, c.y + ey - 3);
        ctx.lineTo(c.x + ex - 3, c.y + ey + 3);
      }
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(c.x + x1, c.y + y1, 3, 0, Math.PI * 2);
      ctx.arc(c.x + x2, c.y + y2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCrash(sim: SnakeSimulation): void {
    const cell = sim.crashCell;
    if (sim.phase !== 'dying' || !cell) return;
    const cx = Math.min(COLS - 0.5, Math.max(0.5, cell.x + 0.5)) * CELL;
    const cy = Math.min(ROWS - 0.5, Math.max(0.5, cell.y + 0.5)) * CELL;
    const r = sim.deathCause === 'wall' ? CELL * 0.35 : CELL * 0.3;
    ctx.strokeStyle = DEAD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r);
    ctx.lineTo(cx + r, cy + r);
    ctx.moveTo(cx + r, cy - r);
    ctx.lineTo(cx - r, cy + r);
    ctx.stroke();
  }

  return {
    render(sim) {
      ctx.save();
      if (!reducedMotion && sim.phase === 'dying' && sim.sinceEnd < 0.3) {
        const m = (0.3 - sim.sinceEnd) * 18;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }
      drawSprite(ctx, background, 0, 0);
      const wall = sim.phase === 'dying' && sim.deathCause === 'wall' ? DEAD : PALETTE.green;
      neonLine(ctx, 1, 0, 1, SNAKE_HEIGHT, wall, 2);
      neonLine(ctx, SNAKE_WIDTH - 1, 0, SNAKE_WIDTH - 1, SNAKE_HEIGHT, wall, 2);
      neonLine(ctx, 0, 1, SNAKE_WIDTH, 1, wall, 2);
      neonLine(ctx, 0, SNAKE_HEIGHT - 1, SNAKE_WIDTH, SNAKE_HEIGHT - 1, wall, 2);

      drawFood(sim);
      drawSnake(sim);
      drawParticles(ctx, sim.particles);
      drawCrash(sim);

      if (sim.sinceLevelUp < 1.2 && sim.phase === 'playing') {
        ctx.globalAlpha = Math.min(1, (1.2 - sim.sinceLevelUp) * 2);
        ctx.fillStyle = PALETTE.yellow;
        ctx.font = `800 20px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`SPEED ${sim.level}`, SNAKE_WIDTH / 2, 14);
        ctx.globalAlpha = 1;
      }

      if (sim.outcome) {
      } else if (sim.phase === 'won') {
        drawBanner(ctx, 'Board filled!', `Length ${sim.length}`, SNAKE_WIDTH / 2, SNAKE_HEIGHT / 2, 1, PALETTE.yellow);
      } else if (sim.phase === 'dying' && sim.sinceEnd > 0.25) {
        const text = sim.deathCause === 'wall' ? 'Hit the wall' : 'Tail bitten';
        drawBanner(ctx, text, null, SNAKE_WIDTH / 2, SNAKE_HEIGHT / 2, Math.min(1, (sim.sinceEnd - 0.25) * 4), DEAD);
      }
      ctx.restore();
    },
  };
}
