import { bounce, circleCircleContact, circleSegmentContact, pointInPolygon, type Segment } from '../arcade-kit/geometry';
import { moverSegments, moverVelocity, MOVER_THICKNESS, type CompiledHole } from './course';

export const BALL_R = 8;
export const CUP_R = 13;
export const MAX_PUTT_SPEED = 1000;
export const MAX_BALL_SPEED = 1150;
export const GREEN_DECEL = 330;
export const SAND_DECEL = 1500;
const ROLL_DRAG = 0.2;
export const STOP_SPEED = 8;
export const STOP_TIME = 0.2;
export const CAPTURE_SPEED = 330;
const CUP_PULL = 1600;
const WALL_RESTITUTION = 0.72;
const BUMPER_RESTITUTION = 1.15;
const BUMPER_MIN_SPEED = 260;
const POST_RESTITUTION = 0.55;
const MOVER_RESTITUTION = 0.6;
export const MAX_SUBSTEP = 3;
export const MAX_ROLL_TIME = 14;

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  safeX: number;
  safeY: number;
  slowTime: number;
  rollTime: number;
}

export type StepEvent = 'none' | 'holed' | 'water' | 'stopped';

export interface StepInfo {
  event: StepEvent;
  impact: number;
  bumper: boolean;
}

export function createBall(x: number, y: number): BallState {
  return { x, y, vx: 0, vy: 0, safeX: x, safeY: y, slowTime: 0, rollTime: 0 };
}

const scratch: Segment[] = [];

function inAny(polys: readonly number[][], x: number, y: number): boolean {
  for (const p of polys) if (pointInPolygon(x, y, p)) return true;
  return false;
}

export function isValidPosition(hole: CompiledHole, x: number, y: number): boolean {
  if (!pointInPolygon(x, y, hole.def.outline)) return false;
  for (const s of hole.segments) if (circleSegmentContact(x, y, BALL_R - 0.75, s)) return false;
  return true;
}

export function collideMovers(hole: CompiledHole, ball: BallState, t: number): number {
  let impact = 0;
  for (const m of hole.movers) {
    moverSegments(m, t, scratch);
    for (const s of scratch) {
      const c = circleSegmentContact(ball.x, ball.y, BALL_R, s, MOVER_THICKNESS);
      if (!c) continue;
      ball.x += c.nx * c.depth;
      ball.y += c.ny * c.depth;
      const mv = moverVelocity(m, t, c.px, c.py);
      const rel = { vx: ball.vx - mv.vx, vy: ball.vy - mv.vy };
      const hit = bounce(rel, c.nx, c.ny, MOVER_RESTITUTION);
      ball.vx = rel.vx + mv.vx;
      ball.vy = rel.vy + mv.vy;
      impact = Math.max(impact, hit);
    }
  }
  return impact;
}

export function stepBall(hole: CompiledHole, ball: BallState, t: number, dt: number): StepInfo {
  const info: StepInfo = { event: 'none', impact: 0, bumper: false };
  const speed0 = Math.hypot(ball.vx, ball.vy);
  const steps = Math.max(1, Math.ceil((speed0 * dt) / MAX_SUBSTEP));
  const h = dt / steps;
  const [cupX, cupY] = hole.def.cup;

  for (let i = 0; i < steps; i++) {
    const time = t + i * h;
    for (const slope of hole.slopes) {
      if (pointInPolygon(ball.x, ball.y, slope.poly)) {
        ball.vx += slope.ax * h;
        ball.vy += slope.ay * h;
      }
    }
    const decel = inAny(hole.sand, ball.x, ball.y) ? SAND_DECEL : GREEN_DECEL;
    let speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 0) {
      const next = Math.max(0, speed - decel * h - speed * ROLL_DRAG * h);
      ball.vx *= next / speed;
      ball.vy *= next / speed;
    }

    ball.x += ball.vx * h;
    ball.y += ball.vy * h;

    for (const s of hole.segments) {
      const c = circleSegmentContact(ball.x, ball.y, BALL_R, s);
      if (!c) continue;
      ball.x += c.nx * c.depth;
      ball.y += c.ny * c.depth;
      info.impact = Math.max(info.impact, bounce(ball, c.nx, c.ny, WALL_RESTITUTION, 0.98));
    }
    for (const b of hole.bumpers) {
      const c = circleCircleContact(ball.x, ball.y, BALL_R, b.x, b.y, b.r);
      if (!c) continue;
      ball.x += c.nx * c.depth;
      ball.y += c.ny * c.depth;
      const hit = bounce(ball, c.nx, c.ny, b.bouncy ? BUMPER_RESTITUTION : POST_RESTITUTION);
      if (hit > 0 && b.bouncy) {
        info.bumper = true;
        const out = ball.vx * c.nx + ball.vy * c.ny;
        if (out < BUMPER_MIN_SPEED) {
          ball.vx += (BUMPER_MIN_SPEED - out) * c.nx;
          ball.vy += (BUMPER_MIN_SPEED - out) * c.ny;
        }
      }
      info.impact = Math.max(info.impact, hit);
    }
    info.impact = Math.max(info.impact, collideMovers(hole, ball, time));

    speed = Math.hypot(ball.vx, ball.vy);
    if (speed > MAX_BALL_SPEED) {
      ball.vx *= MAX_BALL_SPEED / speed;
      ball.vy *= MAX_BALL_SPEED / speed;
      speed = MAX_BALL_SPEED;
    }

    if (isValidPosition(hole, ball.x, ball.y)) {
      ball.safeX = ball.x;
      ball.safeY = ball.y;
    } else {
      ball.x = ball.safeX;
      ball.y = ball.safeY;
      ball.vx *= -0.3;
      ball.vy *= -0.3;
    }

    const dx = cupX - ball.x;
    const dy = cupY - ball.y;
    const d = Math.hypot(dx, dy);
    if (d < CUP_R) {
      if (d < CUP_R - 2 && speed < CAPTURE_SPEED) {
        ball.x = cupX;
        ball.y = cupY;
        ball.vx = 0;
        ball.vy = 0;
        info.event = 'holed';
        return info;
      }
      if (d > 1e-6) {
        const pull = CUP_PULL * (1 - d / CUP_R) * h;
        ball.vx += (dx / d) * pull;
        ball.vy += (dy / d) * pull;
      }
    }

    if (inAny(hole.water, ball.x, ball.y)) {
      ball.vx = 0;
      ball.vy = 0;
      info.event = 'water';
      return info;
    }
  }

  ball.rollTime += dt;
  const speed = Math.hypot(ball.vx, ball.vy);
  ball.slowTime = speed < STOP_SPEED ? ball.slowTime + dt : 0;
  if (ball.slowTime >= STOP_TIME || ball.rollTime >= MAX_ROLL_TIME) {
    ball.vx = 0;
    ball.vy = 0;
    info.event = 'stopped';
  }
  return info;
}

export interface ShotResult {
  event: 'holed' | 'water' | 'stopped';
  x: number;
  y: number;
  time: number;
}

export function simulateShot(hole: CompiledHole, x: number, y: number, angle: number, power: number, startTime: number, dt = 1 / 120): ShotResult {
  const ball = createBall(x, y);
  ball.vx = Math.cos(angle) * power * MAX_PUTT_SPEED;
  ball.vy = Math.sin(angle) * power * MAX_PUTT_SPEED;
  let t = startTime;
  for (;;) {
    const info = stepBall(hole, ball, t, dt);
    t += dt;
    if (info.event !== 'none') return { event: info.event, x: ball.x, y: ball.y, time: t - startTime };
  }
}
