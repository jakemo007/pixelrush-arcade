import { createSprite, drawBanner, drawSprite, PALETTE, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import { createBackdrop, glowDot, panel, powerColor, text } from '../arcade-kit/draw';
import { moverSegments, HOLES, MOVER_THICKNESS, TOTAL_PAR, type CompiledHole } from './course';
import { BALL_R, CUP_R } from './physics';
import { MG_HEIGHT, MG_WIDTH, MAX_DRAG, type MiniGolfSimulation } from './simulation';
import type { Segment } from '../arcade-kit/geometry';

function tracePoly(g: CanvasRenderingContext2D, poly: readonly number[]): void {
  g.beginPath();
  for (let i = 0; i < poly.length; i += 2) {
    if (i === 0) g.moveTo(poly[i]!, poly[i + 1]!);
    else g.lineTo(poly[i]!, poly[i + 1]!);
  }
  g.closePath();
}

function polyCentre(poly: readonly number[]): [number, number] {
  let x = 0;
  let y = 0;
  const n = poly.length / 2;
  for (let i = 0; i < poly.length; i += 2) {
    x += poly[i]!;
    y += poly[i + 1]!;
  }
  return [x / n, y / n];
}

function courseSprite(hole: CompiledHole): Sprite {
  const def = hole.def;
  return createSprite(MG_WIDTH, MG_HEIGHT, 0, (g) => {
    g.save();
    tracePoly(g, def.outline);
    g.clip();
    const grad = g.createLinearGradient(0, 0, 0, MG_HEIGHT);
    grad.addColorStop(0, '#11493a');
    grad.addColorStop(1, '#0b3027');
    g.fillStyle = grad;
    g.fillRect(0, 0, MG_WIDTH, MG_HEIGHT);
    g.fillStyle = 'rgba(77, 255, 181, 0.045)';
    for (let y = 0; y < MG_HEIGHT; y += 64) g.fillRect(0, y, MG_WIDTH, 32);

    for (const slope of hole.slopes) {
      tracePoly(g, slope.poly);
      g.fillStyle = 'rgba(167, 139, 250, 0.16)';
      g.fill();
      const a = Math.atan2(slope.ay, slope.ax);
      const xs = slope.poly.filter((_, i) => i % 2 === 0);
      const ys = slope.poly.filter((_, i) => i % 2 === 1);
      g.strokeStyle = 'rgba(199, 182, 255, 0.45)';
      g.lineWidth = 3;
      for (let x = Math.min(...xs) + 30; x < Math.max(...xs); x += 60) {
        for (let y = Math.min(...ys) + 30; y < Math.max(...ys); y += 50) {
          g.save();
          g.translate(x, y);
          g.rotate(a);
          g.beginPath();
          g.moveTo(-6, -9);
          g.lineTo(4, 0);
          g.lineTo(-6, 9);
          g.stroke();
          g.restore();
        }
      }
    }
    for (const sand of hole.sand) {
      tracePoly(g, sand);
      g.fillStyle = '#b8924c';
      g.fill();
      g.fillStyle = 'rgba(255, 236, 190, 0.35)';
      const [cx, cy] = polyCentre(sand);
      for (let i = 0; i < 40; i++) {
        const x = cx + Math.sin(i * 12.9898) * 70;
        const y = cy + Math.cos(i * 78.233) * 35;
        g.fillRect(x, y, 2, 2);
      }
    }
    for (const water of hole.water) {
      tracePoly(g, water);
      const wg = g.createLinearGradient(0, 0, 0, MG_HEIGHT);
      wg.addColorStop(0, '#1c5bb0');
      wg.addColorStop(1, '#143f80');
      g.fillStyle = wg;
      g.fill();
      g.save();
      tracePoly(g, water);
      g.clip();
      g.strokeStyle = 'rgba(160, 220, 255, 0.35)';
      g.lineWidth = 2;
      const ys = water.filter((_, i) => i % 2 === 1);
      const xs = water.filter((_, i) => i % 2 === 0);
      for (let y = Math.min(...ys) + 14; y < Math.max(...ys); y += 20) {
        g.beginPath();
        for (let x = Math.min(...xs); x <= Math.max(...xs); x += 10) {
          const yy = y + Math.sin(x / 14) * 3;
          if (x === Math.min(...xs)) g.moveTo(x, yy);
          else g.lineTo(x, yy);
        }
        g.stroke();
      }
      g.restore();
    }
    g.restore();

    g.fillStyle = 'rgba(238, 242, 255, 0.25)';
    g.fillRect(def.tee[0] - 12, def.tee[1] - 3, 24, 6);

    g.fillStyle = '#04110c';
    g.beginPath();
    g.arc(def.cup[0], def.cup[1], CUP_R, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(238, 242, 255, 0.7)';
    g.lineWidth = 2;
    g.stroke();

    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.shadowColor = PALETTE.cyan;
    g.shadowBlur = 10;
    g.strokeStyle = PALETTE.cyan;
    g.lineWidth = 5;
    g.beginPath();
    for (const s of hole.segments) {
      g.moveTo(s.ax, s.ay);
      g.lineTo(s.bx, s.by);
    }
    g.stroke();
    g.shadowBlur = 0;

    for (const b of hole.bumpers) {
      g.shadowColor = b.bouncy ? PALETTE.magenta : PALETTE.dim;
      g.shadowBlur = 12;
      g.fillStyle = b.bouncy ? '#3a0b33' : '#1b2148';
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
      g.strokeStyle = b.bouncy ? PALETTE.magenta : PALETTE.dim;
      g.lineWidth = 3;
      g.stroke();
      if (b.bouncy) {
        g.beginPath();
        g.arc(b.x, b.y, b.r * 0.45, 0, Math.PI * 2);
        g.stroke();
      }
    }
  });
}

export function createMiniGolfRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<MiniGolfSimulation> {
  const background = createBackdrop(MG_WIDTH, MG_HEIGHT, { step: 48 });
  const ball = glowDot(BALL_R, '#ffffff', '#cfd8ff', '#ffffff', 10);
  const courses = new Map<number, Sprite>();
  const segs: Segment[] = [];

  const course = (sim: MiniGolfSimulation) => {
    let sprite = courses.get(sim.holeIndex);
    if (!sprite) {
      sprite = courseSprite(sim.hole);
      courses.set(sim.holeIndex, sprite);
    }
    return sprite;
  };

  return {
    render(sim) {
      drawSprite(ctx, background, 0, 0);
      drawSprite(ctx, course(sim), 0, 0);
      const def = sim.hole.def;

      text(ctx, `HOLE ${sim.holeIndex + 1}`, 18, 26, 15, PALETTE.green, 'left', 900);
      text(ctx, def.name, 92, 26, 15, PALETTE.white, 'left', 700);
      text(ctx, `PAR ${def.par}`, MG_WIDTH - 18, 26, 15, PALETTE.green, 'right', 900);
      const strokeText = sim.strokes === 1 ? '1 stroke' : `${sim.strokes} strokes`;
      text(ctx, strokeText, MG_WIDTH - 82, 26, 13, PALETTE.dim, 'right', 700);
      text(ctx, `Total ${sim.score}`, 18, 50, 12, PALETTE.dim, 'left', 700);

      const [cx, cy] = def.cup;
      const sway = reducedMotion ? 0 : Math.sin(sim.time * 2) * 2;
      ctx.strokeStyle = '#eef2ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - 42);
      ctx.stroke();
      ctx.fillStyle = PALETTE.yellow;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 42);
      ctx.lineTo(cx + 22 + sway, cy - 35);
      ctx.lineTo(cx, cy - 28);
      ctx.fill();

      ctx.lineCap = 'round';
      for (const m of sim.hole.movers) {
        moverSegments(m, sim.holeTime, segs);
        ctx.strokeStyle = 'rgba(255, 210, 63, 0.3)';
        ctx.lineWidth = MOVER_THICKNESS * 2 + 6;
        ctx.beginPath();
        for (const s of segs) {
          ctx.moveTo(s.ax, s.ay);
          ctx.lineTo(s.bx, s.by);
        }
        ctx.stroke();
        ctx.strokeStyle = PALETTE.yellow;
        ctx.lineWidth = MOVER_THICKNESS * 2;
        ctx.stroke();
      }
      ctx.lineCap = 'butt';

      const b = sim.ball;
      if (sim.phase === 'aim') {
        const color = powerColor(sim.power);
        const len = 28 + sim.power * 130;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(sim.aimAngle);
        ctx.fillStyle = color;
        for (let d = 16; d < len; d += 10) {
          ctx.globalAlpha = 1 - (d / len) * 0.6;
          ctx.beginPath();
          ctx.arc(d, 0, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(len + 8, 0);
        ctx.lineTo(len - 4, -7);
        ctx.lineTo(len - 4, 7);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(7, 10, 24, 0.6)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 17, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sim.power);
        ctx.stroke();
        text(ctx, `${Math.round(sim.power * 100)}%`, b.x, b.y + 30, 12, color, 'center', 800);
        if (sim.drag.active) {
          ctx.strokeStyle = 'rgba(238, 242, 255, 0.35)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 6]);
          ctx.beginPath();
          ctx.moveTo(sim.drag.originX, sim.drag.originY);
          ctx.lineTo(sim.drag.x, sim.drag.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(sim.drag.originX, sim.drag.originY, MAX_DRAG, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(238, 242, 255, 0.08)';
          ctx.stroke();
        }
      }

      if (sim.phase === 'sinking') {
        const k = Math.min(1, sim.phaseTime / 0.5);
        const r = BALL_R * (1 - 0.7 * k);
        ctx.globalAlpha = 1 - k * 0.8;
        drawSprite(ctx, ball, b.x - r, b.y - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      } else if (sim.phase === 'splash') {
        const k = Math.min(1, sim.phaseTime / 0.6);
        ctx.strokeStyle = `rgba(160, 220, 255, ${1 - k})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6 + k * 26, 0, Math.PI * 2);
        ctx.stroke();
      } else if (sim.phase !== 'scorecard' && sim.phase !== 'finished') {
        drawSprite(ctx, ball, b.x - BALL_R, b.y - BALL_R);
      }
      drawParticles(ctx, sim.particles);

      if (sim.phase === 'aim' && sim.strokes === 0 && sim.holeIndex === 0 && sim.phaseTime > 0.3) {
        text(ctx, 'Drag back from anywhere and release to putt', MG_WIDTH / 2, MG_HEIGHT - 14, 13, PALETTE.white, 'center', 600);
      }

      const since = sim.time - sim.messageTime;
      if (since < 1.6 && sim.phase !== 'scorecard' && sim.phase !== 'finished') {
        drawBanner(ctx, sim.message, null, MG_WIDTH / 2, MG_HEIGHT / 2, Math.min(1, (1.6 - since) * 2), PALETTE.yellow);
      }

      if (sim.phase === 'scorecard' || sim.phase === 'finished') drawScorecard(ctx, sim);
    },
  };
}

function drawScorecard(ctx: CanvasRenderingContext2D, sim: MiniGolfSimulation): void {
  const x = 20;
  const w = MG_WIDTH - 40;
  const y = 190;
  const h = 300;
  panel(ctx, x, y, w, h, PALETTE.green, 0.92);
  const final = sim.phase === 'finished';
  text(ctx, final ? 'Round complete' : `Hole ${sim.holeIndex + 1}: ${sim.message}`, MG_WIDTH / 2, y + 34, 22, PALETTE.white, 'center', 900);
  const colW = 40;
  const labelW = 64;
  const startX = x + 14 + labelW;
  const rows = [
    { label: 'Hole', values: HOLES.map((_, i) => String(i + 1)), total: 'Tot' },
    { label: 'Par', values: HOLES.map((hd) => String(hd.par)), total: String(TOTAL_PAR) },
    { label: 'You', values: HOLES.map((_, i) => (sim.card[i] !== undefined ? String(sim.card[i]) : '·')), total: String(sim.score) },
  ];
  rows.forEach((row, r) => {
    const ry = y + 92 + r * 46;
    text(ctx, row.label, x + 18, ry, 14, PALETTE.dim, 'left', 800);
    row.values.forEach((v, i) => {
      const cx = startX + i * colW + colW / 2;
      let color: string = PALETTE.white;
      if (r === 2 && sim.card[i] !== undefined) {
        const diff = sim.card[i]! - HOLES[i]!.par;
        color = diff < 0 ? PALETTE.green : diff > 0 ? PALETTE.orange : PALETTE.white;
      }
      if (r === 0 && i === sim.holeIndex) color = PALETTE.yellow;
      text(ctx, v, cx, ry, r === 0 ? 13 : 16, color, 'center', r === 0 ? 700 : 800);
    });
    text(ctx, row.total, startX + 9 * colW + 6, ry, 14, r === 2 ? PALETTE.yellow : PALETTE.dim, 'left', 900);
  });
  const diff = sim.score - sim.parSoFar;
  const rel = diff === 0 ? 'Level par' : diff > 0 ? `${diff} over par` : `${-diff} under par`;
  text(ctx, `${sim.score} strokes · ${rel}`, MG_WIDTH / 2, y + h - 52, 16, PALETTE.green, 'center', 800);
  text(ctx, final ? 'Tap or press Space to finish' : 'Tap or press Space for the next hole', MG_WIDTH / 2, y + h - 24, 13, PALETTE.dim, 'center', 600);
}
