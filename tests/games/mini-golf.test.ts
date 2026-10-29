import { describe, expect, it } from 'vitest';
import { pointInPolygon } from '@/games/arcade-kit/geometry';
import { compileHole, HOLES, TOTAL_PAR, type CompiledHole } from '@/games/mini-golf/course';
import {
  BALL_R,
  createBall,
  isValidPosition,
  MAX_PUTT_SPEED,
  MAX_ROLL_TIME,
  simulateShot,
  stepBall,
} from '@/games/mini-golf/physics';
import {
  CAP_PENALTY,
  MAX_DRAG,
  MiniGolfSimulation,
  resultName,
  STROKE_CAP,
  type GolfAction,
} from '@/games/mini-golf/simulation';
import { createRng } from '@/lib/utils/random';
import { makeInput, STEP } from '../helpers';

const ACTIONS: readonly GolfAction[] = ['left', 'right', 'up', 'down', 'putt'];
const none = makeInput(ACTIONS);
const holes = HOLES.map(compileHole);
const UP = -Math.PI / 2;

function distanceField(hole: CompiledHole): (x: number, y: number) => number {
  const CELL = 8;
  const W = Math.ceil(540 / CELL);
  const H = Math.ceil(720 / CELL);
  const dist = new Float64Array(W * H).fill(Infinity);
  const walk = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x * CELL + CELL / 2;
      const py = y * CELL + CELL / 2;
      walk[y * W + x] = isValidPosition(hole, px, py) && !hole.water.some((p) => pointInPolygon(px, py, p)) ? 1 : 0;
    }
  }
  const [cx, cy] = hole.def.cup;
  const start = Math.floor(cy / CELL) * W + Math.floor(cx / CELL);
  dist[start] = 0;
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i]!;
    const x = c % W;
    const y = Math.floor(c / W);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (!walk[n] || dist[n] !== Infinity) continue;
      dist[n] = dist[c]! + 1;
      queue.push(n);
    }
  }
  return (x, y) => dist[Math.floor(y / CELL) * W + Math.floor(x / CELL)] ?? Infinity;
}

interface Plan {
  strokes: number;
  shots: { angle: number; power: number }[];
}

function solve(hole: CompiledHole, maxStrokes: number): Plan | null {
  const d = distanceField(hole);
  type Node = { x: number; y: number; strokes: number; t: number; shots: Plan['shots'] };
  let beam: Node[] = [{ x: hole.def.tee[0], y: hole.def.tee[1], strokes: 0, t: 0, shots: [] }];
  for (let depth = 0; depth < maxStrokes; depth++) {
    const next: (Node & { score: number })[] = [];
    for (const n of beam) {
      for (let a = 0; a < 48; a++) {
        for (const power of [0.18, 0.3, 0.42, 0.55, 0.7, 0.85, 1]) {
          const angle = (a / 48) * Math.PI * 2;
          const r = simulateShot(hole, n.x, n.y, angle, power, n.t + 1);
          const strokes = n.strokes + 1 + (r.event === 'water' ? 1 : 0);
          const shots = [...n.shots, { angle, power }];
          if (r.event === 'holed' && strokes <= maxStrokes) return { strokes, shots };
          const x = r.event === 'water' ? n.x : r.x;
          const y = r.event === 'water' ? n.y : r.y;
          next.push({ x, y, strokes, t: n.t + 1 + r.time, shots, score: d(x, y) + strokes * 3 });
        }
      }
    }
    next.sort((u, v) => u.score - v.score);
    beam = next.slice(0, 4);
  }
  return null;
}

describe('Mini Golf course', () => {
  it('has nine holes with sensible pars, tees and cups inside the course', () => {
    expect(HOLES).toHaveLength(9);
    expect(TOTAL_PAR).toBe(HOLES.reduce((s, h) => s + h.par, 0));
    for (const hole of holes) {
      expect(hole.def.par).toBeGreaterThanOrEqual(2);
      expect(hole.def.par).toBeLessThanOrEqual(5);
      expect(isValidPosition(hole, hole.def.tee[0], hole.def.tee[1])).toBe(true);
      expect(isValidPosition(hole, hole.def.cup[0], hole.def.cup[1])).toBe(true);
    }
    const all = holes.flatMap((h) => [...h.movers.map((m) => m.kind), ...(h.sand.length ? ['sand'] : []), ...(h.water.length ? ['water'] : []), ...(h.slopes.length ? ['slope'] : [])]);
    for (const feature of ['windmill', 'slider', 'sand', 'water', 'slope']) expect(all).toContain(feature);
    expect(holes.some((h) => h.segments.some((s) => s.ax !== s.bx && s.ay !== s.by))).toBe(true);
  });
});

