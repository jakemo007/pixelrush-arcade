import { createSprite, drawBanner, drawSprite, PALETTE, roundRectPath, type Sprite } from '../engine/canvas';
import type { RenderEnv, Renderer } from '../engine/types';
import { panel, text } from '../arcade-kit/draw';
import { formatRaceTime } from '@/lib/format';
import { CAR_LENGTH, CAR_WIDTH } from './car';
import { BARRIER, HALF_WIDTH, KERB_WIDTH, type Track } from './track';
import {
  CR_HEIGHT,
  CR_WIDTH,
  getTrack,
  LAPS,
  TOUCH_BRAKE_Y,
  TOUCH_STEER_RANGE,
  type CarRacingSimulation,
} from './simulation';

const CAR_SCREEN_Y = CR_HEIGHT * 0.66;
const MAP_W = 128;
const MAP_H = 104;
const GRID = 160;

function trackPath(track: Track): Path2D {
  const path = new Path2D();
  path.moveTo(track.xs[0]!, track.ys[0]!);
  for (let i = 1; i < track.count; i++) path.lineTo(track.xs[i]!, track.ys[i]!);
  path.closePath();
  return path;
}

function carSprite(body: string, dark: string, glow: string): Sprite {
  return createSprite(CAR_LENGTH, CAR_WIDTH, 10, (g) => {
    g.shadowColor = glow;
    g.shadowBlur = 10;
    const grad = g.createLinearGradient(0, 0, 0, CAR_WIDTH);
    grad.addColorStop(0, body);
    grad.addColorStop(1, dark);
    g.fillStyle = grad;
    roundRectPath(g, 0, 0, CAR_LENGTH, CAR_WIDTH, 6);
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(7, 10, 24, 0.85)';
    roundRectPath(g, 13, 4, 14, CAR_WIDTH - 8, 4);
    g.fill();
    g.fillStyle = 'rgba(56, 232, 255, 0.7)';
    roundRectPath(g, 24, 5, 4, CAR_WIDTH - 10, 2);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.75)';
    g.fillRect(2, CAR_WIDTH / 2 - 1.5, 10, 3);
    g.fillStyle = '#ffffff';
    g.fillRect(CAR_LENGTH - 3, 3, 2, 4);
    g.fillRect(CAR_LENGTH - 3, CAR_WIDTH - 7, 2, 4);
    g.fillStyle = PALETTE.red;
    g.fillRect(0.5, 3, 2, 4);
    g.fillRect(0.5, CAR_WIDTH - 7, 2, 4);
  });
}

