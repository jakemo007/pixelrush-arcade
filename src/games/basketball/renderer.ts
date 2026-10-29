import { createSprite, drawBanner, drawSprite, PALETTE, roundRectPath, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import { createBackdrop, dottedPath, powerColor, powerMeter, text } from '../arcade-kit/draw';
import { formatDuration } from '@/lib/format';
import {
  BACK_RIM_X,
  BALL_R,
  BB_H,
  BB_W,
  BOARD,
  FLOOR_Y,
  FRONT_RIM_X,
  HOOP_X,
  NET_DEPTH,
  RELEASE_Y,
  RIM_R,
  RIM_Y,
  THREE_POINT_DISTANCE,
} from './court';
import { MAX_DRAG, type BasketballSimulation } from './simulation';

function ballSprite(): Sprite {
  const r = BALL_R;
  return createSprite(r * 2, r * 2, 8, (g) => {
    g.shadowColor = PALETTE.orange;
    g.shadowBlur = 8;
    const grad = g.createRadialGradient(r * 0.7, r * 0.6, 1, r, r, r);
    grad.addColorStop(0, '#ffc08a');
    grad.addColorStop(1, '#e8641c');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(40, 14, 0, 0.75)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(0, r);
    g.lineTo(r * 2, r);
    g.moveTo(r, 0);
    g.lineTo(r, r * 2);
    g.moveTo(r * 0.35, r * 0.25);
    g.quadraticCurveTo(r * 1.1, r, r * 0.35, r * 1.75);
    g.moveTo(r * 1.65, r * 0.25);
    g.quadraticCurveTo(r * 0.9, r, r * 1.65, r * 1.75);
    g.stroke();
  });
}

function arena(): Sprite {
  const back = createBackdrop(BB_W, BB_H, { step: 45 });
  return createSprite(BB_W, BB_H, 0, (g) => {
    g.drawImage(back.canvas, 0, 0, BB_W, BB_H);
    for (let row = 0; row < 6; row++) {
      const y = 236 + row * 26;
      for (let i = 0; i < 24; i++) {
        const x = 12 + i * 22 + (row % 2) * 11 + Math.sin(i * 7.1 + row * 3.3) * 3;
        const hue = (i * 5 + row * 3) % 4;
        g.fillStyle = ['rgba(167, 139, 250, 0.16)', 'rgba(56, 232, 255, 0.12)', 'rgba(255, 79, 216, 0.12)', 'rgba(238, 242, 255, 0.08)'][hue]!;
        g.beginPath();
        g.arc(x, y, 6, 0, Math.PI * 2);
        g.fill();
        g.fillRect(x - 8, y + 7, 16, 10);
      }
    }
    g.strokeStyle = 'rgba(167, 139, 250, 0.45)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 402);
    g.lineTo(BB_W, 402);
    g.stroke();
    const fg = g.createLinearGradient(0, FLOOR_Y, 0, BB_H);
    fg.addColorStop(0, '#2a1846');
    fg.addColorStop(1, '#120a24');
    g.fillStyle = fg;
    g.fillRect(0, FLOOR_Y, BB_W, BB_H - FLOOR_Y);
    g.strokeStyle = 'rgba(167, 139, 250, 0.18)';
    g.lineWidth = 1;
    for (let y = FLOOR_Y + 14; y < BB_H; y += 14) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(BB_W, y);
      g.stroke();
    }
    g.strokeStyle = PALETTE.violet;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, FLOOR_Y);
    g.lineTo(BB_W, FLOOR_Y);
    g.stroke();
    const tx = HOOP_X - THREE_POINT_DISTANCE;
    g.strokeStyle = PALETTE.cyan;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(tx, FLOOR_Y);
    g.lineTo(tx, FLOOR_Y + 30);
    g.stroke();
    g.fillStyle = PALETTE.cyan;
    g.font = '800 12px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('3-POINT LINE', tx, FLOOR_Y + 48);
    g.fillStyle = '#1b2148';
    g.fillRect(522, RIM_Y - 70, 10, FLOOR_Y - RIM_Y + 70);
    g.fillRect(BOARD.ax, RIM_Y - 40, 26, 6);
    g.fillStyle = '#2a3266';
    roundRectPath(g, 510, FLOOR_Y - 16, 34, 16, 4);
    g.fill();
    g.fillStyle = 'rgba(200, 220, 255, 0.18)';
    g.fillRect(BOARD.ax - 4, BOARD.ay, 8, BOARD.by - BOARD.ay);
    g.shadowColor = PALETTE.white;
    g.shadowBlur = 8;
    g.strokeStyle = PALETTE.white;
    g.lineWidth = 2;
    g.strokeRect(BOARD.ax - 4, BOARD.ay, 8, BOARD.by - BOARD.ay);
    g.shadowBlur = 0;
    g.strokeStyle = PALETTE.red;
    g.strokeRect(BOARD.ax - 4, RIM_Y - 34, 8, 30);
  });
}