describe('Mini Golf physics', () => {
  it('reflects off a wall with restitution and keeps most of the sliding speed', () => {
    const hole = holes[0]!;
    const ball = createBall(250, 100 + BALL_R);
    ball.vx = 100;
    ball.vy = -400;
    stepBall(hole, ball, 0, 0.03);
    expect(ball.vy).toBeGreaterThan(0);
    expect(ball.vy).toBeLessThan(400 * 0.8);
    expect(ball.vx).toBeGreaterThan(80);
    expect(ball.y - BALL_R).toBeGreaterThanOrEqual(90 - 1e-6);
  });

  it('never tunnels through a wall at maximum power, even on long frames', () => {
    const zig = holes[6]!;
    for (const dt of [1 / 120, 1 / 30, 0.1]) {
      const ball = createBall(200, 540);
      ball.vy = -MAX_PUTT_SPEED;
      for (let i = 0; i < 30; i++) {
        stepBall(zig, ball, i * dt, dt);
        expect(ball.y).toBeGreaterThan(490);
        expect(isValidPosition(zig, ball.x, ball.y)).toBe(true);
      }
    }
    const first = holes[0]!;
    const ball = createBall(270, 400);
    ball.vx = -MAX_PUTT_SPEED * 0.7;
    ball.vy = -MAX_PUTT_SPEED * 0.7;
    for (let i = 0; i < 400; i++) {
      stepBall(first, ball, i * STEP, STEP);
      expect(isValidPosition(first, ball.x, ball.y)).toBe(true);
    }
  });

  it('always brings the ball to a stop', () => {
    const r = simulateShot(holes[0]!, 270, 620, UP + 0.3, 0.4, 0);
    expect(r.event).toBe('stopped');
    expect(r.time).toBeLessThan(5);
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const hole = holes[i % holes.length]!;
      const res = simulateShot(hole, hole.def.tee[0], hole.def.tee[1], rng() * Math.PI * 2, rng(), rng() * 10);
      expect(res.time).toBeLessThanOrEqual(MAX_ROLL_TIME + 0.01);
      if (res.event !== 'water') expect(isValidPosition(hole, res.x, res.y)).toBe(true);
    }
  });

  it('drops a slow ball into the cup but lets a fast one lip out', () => {
    const hole = holes[0]!;
    const slow = createBall(270, 230);
    slow.vy = -220;
    let holed = false;
    for (let i = 0; i < 120 && !holed; i++) holed = stepBall(hole, slow, 0, STEP).event === 'holed';
    expect(holed).toBe(true);

    const fast = createBall(270, 230);
    fast.vy = -800;
    let fastHoled = false;
    for (let i = 0; i < 12; i++) fastHoled ||= stepBall(hole, fast, 0, STEP).event === 'holed';
    expect(fastHoled).toBe(false);
    expect(fast.y).toBeLessThan(170 - 13);
  });

  it('pushes a resting ball out of the way of a moving obstacle', () => {
    const sim = new MiniGolfSimulation({ seed: 1, modifier: null });
    (sim as unknown as { startHole(i: number): void }).startHole(4);
    sim.ball = createBall(270 + 50, 390);
    let nudged = false;
    for (let i = 0; i < 600 && !nudged; i++) {
      sim.update(STEP, none);
      nudged = sim.phase === 'rolling';
    }
    expect(nudged).toBe(true);
    expect(sim.strokes).toBe(0);
    for (let i = 0; i < 1200 && sim.phase === 'rolling'; i++) sim.update(STEP, none);
    expect(isValidPosition(sim.hole, sim.ball.x, sim.ball.y)).toBe(true);
  });
});

