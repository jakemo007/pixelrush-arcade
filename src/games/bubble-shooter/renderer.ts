import { createSprite, drawBanner, drawSprite, neonLine, PALETTE, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import { createBackdrop, dottedPath, paintBubble, text } from '../arcade-kit/draw';
import { TOKENS, tokenStyle, type TokenStyle } from '../arcade-kit/tokens';
import { BS_HEIGHT, BS_WIDTH, BubbleGrid, COLS, DANGER_Y, EMPTY, RADIUS, ROW_H, TOP } from './grid';
import { CLEAR_BONUS, SHOOTER_X, SHOOTER_Y, SWAP_R, SWAP_X, SWAP_Y, type BubbleShooterSimulation } from './simulation';

const GREY: TokenStyle = { name: 'grey', shape: 'circle', color: '#5b6388', light: '#9aa3c7', dark: '#2a3050' };

function bubbleSprite(style: TokenStyle, r: number): Sprite {
  return createSprite(r * 2, r * 2, 8, (ctx) => paintBubble(ctx, style, r, r, r - 0.5));
}

export function createBubbleShooterRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<BubbleShooterSimulation> {
  const background = createBackdrop(BS_WIDTH, BS_HEIGHT, { step: 40 });
  const bubbles = TOKENS.map((t) => bubbleSprite(t, RADIUS));
  const grey = bubbleSprite(GREY, RADIUS);

  const drawBubble = (color: number, x: number, y: number, scale = 1) => {
    const sprite = bubbles[color] ?? bubbles[0]!;
    const r = RADIUS * scale;
    drawSprite(ctx, sprite, x - r, y - r, r * 2, r * 2);
  };

  return {
    render(sim) {
      const t = sim.time;
      drawSprite(ctx, background, 0, 0);

      neonLine(ctx, 0, TOP - 1, BS_WIDTH, TOP - 1, PALETTE.violet, 2);
      neonLine(ctx, 1, TOP, 1, DANGER_Y + 40, PALETTE.violet, 1.5);
      neonLine(ctx, BS_WIDTH - 1, TOP, BS_WIDTH - 1, DANGER_Y + 40, PALETTE.violet, 1.5);

      const danger = sim.inDanger || sim.phase === 'ending';
      const pulse = danger && !reducedMotion ? 0.55 + 0.45 * Math.abs(Math.sin(t * 4)) : danger ? 1 : 0.45;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(0, DANGER_Y);
      ctx.lineTo(BS_WIDTH, DANGER_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      if (danger) text(ctx, 'DANGER LINE', BS_WIDTH - 10, DANGER_Y + 12, 11, PALETTE.red, 'right', 800);

      const slide = sim.pushAnim * ROW_H;
      const ending = sim.phase === 'ending';
      const grid = sim.grid;
      for (let r = 0; r < grid.rows.length; r++) {
        const row = grid.rows[r]!;
        const y = BubbleGrid.cellY(r) - slide;
        for (let c = 0; c < COLS; c++) {
          const color = row[c]!;
          if (color === EMPTY) continue;
          const x = grid.cellX(r, c);
          if (ending) {
            const fade = Math.min(1, sim.phaseTime / 0.8);
            drawBubble(color, x, y);
            ctx.globalAlpha = fade;
            drawSprite(ctx, grey, x - RADIUS, y - RADIUS);
            ctx.globalAlpha = 1;
          } else {
            drawBubble(color, x, y);
          }
        }
      }

      for (const e of sim.effects) {
        if (e.kind === 'pop') {
          const k = e.t / 0.22;
          ctx.globalAlpha = Math.max(0, 1 - k);
          drawBubble(e.color, e.x, e.y, reducedMotion ? 1 : 1 + k * 0.5);
        } else {
          ctx.globalAlpha = 0.9;
          drawBubble(e.color, e.x, e.y);
        }
      }
      ctx.globalAlpha = 1;

      if (sim.phase === 'aim' && sim.previewCount > 0) {
        dottedPath(ctx, sim.previewX, sim.previewY, sim.previewCount, tokenStyle(sim.loaded).color, 3);
      }

      if (sim.flying) drawBubble(sim.flying.color, sim.flying.x, sim.flying.y);
      drawParticles(ctx, sim.particles);

      ctx.fillStyle = 'rgba(7, 10, 24, 0.55)';
      ctx.fillRect(0, DANGER_Y + 30, BS_WIDTH, BS_HEIGHT - DANGER_Y - 30);
      neonLine(ctx, 0, DANGER_Y + 30, BS_WIDTH, DANGER_Y + 30, 'rgba(167, 139, 250, 0.5)', 1);

      ctx.save();
      ctx.translate(SHOOTER_X, SHOOTER_Y);
      ctx.rotate(sim.angle);
      ctx.fillStyle = '#1b2148';
      ctx.fillRect(0, -9, 50, 18);
      ctx.strokeStyle = PALETTE.cyan;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -9, 50, 18);
      ctx.restore();
      ctx.fillStyle = '#121638';
      ctx.beginPath();
      ctx.arc(SHOOTER_X, SHOOTER_Y, 27, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.cyan;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (sim.phase !== 'flying' && sim.phase !== 'ending') drawBubble(sim.loaded, SHOOTER_X, SHOOTER_Y);

      ctx.strokeStyle = 'rgba(56, 232, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(SWAP_X, SWAP_Y - 6, 24, -Math.PI * 0.85, Math.PI * 0.55);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 232, 255, 0.55)';
      const ax = SWAP_X + Math.cos(Math.PI * 0.55) * 24;
      const ay = SWAP_Y - 6 + Math.sin(Math.PI * 0.55) * 24;
      ctx.beginPath();
      ctx.moveTo(ax - 6, ay - 2);
      ctx.lineTo(ax + 3, ay + 5);
      ctx.lineTo(ax + 4, ay - 6);
      ctx.fill();
      drawBubble(sim.next, SWAP_X, SWAP_Y - 6, 0.8);
      text(ctx, 'NEXT · SWAP', SWAP_X, SWAP_Y + SWAP_R - 8, 10, PALETTE.dim, 'center', 800);

      const total = sim.config.pushEvery;
      const left = sim.shotsUntilPush;
      const rx = 376;
      text(ctx, `NEW ROW IN ${left}`, rx, SWAP_Y - 18, 11, left <= 1 ? PALETTE.red : PALETTE.dim, 'center', 800);
      const spacing = 14;
      for (let i = 0; i < total; i++) {
        const x = rx - ((total - 1) * spacing) / 2 + i * spacing;
        ctx.beginPath();
        ctx.arc(x, SWAP_Y + 4, 4.5, 0, Math.PI * 2);
        if (i < total - left) {
          ctx.fillStyle = PALETTE.red;
          ctx.fill();
        } else {
          ctx.strokeStyle = PALETTE.dim;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      const since = t - sim.lastGainTime;
      if (since < 0.9 && sim.lastGain > 0) {
        ctx.globalAlpha = 1 - since / 0.9;
        text(ctx, `+${sim.lastGain}`, sim.lastGainX, sim.lastGainY - (reducedMotion ? 0 : since * 40), 20, PALETTE.yellow, 'center', 900);
        ctx.globalAlpha = 1;
      }

      if (sim.shots === 0 && sim.phase === 'aim' && t > 0.4) {
        text(ctx, 'Point or drag to aim · release or Space to shoot', BS_WIDTH / 2, DANGER_Y - 14, 13, PALETTE.white, 'center', 600);
      }

      const sinceLevel = t - sim.levelStart;
      if (sim.phase === 'cleared') {
        drawBanner(ctx, `Level ${sim.level} cleared!`, `Bonus +${CLEAR_BONUS * sim.level}`, BS_WIDTH / 2, 330, 1, PALETTE.cyan);
      } else if (sim.phase === 'ending') {
        drawBanner(ctx, 'Game over', 'The bubbles reached the line', BS_WIDTH / 2, 330, Math.min(1, sim.phaseTime * 2), PALETTE.red);
      } else if (sinceLevel < 1.8) {
        drawBanner(ctx, `Level ${sim.level}`, `${sim.config.colors} colours`, BS_WIDTH / 2, 420, Math.min(1, 1.8 - sinceLevel), PALETTE.magenta);
      }
    },
  };
}