export function createBasketballRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<BasketballSimulation> {
  const background = arena();
  const ball = ballSprite();

  const drawNet = (sim: BasketballSimulation) => {
    const sway = sim.scored && sim.phase === 'flight' && !reducedMotion ? Math.sin(sim.phaseTime * 18) * 3 : 0;
    const bottomL = FRONT_RIM_X + 8 + sway;
    const bottomR = BACK_RIM_X - 8 + sway;
    const bottomY = RIM_Y + NET_DEPTH + (sim.scored && sim.phase === 'flight' && !reducedMotion ? 6 : 0);
    ctx.strokeStyle = 'rgba(238, 242, 255, 0.75)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    const n = 5;
    for (let i = 0; i <= n; i++) {
      const tx = FRONT_RIM_X + ((BACK_RIM_X - FRONT_RIM_X) * i) / n;
      const bx = bottomL + ((bottomR - bottomL) * (n - i)) / n;
      ctx.moveTo(tx, RIM_Y);
      ctx.lineTo(bx, bottomY);
      const bx2 = bottomL + ((bottomR - bottomL) * i) / n;
      ctx.moveTo(tx, RIM_Y);
      ctx.lineTo(bx2, bottomY);
    }
    for (let k = 1; k <= 3; k++) {
      const y = RIM_Y + (NET_DEPTH * k) / 3.4;
      const t = k / 3.4;
      ctx.moveTo(FRONT_RIM_X + (bottomL - FRONT_RIM_X) * t, y);
      ctx.lineTo(BACK_RIM_X + (bottomR - BACK_RIM_X) * t, y);
    }
    ctx.stroke();
  };

  return {
    render(sim) {
      drawSprite(ctx, background, 0, 0);

      const clock = Math.ceil(sim.clock);
      const low = sim.clock <= 10 && sim.phase !== 'ending';
      text(ctx, formatDuration(clock * 1000), BB_W / 2, 52, 44, low ? PALETTE.red : PALETTE.white, 'center', 900);
      text(ctx, 'TIME', BB_W / 2, 88, 12, PALETTE.dim, 'center', 800);
      const mult = sim.multiplier;
      text(ctx, `STREAK x${mult}`, 24, 40, 14, mult > 1 ? PALETTE.yellow : PALETTE.dim, 'left', 900);
      text(ctx, `${sim.makes}/${sim.shots} MADE`, BB_W - 24, 40, 14, PALETTE.dim, 'right', 900);

      const sx = sim.spotX;
      ctx.fillStyle = sim.isThree ? PALETTE.cyan : PALETTE.violet;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(sx, FLOOR_Y + 4, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      text(ctx, sim.isThree ? '3 PT' : '2 PT', sx, FLOOR_Y + 24, 13, sim.isThree ? PALETTE.cyan : PALETTE.violet, 'center', 900);
      ctx.strokeStyle = PALETTE.cyan;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx - 10, FLOOR_Y);
      ctx.lineTo(sx - 2, FLOOR_Y - 48);
      ctx.lineTo(sx + 8, FLOOR_Y);
      ctx.moveTo(sx - 2, FLOOR_Y - 48);
      ctx.lineTo(sx - 4, FLOOR_Y - 92);
      const handX = sim.phase === 'aim' ? sim.ball.x - 6 : sx + 8;
      const handY = sim.phase === 'aim' ? sim.ball.y + 6 : RELEASE_Y - 4;
      ctx.moveTo(sx - 4, FLOOR_Y - 86);
      ctx.lineTo(handX, handY);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = PALETTE.cyan;
      ctx.beginPath();
      ctx.arc(sx - 5, FLOOR_Y - 104, 9, 0, Math.PI * 2);
      ctx.fill();

      drawNet(sim);

      if (sim.phase === 'aim') {
        dottedPath(ctx, sim.previewX, sim.previewY, sim.previewX.length, powerColor(sim.power), 3);
        powerMeter(ctx, 18, 420, 14, 160, sim.power);
        text(ctx, 'POWER', 25, 598, 10, PALETTE.dim, 'center', 800);
        text(ctx, `${Math.round(-sim.angle * (180 / Math.PI))}°`, 25, 404, 12, PALETTE.white, 'center', 800);
        if (sim.drag.active) {
          ctx.strokeStyle = 'rgba(238, 242, 255, 0.35)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 6]);
          ctx.beginPath();
          ctx.moveTo(sim.drag.originX, sim.drag.originY);
          ctx.lineTo(sim.drag.x, sim.drag.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(238, 242, 255, 0.08)';
          ctx.beginPath();
          ctx.arc(sim.drag.originX, sim.drag.originY, MAX_DRAG, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const b = sim.ball;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(reducedMotion ? 0 : b.x / BALL_R / 2);
      drawSprite(ctx, ball, -BALL_R, -BALL_R);
      ctx.restore();

      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = RIM_R * 1.6;
      ctx.beginPath();
      ctx.moveTo(FRONT_RIM_X, RIM_Y);
      ctx.lineTo(BACK_RIM_X, RIM_Y);
      ctx.lineTo(BOARD.ax - 4, RIM_Y);
      ctx.stroke();
      ctx.fillStyle = PALETTE.orange;
      for (const rx of [FRONT_RIM_X, BACK_RIM_X]) {
        ctx.beginPath();
        ctx.arc(rx, RIM_Y, RIM_R, 0, Math.PI * 2);
        ctx.fill();
      }

      drawParticles(ctx, sim.particles);

      const since = sim.time - sim.labelTime;
      if (since < 1.1 && sim.label) {
        const color = sim.label === 'MISS' ? PALETTE.dim : sim.label.startsWith('SWISH') ? PALETTE.green : PALETTE.yellow;
        ctx.globalAlpha = Math.min(1, (1.1 - since) * 3);
        text(ctx, sim.label, HOOP_X - 40, RIM_Y - 110 - (reducedMotion ? 0 : since * 20), 24, color, 'center', 900);
        ctx.globalAlpha = 1;
      }

      if (sim.shots === 0 && sim.phase === 'aim') {
        text(ctx, 'Drag back from anywhere and release to shoot', BB_W / 2, 150, 14, PALETTE.white, 'center', 600);
        text(ctx, 'Keyboard: arrows aim and set power, Space shoots', BB_W / 2, 172, 13, PALETTE.dim, 'center', 600);
      }

      if (sim.phase === 'ending') {
        drawBanner(ctx, 'Time!', `${sim.score} points · ${sim.makes}/${sim.shots} made`, BB_W / 2, 280, Math.min(1, sim.phaseTime * 3), PALETTE.yellow);
      }
    },
  };
}
