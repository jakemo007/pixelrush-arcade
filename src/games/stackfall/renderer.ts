import { createSprite, drawBanner, drawSprite, FONT_STACK, PALETTE, roundRectPath, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import { pieceCells, pieceFromIndex, PIECE_TYPES, pieceSize, type PieceType } from './pieces';
import {
  absoluteCells,
  BOARD_X,
  BOARD_Y,
  CELL,
  COLS,
  HOLD_BOX,
  PANEL_X,
  ROWS,
  STACKFALL_HEIGHT,
  STACKFALL_WIDTH,
  type StackfallSimulation,
} from './simulation';

const PIECE_COLORS: Readonly<Record<PieceType, string>> = {
  I: PALETTE.cyan,
  O: PALETTE.yellow,
  T: PALETTE.violet,
  S: PALETTE.green,
  Z: PALETTE.red,
  J: '#5b8cff',
  L: PALETTE.orange,
};

const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const MINI = 18;

function makeBackground(): Sprite {
  return createSprite(STACKFALL_WIDTH, STACKFALL_HEIGHT, 0, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, STACKFALL_HEIGHT);
    grad.addColorStop(0, '#0a0f26');
    grad.addColorStop(1, '#050816');
    g.fillStyle = grad;
    g.fillRect(0, 0, STACKFALL_WIDTH, STACKFALL_HEIGHT);

    g.fillStyle = 'rgba(5, 8, 22, 0.85)';
    g.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
    g.strokeStyle = 'rgba(56, 232, 255, 0.07)';
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= COLS; x++) {
      g.moveTo(BOARD_X + x * CELL + 0.5, BOARD_Y);
      g.lineTo(BOARD_X + x * CELL + 0.5, BOARD_Y + BOARD_H);
    }
    for (let y = 0; y <= ROWS; y++) {
      g.moveTo(BOARD_X, BOARD_Y + y * CELL + 0.5);
      g.lineTo(BOARD_X + BOARD_W, BOARD_Y + y * CELL + 0.5);
    }
    g.stroke();
    g.strokeStyle = 'rgba(56, 232, 255, 0.55)';
    g.lineWidth = 2;
    g.strokeRect(BOARD_X - 1, BOARD_Y - 1, BOARD_W + 2, BOARD_H + 2);

    g.strokeStyle = 'rgba(167, 139, 250, 0.4)';
    g.lineWidth = 1.5;
    for (const box of [HOLD_BOX, { x: PANEL_X, y: BOARD_Y + 140, w: HOLD_BOX.w, h: 190 }]) {
      roundRectPath(g, box.x, box.y, box.w, box.h, 10);
      g.stroke();
    }
  });
}

function makeBlock(color: string): Sprite {
  return createSprite(CELL, CELL, 4, (g) => {
    g.shadowColor = color;
    g.shadowBlur = 6;
    g.fillStyle = color;
    roundRectPath(g, 1.5, 1.5, CELL - 3, CELL - 3, 5);
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255, 255, 255, 0.28)';
    roundRectPath(g, 4, 4, CELL - 8, 5, 2.5);
    g.fill();
    g.fillStyle = 'rgba(4, 18, 28, 0.28)';
    roundRectPath(g, 4, CELL - 9, CELL - 8, 5, 2.5);
    g.fill();
  });
}

