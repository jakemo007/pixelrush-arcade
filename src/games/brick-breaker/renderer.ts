import { createSprite, drawBanner, drawSprite, FONT_STACK, neonLine, PALETTE, roundRectPath, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import {
  BALL_R,
  BB_HEIGHT,
  BB_WIDTH,
  BRICK_H,
  BRICK_W,
  LEVELS,
  PADDLE_H,
  PADDLE_Y,
  type BrickBreakerSimulation,
  type CapsuleKind,
} from './simulation';

const HP_COLORS: Record<number, [string, string]> = {
  1: ['#7af3ff', '#1aa9c9'],
  2: ['#c9b6ff', '#7b55e0'],
  3: ['#ff9be8', '#c2189a'],
};

function makeBrick(top: string, bottom: string, glow: string, steel = false): Sprite {
  return createSprite(BRICK_W, BRICK_H, 8, (ctx) => {
    ctx.shadowColor = glow;
    ctx.shadowBlur = steel ? 4 : 10;
    const g = ctx.createLinearGradient(0, 0, 0, BRICK_H);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    roundRectPath(ctx, 0, 0, BRICK_W, BRICK_H, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(4, 3, BRICK_W - 8, 3);
    if (steel) {
      ctx.strokeStyle = 'rgba(7, 10, 24, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, BRICK_H - 4);
      ctx.lineTo(16, 4);
      ctx.moveTo(30, BRICK_H - 4);
      ctx.lineTo(38, 4);
      ctx.stroke();
    }
  });
}

function makeBall(): Sprite {
  const d = BALL_R * 2;
  return createSprite(d, d, 10, (ctx) => {
    ctx.shadowColor = PALETTE.white;
    ctx.shadowBlur = 12;
    const g = ctx.createRadialGradient(BALL_R - 2, BALL_R - 2, 1, BALL_R, BALL_R, BALL_R);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#9fe9ff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(BALL_R, BALL_R, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  });
}

const CAPSULE_STYLE: Record<CapsuleKind, { color: string; label: string }> = {
  wide: { color: PALETTE.cyan, label: 'W' },
  slow: { color: PALETTE.yellow, label: 'S' },
  life: { color: PALETTE.green, label: '+' },
};

export function createBrickBreakerRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<BrickBreakerSimulation> {
  const bricksByHp = new Map<number, Sprite>(
    Object.entries(HP_COLORS).map(([hp, [top, bottom]]) => [Number(hp), makeBrick(top, bottom, top)]),
  );
  const steel = makeBrick('#8d9bc4', '#4b567d', '#8d9bc4', true);
  const flashBrick = makeBrick('#ffffff', '#dfe6ff', '#ffffff');
  const ball = makeBall();

  const background = createSprite(BB_WIDTH, BB_HEIGHT, 0, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, BB_HEIGHT);
    grad.addColorStop(0, '#0b0e2b');
    grad.addColorStop(1, '#05060f');
    g.fillStyle = grad;
    g.fillRect(0, 0, BB_WIDTH, BB_HEIGHT);
    g.strokeStyle = 'rgba(167, 139, 250, 0.07)';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= BB_WIDTH; x += 36) {
      g.moveTo(x, 0);
      g.lineTo(x, BB_HEIGHT);
    }
    for (let y = 0; y <= BB_HEIGHT; y += 36) {
      g.moveTo(0, y);
      g.lineTo(BB_WIDTH, y);
    }
    g.stroke();
  });

  return {
    render(sim) {
      ctx.save();
      if (!reducedMotion && sim.shake > 0) {
        const m = sim.shake * 6;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }
      drawSprite(ctx, background, 0, 0);
      neonLine(ctx, 1, 0, 1, BB_HEIGHT, PALETTE.violet, 2);
      neonLine(ctx, BB_WIDTH - 1, 0, BB_WIDTH - 1, BB_HEIGHT, PALETTE.violet, 2);
      neonLine(ctx, 0, 1, BB_WIDTH, 1, PALETTE.violet, 2);

      for (const brick of sim.bricks) {
        if (!brick.alive) continue;
        const sprite = brick.flash > 0.5 ? flashBrick : brick.steel ? steel : bricksByHp.get(brick.hp) ?? bricksByHp.get(1)!;
        drawSprite(ctx, sprite, brick.x, brick.y);
        if (!brick.steel && brick.hp < brick.maxHp) {
          ctx.strokeStyle = 'rgba(7, 10, 24, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(brick.x + 14, brick.y + 3);
          ctx.lineTo(brick.x + 20, brick.y + 11);
          ctx.lineTo(brick.x + 16, brick.y + brick.h - 3);
          ctx.moveTo(brick.x + 34, brick.y + 4);
          ctx.lineTo(brick.x + 29, brick.y + 12);
          ctx.stroke();
        }
      }

      for (const c of sim.capsules) {
        const style = CAPSULE_STYLE[c.kind];
        ctx.fillStyle = 'rgba(7, 10, 24, 0.9)';
        roundRectPath(ctx, c.x, c.y, 34, 14, 7);
        ctx.fill();
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = style.color;
        ctx.font = `800 11px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(style.label, c.x + 17, c.y + 7.5);
      }

      const paddleColor = sim.wideTimer > 0 ? PALETTE.cyan : PALETTE.magenta;
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = paddleColor;
      roundRectPath(ctx, sim.paddleX - 4, PADDLE_Y - 4, sim.paddleW + 8, PADDLE_H + 8, 10);
      ctx.fill();
      ctx.globalAlpha = 1;
      const pg = ctx.createLinearGradient(0, PADDLE_Y, 0, PADDLE_Y + PADDLE_H);
      pg.addColorStop(0, '#ffffff');
      pg.addColorStop(1, paddleColor);
      ctx.fillStyle = pg;
      roundRectPath(ctx, sim.paddleX, PADDLE_Y, sim.paddleW, PADDLE_H, 7);
      ctx.fill();

      if (sim.phase !== 'ending' || sim.won) {
        drawSprite(ctx, ball, sim.ball.x - BALL_R, sim.ball.y - BALL_R);
      }
      drawParticles(ctx, sim.particles);

      if (sim.slowTimer > 0 || sim.wideTimer > 0) {
        ctx.font = `700 13px ${FONT_STACK}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let y = 12;
        if (sim.wideTimer > 0) {
          ctx.fillStyle = PALETTE.cyan;
          ctx.fillText(`WIDE ${Math.ceil(sim.wideTimer)}s`, 12, y);
          y += 18;
        }
        if (sim.slowTimer > 0) {
          ctx.fillStyle = PALETTE.yellow;
          ctx.fillText(`SLOW ${Math.ceil(sim.slowTimer)}s`, 12, y);
        }
      }

      const cx = BB_WIDTH / 2;
      if (sim.phase === 'serve') {
        if (sim.phaseTime < 1.6) {
          drawBanner(ctx, `Level ${sim.level}`, sim.levelName, cx, 380, 1.6 - sim.phaseTime, PALETTE.violet);
        }
        const pulse = reducedMotion ? 1 : 0.6 + 0.4 * Math.sin(sim.phaseTime * 4);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = PALETTE.white;
        ctx.font = `600 16px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Press Space or tap to launch', cx, PADDLE_Y - 46);
        ctx.globalAlpha = 1;
      } else if (sim.phase === 'cleared') {
        drawBanner(ctx, `Level ${sim.level} cleared!`, `Next: ${LEVELS[sim.level]?.name ?? ''}`, cx, 380, 1, PALETTE.cyan);
      } else if (sim.phase === 'ending' && sim.won) {
        drawBanner(ctx, 'All levels cleared!', 'Victory', cx, 380, 1, PALETTE.yellow);
      }
      ctx.restore();
    },
  };
}