describe('Mini Golf rules', () => {
  it('names results relative to par', () => {
    expect(resultName(1, 3)).toBe('Hole in one!');
    expect(resultName(2, 3)).toBe('Birdie!');
    expect(resultName(3, 3)).toBe('Par');
    expect(resultName(5, 3)).toBe('Double bogey');
    expect(resultName(7, 3)).toBe('+4');
  });

  it('putts with a drag: direction opposite the drag, power from its length', () => {
    const sim = new MiniGolfSimulation({ seed: 1, modifier: null });
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, pressed: true, moved: true, x: 270, y: 500 }));
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, moved: true, x: 270, y: 500 + MAX_DRAG / 2 }));
    expect(sim.power).toBeCloseTo(0.5, 2);
    expect(sim.aimAngle).toBeCloseTo(UP, 5);
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: false, released: true, x: 270, y: 500 + MAX_DRAG / 2 }));
    expect(sim.strokes).toBe(1);
    expect(sim.phase).toBe('rolling');
    expect(sim.ball.vy).toBeLessThan(0);
  });

  it('cancels a tiny drag without taking a stroke', () => {
    const sim = new MiniGolfSimulation({ seed: 1, modifier: null });
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, pressed: true, x: 270, y: 500 }));
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: false, released: true, x: 272, y: 502 }));
    expect(sim.strokes).toBe(0);
    expect(sim.phase).toBe('aim');
  });

  it('aims and putts with the keyboard', () => {
    const sim = new MiniGolfSimulation({ seed: 1, modifier: null });
    const angle = sim.aimAngle;
    for (let i = 0; i < 60; i++) sim.update(STEP, makeInput(ACTIONS, { right: { held: true } }));
    expect(sim.aimAngle).toBeGreaterThan(angle);
    for (let i = 0; i < 120; i++) sim.update(STEP, makeInput(ACTIONS, { up: { held: true } }));
    expect(sim.power).toBe(1);
    sim.update(STEP, makeInput(ACTIONS, { putt: { pressed: true, held: true } }));
    expect(sim.strokes).toBe(1);
    expect(Math.hypot(sim.ball.vx, sim.ball.vy)).toBeGreaterThan(MAX_PUTT_SPEED * 0.9);
  });

  it('adds a penalty stroke for water and returns the ball to where it was putted', () => {
    const sim = new MiniGolfSimulation({ seed: 1, modifier: null });
    (sim as unknown as { startHole(i: number): void }).startHole(3);
    const [tx, ty] = HOLES[3]!.tee;
    sim.putt(UP, 0.8);
    let splashed = false;
    for (let i = 0; i < 1200 && sim.phase !== 'aim'; i++) {
      sim.update(STEP, none);
      splashed ||= sim.phase === 'splash';
    }
    expect(splashed).toBe(true);
    expect(sim.strokes).toBe(2);
    expect(sim.ball.x).toBeCloseTo(tx);
    expect(sim.ball.y).toBeCloseTo(ty);
    expect(sim.score).toBe(2);
  });

  it('ends a hole at the stroke cap with a penalty', () => {
    const sim = new MiniGolfSimulation({ seed: 1, modifier: null });
    for (let s = 0; s < STROKE_CAP; s++) {
      expect(sim.phase).toBe('aim');
      sim.putt(0, 0.06);
      for (let i = 0; i < 1200 && sim.phase === 'rolling'; i++) sim.update(STEP, none);
    }
    expect(sim.phase).toBe('scorecard');
    expect(sim.card[0]).toBe(STROKE_CAP + CAP_PENALTY);
    expect(sim.score).toBe(STROKE_CAP + CAP_PENALTY);
    for (let i = 0; i < 1200 && sim.phase === 'scorecard'; i++) sim.update(STEP, none);
    expect(sim.holeIndex).toBe(1);
    expect(sim.strokes).toBe(0);
  });

  it('can complete every hole within par + 3 (search over angles and powers)', { timeout: 60_000 }, () => {
    for (const hole of holes) {
      const plan = solve(hole, hole.def.par + 3);
      expect(plan, hole.def.name).not.toBeNull();
      expect(plan!.strokes).toBeLessThanOrEqual(hole.def.par + 3);
    }
  });

  it('plays a full round to a win, scoring the total strokes', { timeout: 60_000 }, () => {
    const sim = new MiniGolfSimulation({ seed: 2, modifier: null });
    const rng = createRng(5);
    for (let guard = 0; guard < 200 && !sim.outcome; guard++) {
      if (sim.phase === 'aim') {
        const [cx, cy] = sim.hole.def.cup;
        const dx = cx - sim.ball.x;
        const dy = cy - sim.ball.y;
        sim.putt(Math.atan2(dy, dx) + (rng() - 0.5) * 0.8, Math.min(1, 0.25 + Math.hypot(dx, dy) / 900 + rng() * 0.3));
      }
      for (let i = 0; i < 120 * 20 && sim.phase !== 'aim' && !sim.outcome; i++) sim.update(STEP, none);
    }
    expect(sim.outcome).toBe('won');
    expect(sim.card).toHaveLength(9);
    expect(sim.score).toBe(sim.card.reduce((a, b) => a + b, 0));
    expect(sim.card.every((s) => s >= 1 && s <= STROKE_CAP + CAP_PENALTY)).toBe(true);
  });
});
