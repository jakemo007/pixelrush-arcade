import { BARRIER, HALF_WIDTH, nearestPoint, type Nearest, type Track } from './track';

export const CAR_LENGTH = 38;
export const CAR_WIDTH = 20;
export const CAR_RADIUS = 12;
export const MAX_SPEED = 640;
export const GRASS_MAX = 210;
export const REVERSE_MAX = 170;
const ACCEL = 620;
const BRAKE = 980;
const REVERSE_ACCEL = 320;
const COAST = 80;
const AIR_DRAG = 0.12;
const GRASS_DECEL = 760;
const STEER_RATE = 2.75;
const STEER_RESPONSE = 9;
const GRIP = 9;
const GRASS_GRIP = 4.5;
const LATERAL_LIMIT = 1550;
const GRASS_LATERAL_LIMIT = 900;
const WALL_RESTITUTION = 0.25;
const MIN_STEER_SPEED = 60;
const MAX_STEP_DISTANCE = 6;

export interface Car {
  x: number;
  y: number;
  heading: number;
  vx: number;
  vy: number;
  steer: number;
}

export interface Controls {
  throttle: number;
  brake: number;
  steer: number;
}

export function createCar(x: number, y: number, heading: number): Car {
  return { x, y, heading, vx: 0, vy: 0, steer: 0 };
}

export function forwardSpeed(car: Car): number {
  return car.vx * Math.cos(car.heading) + car.vy * Math.sin(car.heading);
}

export function lateralSpeed(car: Car): number {
  return -car.vx * Math.sin(car.heading) + car.vy * Math.cos(car.heading);
}

export function speedOf(car: Car): number {
  return Math.hypot(car.vx, car.vy);
}

export function steerFactor(vf: number): number {
  const s = Math.abs(vf);
  const low = Math.min(1, s / 140);
  const high = 1 - 0.38 * Math.min(1, Math.max(0, (s - 220) / 420));
  return low * high;
}

export function driveCar(car: Car, c: Controls, onGrass: boolean, dt: number): void {
  const cos = Math.cos(car.heading);
  const sin = Math.sin(car.heading);
  let vf = car.vx * cos + car.vy * sin;
  let vr = -car.vx * sin + car.vy * cos;

  car.steer += (c.steer - car.steer) * Math.min(1, STEER_RESPONSE * dt);

  const top = onGrass ? GRASS_MAX : MAX_SPEED;
  if (c.throttle > 0 && vf >= -5) {
    const k = Math.max(0, vf) / top;
    if (k < 1) vf += ACCEL * c.throttle * (1 - k * k) * dt;
  } else if (c.throttle > 0) {
    vf = Math.min(0, vf + BRAKE * c.throttle * dt);
  }
  if (c.brake > 0) {
    if (vf > 5) vf = Math.max(0, vf - BRAKE * c.brake * dt);
    else vf = Math.max(-REVERSE_MAX, vf - REVERSE_ACCEL * c.brake * dt);
  }
  if (c.throttle === 0 && c.brake === 0) {
    vf = vf > 0 ? Math.max(0, vf - COAST * dt) : Math.min(0, vf + COAST * dt);
  }
  vf -= vf * AIR_DRAG * dt;
  if (onGrass && Math.abs(vf) > GRASS_MAX) {
    vf = vf > 0 ? Math.max(GRASS_MAX, vf - GRASS_DECEL * dt) : Math.min(-GRASS_MAX, vf + GRASS_DECEL * dt);
  }

  const direction = vf >= 0 ? 1 : -1;
  const steerSpeed = Math.max(Math.abs(vf), c.throttle * MIN_STEER_SPEED);
  car.heading += car.steer * STEER_RATE * steerFactor(steerSpeed) * direction * dt;

  const grip = onGrass ? GRASS_GRIP : GRIP;
  const limit = (onGrass ? GRASS_LATERAL_LIMIT : LATERAL_LIMIT) * dt;
  let dvr = -vr * (1 - Math.exp(-grip * dt));
  if (dvr > limit) dvr = limit;
  else if (dvr < -limit) dvr = -limit;
  vr += dvr;

  const nc = Math.cos(car.heading);
  const ns = Math.sin(car.heading);
  car.vx = nc * vf - ns * vr;
  car.vy = ns * vf + nc * vr;
  const speed = Math.hypot(car.vx, car.vy);
  if (speed > MAX_SPEED) {
    car.vx *= MAX_SPEED / speed;
    car.vy *= MAX_SPEED / speed;
  }
}

export function constrainCar(car: Car, track: Track, near: Nearest): number {
  nearestPoint(track, car.x, car.y, near.index, near);
  const limit = BARRIER - CAR_RADIUS;
  if (!(near.dist > limit)) return 0;
  const nx = (car.x - near.px) / near.dist;
  const ny = (car.y - near.py) / near.dist;
  car.x = near.px + nx * limit;
  car.y = near.py + ny * limit;
  near.dist = limit;
  const vn = car.vx * nx + car.vy * ny;
  if (vn <= 0) return 0;
  car.vx -= (1 + WALL_RESTITUTION) * vn * nx;
  car.vy -= (1 + WALL_RESTITUTION) * vn * ny;
  const keep = Math.max(0.55, 1 - vn / 900);
  car.vx *= keep;
  car.vy *= keep;
  return vn;
}

export function moveCar(car: Car, track: Track, near: Nearest, dt: number): number {
  const dist = Math.hypot(car.vx, car.vy) * dt;
  const steps = Math.max(1, Math.ceil(dist / MAX_STEP_DISTANCE));
  const sub = dt / steps;
  let impact = 0;
  for (let i = 0; i < steps; i++) {
    car.x += car.vx * sub;
    car.y += car.vy * sub;
    impact = Math.max(impact, constrainCar(car, track, near));
  }
  if (!Number.isFinite(car.x) || !Number.isFinite(car.y)) {
    car.x = near.px;
    car.y = near.py;
    car.vx = 0;
    car.vy = 0;
  }
  return impact;
}

export function isOffTrack(near: Nearest): boolean {
  return near.dist > HALF_WIDTH;
}