export function createCarRacingRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<CarRacingSimulation> {
  const track = getTrack();
  const path = trackPath(track);
  const car = carSprite('#ffd23f', '#ff8a3d', '#ffd23f');
  const ghostCar = carSprite('#c9d4ff', '#7d89c9', '#a78bfa');

  const pad = 8;
  const mapScale = Math.min((MAP_W - pad * 2) / (track.maxX - track.minX), (MAP_H - pad * 2) / (track.maxY - track.minY));
  const mapOx = (MAP_W - (track.maxX - track.minX) * mapScale) / 2 - track.minX * mapScale;
  const mapOy = (MAP_H - (track.maxY - track.minY) * mapScale) / 2 - track.minY * mapScale;
  const minimap = createSprite(MAP_W, MAP_H, 0, (g) => {
    g.fillStyle = 'rgba(7, 10, 24, 0.82)';
    roundRectPath(g, 0, 0, MAP_W, MAP_H, 10);
    g.fill();
    g.strokeStyle = 'rgba(167, 139, 250, 0.6)';
    g.lineWidth = 1.5;
    g.stroke();
    g.beginPath();
    for (let i = 0; i <= track.count; i++) {
      const k = i % track.count;
      const x = track.xs[k]! * mapScale + mapOx;
      const y = track.ys[k]! * mapScale + mapOy;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokeStyle = 'rgba(238, 242, 255, 0.55)';
    g.lineWidth = 4;
    g.lineJoin = 'round';
    g.stroke();
    const sx = track.xs[0]! * mapScale + mapOx;
    const sy = track.ys[0]! * mapScale + mapOy;
    g.fillStyle = PALETTE.white;
    g.fillRect(sx - 1.5, sy - 5, 3, 10);
  });

  const start = track.gates[0]!;
  const startAngle = Math.atan2(track.ty[start.index]!, track.tx[start.index]!);

  return {
    render(sim) {
      const zoom = reducedMotion ? 0.95 : sim.camZoom;
      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, CR_WIDTH, CR_HEIGHT);

      ctx.save();
      let ox = 0;
      let oy = 0;
      if (!reducedMotion && sim.shake > 0) {
        ox = (Math.random() - 0.5) * sim.shake * 10;
        oy = (Math.random() - 0.5) * sim.shake * 10;
      }
      ctx.translate(CR_WIDTH / 2 + ox, CAR_SCREEN_Y + oy);
      ctx.scale(zoom, zoom);
      ctx.rotate(-Math.PI / 2 - sim.camAngle);
      ctx.translate(-sim.car.x, -sim.car.y);

      const reach = Math.hypot(CR_WIDTH, CR_HEIGHT) / zoom;
      const gx0 = Math.floor((sim.car.x - reach) / GRID) * GRID;
      const gy0 = Math.floor((sim.car.y - reach) / GRID) * GRID;
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = gx0; x <= sim.car.x + reach; x += GRID) {
        ctx.moveTo(x, sim.car.y - reach);
        ctx.lineTo(x, sim.car.y + reach);
      }
      for (let y = gy0; y <= sim.car.y + reach; y += GRID) {
        ctx.moveTo(sim.car.x - reach, y);
        ctx.lineTo(sim.car.x + reach, y);
      }
      ctx.stroke();

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = PALETTE.violet;
      ctx.lineWidth = BARRIER * 2 + 8;
      ctx.stroke(path);
      ctx.strokeStyle = '#0b2a22';
      ctx.lineWidth = BARRIER * 2;
      ctx.stroke(path);
      ctx.strokeStyle = PALETTE.white;
      ctx.lineWidth = HALF_WIDTH * 2;
      ctx.stroke(path);
      ctx.setLineDash([22, 22]);
      ctx.strokeStyle = PALETTE.red;
      ctx.stroke(path);
      ctx.setLineDash([]);
      ctx.strokeStyle = '#1c2035';
      ctx.lineWidth = (HALF_WIDTH - KERB_WIDTH) * 2;
      ctx.stroke(path);
      ctx.setLineDash([34, 46]);
      ctx.strokeStyle = 'rgba(238, 242, 255, 0.16)';
      ctx.lineWidth = 3;
      ctx.stroke(path);
      ctx.setLineDash([]);

      ctx.save();
      ctx.translate(track.xs[start.index]!, track.ys[start.index]!);
      ctx.rotate(startAngle);
      const sq = 9;
      const half = HALF_WIDTH - KERB_WIDTH;
      for (let row = 0; row < 2; row++) {
        for (let k = -half; k < half; k += sq) {
          ctx.fillStyle = (Math.floor((k + half) / sq) + row) % 2 === 0 ? '#eef2ff' : '#0b0e20';
          ctx.fillRect(-sq + row * sq, k, sq, Math.min(sq, half - k));
        }
      }
      ctx.restore();

      const next = track.gates[sim.laps.nextGate]!;
      if (sim.laps.nextGate !== 0 && sim.phase === 'racing') {
        const nx = -track.ty[next.index]!;
        const ny = track.tx[next.index]!;
        const cx = track.xs[next.index]!;
        const cy = track.ys[next.index]!;
        ctx.strokeStyle = 'rgba(56, 232, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(cx + nx * (HALF_WIDTH - KERB_WIDTH), cy + ny * (HALF_WIDTH - KERB_WIDTH));
        ctx.lineTo(cx - nx * (HALF_WIDTH - KERB_WIDTH), cy - ny * (HALF_WIDTH - KERB_WIDTH));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      for (let i = 0; i < sim.skidCount; i++) {
        ctx.fillRect(sim.skidX[i]! - 2.5, sim.skidY[i]! - 2.5, 5, 5);
      }

      const ghost = sim.ghostPose();
      if (ghost) {
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.translate(ghost.x, ghost.y);
        ctx.rotate(ghost.heading);
        drawSprite(ctx, ghostCar, -CAR_LENGTH / 2, -CAR_WIDTH / 2);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(sim.car.x, sim.car.y);
      ctx.rotate(sim.car.heading);
      drawSprite(ctx, car, -CAR_LENGTH / 2, -CAR_WIDTH / 2);
      ctx.restore();
      ctx.restore();

      panel(ctx, 10, 10, 178, 88, 'rgba(255, 210, 63, 0.5)');
      text(ctx, `LAP ${sim.currentLap}/${LAPS}`, 24, 28, 12, PALETTE.yellow, 'left', 800);
      text(ctx, formatRaceTime(sim.phase === 'countdown' ? 0 : sim.lapElapsed * 1000), 24, 56, 26, PALETTE.white, 'left', 800);
      text(
        ctx,
        sim.bestLap > 0 ? `BEST LAP ${formatRaceTime(sim.bestLap * 1000)}` : 'BEST LAP –',
        24,
        84,
        11,
        PALETTE.dim,
        'left',
        700,
      );

      drawSprite(ctx, minimap, CR_WIDTH - MAP_W - 10, 10);
      const ghostMap = sim.ghostPose();
      if (ghostMap) {
        ctx.fillStyle = 'rgba(201, 212, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(CR_WIDTH - MAP_W - 10 + ghostMap.x * mapScale + mapOx, 10 + ghostMap.y * mapScale + mapOy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = PALETTE.yellow;
      ctx.beginPath();
      ctx.arc(CR_WIDTH - MAP_W - 10 + sim.car.x * mapScale + mapOx, 10 + sim.car.y * mapScale + mapOy, 4, 0, Math.PI * 2);
      ctx.fill();

      const strip = TOUCH_BRAKE_Y;
      ctx.globalAlpha = sim.touchActive ? 0.95 : 0.6;
      ctx.fillStyle = 'rgba(7, 10, 24, 0.55)';
      ctx.fillRect(0, strip, CR_WIDTH, CR_HEIGHT - strip);
      ctx.strokeStyle = 'rgba(255, 77, 109, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, strip);
      ctx.lineTo(CR_WIDTH, strip);
      ctx.stroke();
      text(ctx, 'HOLD HERE: BRAKE / REVERSE', CR_WIDTH / 2, strip + 24, 12, PALETTE.red, 'center', 800);
      const barY = strip + 66;
      const left = CR_WIDTH / 2 - TOUCH_STEER_RANGE;
      const right = CR_WIDTH / 2 + TOUCH_STEER_RANGE;
      ctx.strokeStyle = 'rgba(238, 242, 255, 0.35)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(left, barY);
      ctx.lineTo(right, barY);
      ctx.stroke();
      ctx.lineCap = 'butt';
      text(ctx, '◀ STEER', left - 12, barY, 12, PALETTE.dim, 'right', 800);
      text(ctx, 'STEER ▶', right + 12, barY, 12, PALETTE.dim, 'left', 800);
      const steerX = CR_WIDTH / 2 + sim.car.steer * TOUCH_STEER_RANGE;
      ctx.fillStyle = sim.touchActive ? PALETTE.cyan : PALETTE.yellow;
      ctx.beginPath();
      ctx.arc(steerX, barY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (sim.touchActive) {
        ctx.strokeStyle = sim.controls.brake > 0 ? PALETTE.red : PALETTE.cyan;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sim.touchX, sim.controls.brake > 0 ? strip : strip - 70);
        ctx.lineTo(sim.touchX, sim.controls.brake > 0 ? CR_HEIGHT : strip);
        ctx.stroke();
      }

      text(ctx, `${Math.round(sim.speed * 0.4)} km/h`, CR_WIDTH - 16, strip - 18, 16, PALETTE.white, 'right', 800);

      if (sim.phase === 'racing') {
        if (sim.wrongWay) text(ctx, 'WRONG WAY', CR_WIDTH / 2, 140, 26, PALETTE.red, 'center', 900);
        else if (sim.offTrack) text(ctx, 'OFF TRACK', CR_WIDTH / 2, 140, 20, PALETTE.orange, 'center', 900);
      }
      if (sim.phase === 'countdown') {
        drawBanner(ctx, String(sim.countdownValue), 'Get ready', CR_WIDTH / 2, 250, 1, PALETTE.yellow);
        if (sim.phaseTime < 3) {
          text(ctx, 'Hold above the strip to drive · steer toward your finger', CR_WIDTH / 2, strip - 52, 13, PALETTE.white, 'center', 600);
          text(ctx, 'Keyboard: arrows or WASD', CR_WIDTH / 2, strip - 32, 13, PALETTE.dim, 'center', 600);
        }
      } else if (sim.phase === 'racing' && sim.phaseTime < 0.9) {
        drawBanner(ctx, 'GO!', null, CR_WIDTH / 2, 250, Math.min(1, (0.9 - sim.phaseTime) * 3), PALETTE.green);
      } else if (sim.phase === 'finished') {
        drawBanner(ctx, 'Finish!', formatRaceTime(sim.finishTime * 1000), CR_WIDTH / 2, 250, Math.min(1, sim.phaseTime * 3), PALETTE.yellow);
      } else if (sim.phase === 'dnf') {
        drawBanner(ctx, 'Did not finish', 'Time limit reached', CR_WIDTH / 2, 250, 1, PALETTE.red);
      }
      const sinceLap = sim.lapTimes.length > 0 ? sim.lapElapsed : 99;
      if (sim.phase === 'racing' && sinceLap < 2.4) {
        const title = sim.currentLap === LAPS ? 'Final lap' : `Lap ${sim.currentLap}`;
        drawBanner(
          ctx,
          title,
          `${sim.lastLapWasBest ? 'Best lap! ' : ''}${formatRaceTime(sim.lastLap * 1000)}`,
          CR_WIDTH / 2,
          250,
          Math.min(1, (2.4 - sinceLap) * 2),
          sim.lastLapWasBest ? PALETTE.green : PALETTE.cyan,
        );
      }
    },
  };
}
