import { createSprite, drawBanner, drawSprite, PALETTE, roundRectPath, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import { createBackdrop, paintGem, panel, text } from '../arcade-kit/draw';
import { easeOutCubic } from '../arcade-kit/math';
import { TOKENS } from '../arcade-kit/tokens';
import { formatPoints } from '@/lib/format';
import { CELLS, colOf, EMPTY, rowOf, SIZE } from './board';
import { BOARD_X, BOARD_Y, CELL, M3_HEIGHT, M3_WIDTH, MOVE_BONUS, MOVES_PER_LEVEL, type Match3Simulation } from './simulation';

const GEM_R = 24;

function gemSprite(kind: number): Sprite {
  const style = TOKENS[kind]!;
  return createSprite(GEM_R * 2, GEM_R * 2, 10, (ctx) => paintGem(ctx, style, GEM_R, GEM_R, GEM_R - 2, 9));
}

export function createMatch3Renderer({ ctx, reducedMotion }: RenderEnv): Renderer<Match3Simulation> {
  const background = createBackdrop(M3_WIDTH, M3_HEIGHT, { step: 45 });
  const gems = TOKENS.map((_, i) => gemSprite(i));
  const boardW = CELL * SIZE;
  const boardBack = createSprite(boardW + 16, boardW + 16, 0, (g) => {
    g.fillStyle = 'rgba(7, 10, 24, 0.85)';
    roundRectPath(g, 0, 0, boardW + 16, boardW + 16, 16);
    g.fill();
    g.strokeStyle = 'rgba(167, 139, 250, 0.55)';
    g.lineWidth = 2;
    g.stroke();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        g.fillStyle = (r + c) % 2 === 0 ? 'rgba(167, 139, 250, 0.08)' : 'rgba(56, 232, 255, 0.04)';
        roundRectPath(g, 8 + c * CELL + 2, 8 + r * CELL + 2, CELL - 4, CELL - 4, 10);
        g.fill();
      }
    }
  });

  const cellX = (i: number) => BOARD_X + colOf(i) * CELL + CELL / 2;
  const cellY = (i: number) => BOARD_Y + rowOf(i) * CELL + CELL / 2;

  const outline = (i: number, color: string, width: number, dash: number[] = []) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    roundRectPath(ctx, BOARD_X + colOf(i) * CELL + 3, BOARD_Y + rowOf(i) * CELL + 3, CELL - 6, CELL - 6, 12);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  return {
    render(sim) {
      drawSprite(ctx, background, 0, 0);

      panel(ctx, BOARD_X, 14, boardW, 120, 'rgba(167, 139, 250, 0.55)');
      text(ctx, `LEVEL ${sim.level}`, BOARD_X + 20, 40, 14, PALETTE.violet, 'left', 800);
      text(ctx, `${formatPoints(sim.levelScore)} / ${formatPoints(sim.target)}`, BOARD_X + 20, 72, 26, PALETTE.white, 'left', 800);
      const barW = 340;
      const pct = Math.min(1, sim.levelScore / sim.target);
      ctx.fillStyle = 'rgba(238, 242, 255, 0.1)';
      roundRectPath(ctx, BOARD_X + 20, 96, barW, 14, 7);
      ctx.fill();
      if (pct > 0) {
        const grad = ctx.createLinearGradient(BOARD_X + 20, 0, BOARD_X + 20 + barW, 0);
        grad.addColorStop(0, PALETTE.violet);
        grad.addColorStop(1, PALETTE.magenta);
        ctx.fillStyle = grad;
        roundRectPath(ctx, BOARD_X + 20, 96, Math.max(14, barW * pct), 14, 7);
        ctx.fill();
      }
      text(ctx, 'TARGET', BOARD_X + 20 + barW, 40, 11, PALETTE.dim, 'right', 800);
      const movesColor = sim.movesLeft <= 3 ? PALETTE.red : sim.movesLeft <= 5 ? PALETTE.yellow : PALETTE.cyan;
      text(ctx, String(sim.movesLeft), BOARD_X + boardW - 58, 68, 44, movesColor, 'center', 900);
      text(ctx, 'MOVES', BOARD_X + boardW - 58, 106, 12, PALETTE.dim, 'center', 800);

      drawSprite(ctx, boardBack, BOARD_X - 8, BOARD_Y - 8);

      if (sim.hint && sim.phase === 'idle') {
        ctx.globalAlpha = reducedMotion ? 0.8 : 0.45 + 0.4 * Math.abs(Math.sin(sim.time * 3));
        outline(sim.hint.a, PALETTE.yellow, 2.5);
        outline(sim.hint.b, PALETTE.yellow, 2.5);
        ctx.globalAlpha = 1;
      }

      const p = sim.progress;
      ctx.save();
      ctx.beginPath();
      ctx.rect(BOARD_X - 8, BOARD_Y - 4, boardW + 16, boardW + 12);
      ctx.clip();
      const clearing = sim.phase === 'clear' ? sim.clearing : null;
      for (let i = 0; i < CELLS; i++) {
        const kind = sim.board[i]!;
        if (kind === EMPTY) continue;
        let x = cellX(i);
        let y = cellY(i);
        let scale = 1;
        let alpha = 1;
        if ((sim.phase === 'swap' || sim.phase === 'swapBack') && (i === sim.swapA || i === sim.swapB)) {
          const other = i === sim.swapA ? sim.swapB : sim.swapA;
          const t = reducedMotion ? 1 : easeOutCubic(p);
          x = cellX(other) + (x - cellX(other)) * t;
          y = cellY(other) + (y - cellY(other)) * t;
        } else if (sim.phase === 'fall' && sim.fallRows[i]! > 0 && !reducedMotion) {
          y -= sim.fallRows[i]! * CELL * (1 - p * p);
        } else if (clearing?.includes(i)) {
          alpha = 1 - p;
          scale = reducedMotion ? 1 : 1 - 0.6 * p;
        }
        if (i === sim.selected && sim.phase === 'idle' && !reducedMotion) scale *= 1.06 + 0.03 * Math.sin(sim.time * 8);
        ctx.globalAlpha = alpha;
        const r = GEM_R * scale;
        drawSprite(ctx, gems[kind]!, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (sim.selected >= 0) outline(sim.selected, PALETTE.cyan, 3);
      if (sim.cursorVisible) outline(sim.cursor, PALETTE.white, 2, [6, 5]);

      drawParticles(ctx, sim.particles);

      const since = sim.time - sim.lastGainTime;
      if (sim.moveGain > 0 && since < 1) {
        ctx.globalAlpha = Math.min(1, 1.6 - since * 1.6);
        text(ctx, `+${formatPoints(sim.moveGain)}`, BOARD_X + 360, 72 - (reducedMotion ? 0 : since * 8), 22, PALETTE.yellow, 'right', 900);
        ctx.globalAlpha = 1;
      }

      const footY = BOARD_Y + boardW + 32;
      if (sim.chain >= 2 && (sim.phase === 'clear' || sim.phase === 'fall')) {
        text(ctx, `Cascade x${sim.chain}!`, M3_WIDTH / 2, footY, 20, PALETTE.magenta, 'center', 900);
      } else if (sim.phase === 'shuffle') {
        text(ctx, 'No moves left: shuffling the board', M3_WIDTH / 2, footY, 17, PALETTE.yellow, 'center', 800);
      } else if (sim.movesMade === 0 && sim.level === 1) {
        text(ctx, 'Swipe a gem toward a neighbour, or tap two neighbours', M3_WIDTH / 2, footY, 15, PALETTE.dim, 'center', 600);
      } else if (sim.movesLeft <= 5 && sim.phase === 'idle') {
        text(ctx, `${sim.movesLeft} ${sim.movesLeft === 1 ? 'move' : 'moves'} left`, M3_WIDTH / 2, footY, 16, movesColor, 'center', 800);
      }

      if (sim.phase === 'levelUp') {
        drawBanner(
          ctx,
          'Target reached!',
          `+${formatPoints(sim.levelBonus)} bonus (${MOVE_BONUS} per move left)`,
          M3_WIDTH / 2,
          BOARD_Y + boardW / 2,
          Math.min(1, sim.phaseTime * 3),
          PALETTE.cyan,
        );
      } else if (sim.phase === 'ending') {
        drawBanner(ctx, 'Out of moves', `${formatPoints(sim.levelScore)} of ${formatPoints(sim.target)}`, M3_WIDTH / 2, BOARD_Y + boardW / 2, Math.min(1, sim.phaseTime * 3), PALETTE.red);
      } else if (sim.phase === 'idle' && sim.movesLeft === MOVES_PER_LEVEL && sim.levelScore === 0 && sim.phaseTime < 1.6 && sim.level > 1) {
        drawBanner(ctx, `Level ${sim.level}`, `Score ${formatPoints(sim.target)} in ${MOVES_PER_LEVEL} moves`, M3_WIDTH / 2, BOARD_Y + boardW / 2, 1.6 - sim.phaseTime, PALETTE.violet);
      }
    },
  };
}