export function createStackfallRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<StackfallSimulation> {
  const background = makeBackground();
  const blocks = Object.fromEntries(PIECE_TYPES.map((t) => [t, makeBlock(PIECE_COLORS[t])])) as Record<PieceType, Sprite>;

  function cellPosition(x: number, y: number) {
    return { px: BOARD_X + x * CELL, py: BOARD_Y + y * CELL };
  }

  function drawBoard(sim: StackfallSimulation): void {
    const clearing = new Set(sim.clearingRows);
    const flash = !reducedMotion && Math.floor(sim.time * 20) % 2 === 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = pieceFromIndex(sim.board[y * COLS + x]!);
        if (!type) continue;
        const { px, py } = cellPosition(x, y);
        drawSprite(ctx, blocks[type], px, py);
        if (clearing.has(y)) {
          ctx.fillStyle = flash || reducedMotion ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.35)';
          ctx.fillRect(px, py, CELL, CELL);
        }
      }
    }
  }

  function drawActive(sim: StackfallSimulation): void {
    const piece = sim.active;
    if (!piece) return;
    const dead = sim.phase === 'dying';
    if (!dead) {
      const ghost = { ...piece, y: sim.ghostY() };
      ctx.strokeStyle = PIECE_COLORS[piece.type];
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      for (const c of absoluteCells(ghost)) {
        if (c.y < 0) continue;
        const { px, py } = cellPosition(c.x, c.y);
        roundRectPath(ctx, px + 3, py + 3, CELL - 6, CELL - 6, 4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    for (const c of absoluteCells(piece)) {
      if (c.y < 0) continue;
      const { px, py } = cellPosition(c.x, c.y);
      drawSprite(ctx, blocks[piece.type], px, py);
      if (dead) {
        ctx.fillStyle = 'rgba(255, 77, 109, 0.55)';
        ctx.fillRect(px, py, CELL, CELL);
      }
    }
  }

  function drawMini(type: PieceType, cx: number, cy: number, dim: boolean): void {
    const size = pieceSize(type);
    const cells = pieceCells(type, 0);
    const ox = cx - (size * MINI) / 2;
    const oy = cy - (size === 4 ? 2 : size === 2 ? 1 : 1.5) * MINI + (type === 'I' ? 0.5 * MINI : 0);
    ctx.globalAlpha = dim ? 0.4 : 1;
    ctx.fillStyle = PIECE_COLORS[type];
    for (const c of cells) {
      roundRectPath(ctx, ox + c.x * MINI + 1, oy + c.y * MINI + 1, MINI - 2, MINI - 2, 3);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPanel(sim: StackfallSimulation): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `700 12px ${FONT_STACK}`;
    ctx.fillStyle = PALETTE.dim;
    const cx = PANEL_X + HOLD_BOX.w / 2;
    ctx.fillText('HOLD', cx, HOLD_BOX.y + 8);
    ctx.fillText('NEXT', cx, BOARD_Y + 148);
    if (sim.hold) drawMini(sim.hold, cx, HOLD_BOX.y + 58, sim.holdUsed);
    sim.peekNext().forEach((type, i) => drawMini(type, cx, BOARD_Y + 196 + i * 52, false));

    ctx.fillStyle = PALETTE.dim;
    ctx.fillText('SCORE', cx, BOARD_Y + 352);
    ctx.fillStyle = PALETTE.white;
    ctx.font = `800 22px ${FONT_STACK}`;
    ctx.fillText(String(sim.score), cx, BOARD_Y + 370);
    ctx.font = `700 12px ${FONT_STACK}`;
    ctx.fillStyle = PALETTE.dim;
    ctx.fillText('LEVEL', cx, BOARD_Y + 410);
    ctx.fillText('ROWS', cx, BOARD_Y + 470);
    ctx.fillStyle = sim.sinceLevelUp < 1.2 && !reducedMotion ? PALETTE.yellow : PALETTE.white;
    ctx.font = `800 20px ${FONT_STACK}`;
    ctx.fillText(String(sim.level), cx, BOARD_Y + 428);
    ctx.fillStyle = PALETTE.white;
    ctx.fillText(String(sim.rows), cx, BOARD_Y + 488);
  }

  return {
    render(sim) {
      ctx.save();
      if (!reducedMotion && sim.phase === 'dying' && sim.sinceEnd < 0.3) {
        const m = (0.3 - sim.sinceEnd) * 14;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }
      drawSprite(ctx, background, 0, 0);

      ctx.save();
      ctx.beginPath();
      ctx.rect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
      ctx.clip();
      drawBoard(sim);
      drawActive(sim);
      drawParticles(ctx, sim.particles);
      ctx.restore();

      drawPanel(sim);

      if (sim.phase === 'dying' && sim.sinceEnd > 0.25) {
        drawBanner(ctx, 'Stack topped out', `Score ${sim.score}`, BOARD_X + BOARD_W / 2, STACKFALL_HEIGHT / 2, Math.min(1, (sim.sinceEnd - 0.25) * 4), PALETTE.red);
      }
      ctx.restore();
    },
  };
}
