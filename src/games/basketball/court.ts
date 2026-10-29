import { bounce, circleCircleContact, circleSegmentContact, type Segment } from '../arcade-kit/geometry';

export const BB_W = 540;
export const BB_H = 720;
export const FLOOR_Y = 640;
export const BALL_R = 9;
export const RIM_Y = 452;
export const RIM_R = 3;
export const FRONT_RIM_X = 448;
export const BACK_RIM_X = 488;
export const HOOP_X = (FRONT_RIM_X + BACK_RIM_X) / 2;
export const OPENING_LEFT = FRONT_RIM_X + RIM_R;
export const OPENING_RIGHT = BACK_RIM_X - RIM_R;
export const BOARD: Segment = { ax: 500, ay: RIM_Y - 82, bx: 500, by: RIM_Y + 16 };
export const BOARD_THICKNESS = 3;
export const NET_DEPTH = 42;
export const RELEASE_Y = FLOOR_Y - 128;
export const THREE_POINT_DISTANCE = 300;
export const GRAVITY = 980;
export const MIN_SHOT_SPEED = 320;
export const MAX_SHOT_SPEED = 920;
const AIR_DAMPING = 0.05;
const RIM_RESTITUTION = 0.55;
const BOARD_RESTITUTION = 0.62;
const FLOOR_RESTITUTION = 0.6;
const MAX_SUBSTEP = 3;
const RIM_XS = [FRONT_RIM_X, BACK_RIM_X] as const;

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface FlightEvents {
  rim: number;
  board: number;
  floor: number;
  scored: boolean;
  fromBelow: boolean;
}

export function shotSpeed(power: number): number {
  return MIN_SHOT_SPEED + (MAX_SHOT_SPEED - MIN_SHOT_SPEED) * Math.max(0, Math.min(1, power));
}

function crossingX(x0: number, y0: number, x1: number, y1: number): number {
  if (y1 === y0) return NaN;
  const t = (RIM_Y - y0) / (y1 - y0);
  return x0 + (x1 - x0) * t;
}

export function stepFlight(ball: Ball, dt: number, inNet: boolean, collide = true): FlightEvents {
  const ev: FlightEvents = { rim: 0, board: 0, floor: 0, scored: false, fromBelow: false };
  const speed = Math.hypot(ball.vx, ball.vy) + GRAVITY * dt;
  const steps = Math.max(1, Math.ceil((speed * dt) / MAX_SUBSTEP));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    ball.vy += GRAVITY * h;
    const damp = 1 - AIR_DAMPING * h;
    ball.vx *= damp;
    ball.vy *= damp;
    if (inNet) {
      ball.vx *= 1 - 6 * h;
      ball.vy *= 1 - 2.5 * h;
      ball.vx += (HOOP_X - ball.x) * 8 * h;
    }
    const x0 = ball.x;
    const y0 = ball.y;
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;

    if (y0 < RIM_Y && ball.y >= RIM_Y) {
      const cx = crossingX(x0, y0, ball.x, ball.y);
      if (cx > OPENING_LEFT && cx < OPENING_RIGHT) ev.scored = true;
    } else if (y0 > RIM_Y && ball.y <= RIM_Y) {
      const cx = crossingX(x0, y0, ball.x, ball.y);
      if (cx > OPENING_LEFT && cx < OPENING_RIGHT) ev.fromBelow = true;
    }
    if (!collide) continue;

    for (const rx of RIM_XS) {
      const c = circleCircleContact(ball.x, ball.y, BALL_R, rx, RIM_Y, RIM_R);
      if (!c) continue;
      ball.x += c.nx * c.depth;
      ball.y += c.ny * c.depth;
      ev.rim = Math.max(ev.rim, bounce(ball, c.nx, c.ny, RIM_RESTITUTION, 0.9));
    }
    const b = circleSegmentContact(ball.x, ball.y, BALL_R, BOARD, BOARD_THICKNESS);
    if (b) {
      ball.x += b.nx * b.depth;
      ball.y += b.ny * b.depth;
      ev.board = Math.max(ev.board, bounce(ball, b.nx, b.ny, BOARD_RESTITUTION, 0.92));
    }
    if (ball.y + BALL_R > FLOOR_Y) {
      ball.y = FLOOR_Y - BALL_R;
      if (ball.vy > 0) {
        ev.floor = Math.max(ev.floor, ball.vy);
        ball.vy = -ball.vy * FLOOR_RESTITUTION;
        ball.vx *= 0.85;
        if (Math.abs(ball.vy) < 40) ball.vy = 0;
      }
    }
  }
  return ev;
}

export function inNetZone(ball: Ball): boolean {
  return ball.y > RIM_Y && ball.y < RIM_Y + NET_DEPTH && ball.x > FRONT_RIM_X - 4 && ball.x < BACK_RIM_X + 4;
}
