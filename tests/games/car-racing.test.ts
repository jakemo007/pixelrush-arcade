import { describe, expect, it } from 'vitest';
import { wrapAngle } from '@/games/arcade-kit/math';
import { CAR_RADIUS, createCar, driveCar, forwardSpeed, GRASS_MAX, MAX_SPEED, moveCar } from '@/games/car-racing/car';
import { LapTracker } from '@/games/car-racing/laps';
import {
  CarRacingSimulation,
  COUNTDOWN_SECONDS,
  CR_WIDTH,
  DNF_SECONDS,
  getTrack,
  LAPS,
  TOUCH_BRAKE_Y,
  TOUCH_STEER_RANGE,
  touchSteer,
  type RaceAction,
} from '@/games/car-racing/simulation';
import { BARRIER, emptyNearest, GATE_COUNT, HALF_WIDTH, nearestPoint, pointAt, type Track } from '@/games/car-racing/track';
import { createRng } from '@/lib/utils/random';
import { makeInput, STEP } from '../helpers';

const ACTIONS: readonly RaceAction[] = ['up', 'down', 'left', 'right'];
const none = makeInput(ACTIONS);
const track = getTrack();

function keys(up: boolean, down: boolean, left: boolean, right: boolean) {
  return makeInput(ACTIONS, { up: { held: up }, down: { held: down }, left: { held: left }, right: { held: right } });
}

function autopilot(sim: CarRacingSimulation) {
  const v = forwardSpeed(sim.car);
  const target = pointAt(sim.track, sim.near.s + 130 + v * 0.25);
  const want = Math.atan2(target.y - sim.car.y, target.x - sim.car.x);
  const diff = wrapAngle(want - sim.car.heading);
  const far = pointAt(sim.track, sim.near.s + 260 + v * 0.4);
  const turn = Math.abs(wrapAngle(Math.atan2(far.ty, far.tx) - Math.atan2(target.ty, target.tx)));
  const limit = 640 - turn * 420;
  const brake = v > limit + 30;
  return keys(!brake && v < limit, brake, diff < -0.04, diff > 0.04);
}

function skipCountdown(sim: CarRacingSimulation): void {
  for (let i = 0; i < Math.ceil(COUNTDOWN_SECONDS / STEP) + 1; i++) sim.update(STEP, none);
}

function slide(tracker: LapTracker, t: Track, from: number, count: number): number {
  let i = from;
  const dir = Math.sign(count);
  for (let k = 0; k < Math.abs(count); k++) {
    const a = ((i % t.count) + t.count) % t.count;
    const b = (((i + dir) % t.count) + t.count) % t.count;
    tracker.update(t.xs[a]!, t.ys[a]!, t.xs[b]!, t.ys[b]!);
    i += dir;
  }
  return i;
}

describe('Car Racing track', () => {
  it('keeps separate sections far enough apart for a barrier wall between them', () => {
    const minGap = 2 * BARRIER + 20;
    for (let i = 0; i < track.count; i += 2) {
      for (let j = i + 2; j < track.count; j += 2) {
        const arc = Math.abs(track.cum[i]! - track.cum[j]!);
        if (Math.min(arc, track.length - arc) < 900) continue;
        expect(Math.hypot(track.xs[i]! - track.xs[j]!, track.ys[i]! - track.ys[j]!)).toBeGreaterThan(minGap);
      }
    }
  });

  it('has evenly spaced checkpoint gates across the full width', () => {
    expect(track.gates).toHaveLength(GATE_COUNT);
    expect(track.gates[0]!.index).toBe(0);
    for (const g of track.gates) {
      expect(Math.hypot(g.ax - g.bx, g.ay - g.by)).toBeGreaterThan(2 * BARRIER);
    }
  });

  it('finds the nearest centreline point with or without a hint', () => {
    const p = pointAt(track, 1234);
    const a = nearestPoint(track, p.x + 30, p.y, -1, emptyNearest());
    const b = nearestPoint(track, p.x + 30, p.y, a.index + 5, emptyNearest());
    expect(a.dist).toBeLessThanOrEqual(30.0001);
    expect(b.dist).toBeCloseTo(a.dist, 6);
  });
});

describe('Car Racing lap counting', () => {
  it('counts a lap only after every checkpoint is crossed in order', () => {
    const tracker = new LapTracker(track);
    let i = slide(tracker, track, -5, 10);
    expect(tracker.progress).toBe(0);
    i = slide(tracker, track, i, track.count);
    expect(tracker.lapsDone).toBe(1);
    slide(tracker, track, i, track.count * 2);
    expect(tracker.lapsDone).toBe(3);
  });

  it('does not count a lap when a checkpoint is skipped', () => {
    const tracker = new LapTracker(track);
    slide(tracker, track, -5, 10);
    slide(tracker, track, 5, track.gates[3]!.index + 3 - 5);
    expect(tracker.nextGate).toBe(4);
    slide(tracker, track, track.gates[7]!.index - 3, track.count - (track.gates[7]!.index - 3) + 5);
    expect(tracker.lapsDone).toBe(0);
    expect(tracker.nextGate).toBe(4);
  });

  it('never counts reversing back over the line and crossing it again', () => {
    const tracker = new LapTracker(track);
    slide(tracker, track, -5, 10);
    slide(tracker, track, 5, -10);
    expect(tracker.progress).toBe(-1);
    slide(tracker, track, -5, 10);
    expect(tracker.lapsDone).toBe(0);
    let i = slide(tracker, track, 5, track.count);
    expect(tracker.lapsDone).toBe(1);
    for (let k = 0; k < 3; k++) {
      i = slide(tracker, track, i, -12);
      i = slide(tracker, track, i, 12);
    }
    expect(tracker.lapsDone).toBe(1);
    expect(tracker.progress).toBe(GATE_COUNT);
  });

  it('does not count laps driven the wrong way round', () => {
    const tracker = new LapTracker(track);
    slide(tracker, track, 5, -track.count * 2);
    expect(tracker.lapsDone).toBe(0);
    expect(tracker.progress).toBeLessThan(0);
  });
});

describe('Car Racing physics', () => {
  it('slows the car on the grass', () => {
    const p = pointAt(track, 300);
    const heading = Math.atan2(p.ty, p.tx);
    const nx = -p.ty;
    const ny = p.tx;
    const onGrass = createCar(p.x + nx * (HALF_WIDTH + 25), p.y + ny * (HALF_WIDTH + 25), heading);
    const onRoad = createCar(p.x, p.y, heading);
    const near = emptyNearest();
    const nearRoad = emptyNearest();
    nearestPoint(track, onGrass.x, onGrass.y, -1, near);
    nearestPoint(track, onRoad.x, onRoad.y, -1, nearRoad);
    for (let i = 0; i < 120 * 2.5; i++) {
      driveCar(onGrass, { throttle: 1, brake: 0, steer: 0 }, near.dist > HALF_WIDTH, STEP);
      moveCar(onGrass, track, near, STEP);
      driveCar(onRoad, { throttle: 1, brake: 0, steer: 0 }, nearRoad.dist > HALF_WIDTH, STEP);
      moveCar(onRoad, track, nearRoad, STEP);
    }
    expect(near.dist).toBeGreaterThan(HALF_WIDTH);
    expect(Math.hypot(onGrass.vx, onGrass.vy)).toBeLessThanOrEqual(GRASS_MAX + 1);
    expect(Math.hypot(onRoad.vx, onRoad.vy)).toBeGreaterThan(450);

    onGrass.vx = Math.cos(heading) * MAX_SPEED;
    onGrass.vy = Math.sin(heading) * MAX_SPEED;
    for (let i = 0; i < 120; i++) driveCar(onGrass, { throttle: 1, brake: 0, steer: 0 }, true, STEP);
    expect(Math.hypot(onGrass.vx, onGrass.vy)).toBeLessThanOrEqual(GRASS_MAX + 1);
  });

  it('stops a full-speed car at the barrier', () => {
    const p = pointAt(track, 2000);
    const nx = -p.ty;
    const ny = p.tx;
    const car = createCar(p.x + nx * 80, p.y + ny * 80, Math.atan2(ny, nx));
    car.vx = nx * MAX_SPEED;
    car.vy = ny * MAX_SPEED;
    const near = emptyNearest();
    nearestPoint(track, car.x, car.y, -1, near);
    let impact = 0;
    for (let i = 0; i < 120; i++) impact = Math.max(impact, moveCar(car, track, near, STEP));
    expect(impact).toBeGreaterThan(500);
    const check = nearestPoint(track, car.x, car.y, -1, emptyNearest());
    expect(check.dist).toBeLessThanOrEqual(BARRIER - CAR_RADIUS + 1e-6);
  });

  it('never lets the car escape the barriers or exceed top speed (random input fuzz)', () => {
    let maxDist = 0;
    let maxSpeed = 0;
    let finite = true;
    for (let seed = 1; seed <= 5; seed++) {
      const rng = createRng(seed);
      const sim = new CarRacingSimulation({ seed, modifier: null });
      let input = none;
      for (let i = 0; i < 120 * 60; i++) {
        if (i % 48 === 0) {
          const r = rng();
          input = keys(r < 0.75, r >= 0.75 || rng() < 0.1, rng() < 0.35, rng() < 0.35);
        }
        sim.update(STEP, input);
        finite &&= Number.isFinite(sim.car.x) && Number.isFinite(sim.car.y);
        maxDist = Math.max(maxDist, sim.near.dist);
        maxSpeed = Math.max(maxSpeed, sim.speed);
        if (i % 600 === 0) maxDist = Math.max(maxDist, nearestPoint(track, sim.car.x, sim.car.y, -1, emptyNearest()).dist);
      }
    }
    expect(finite).toBe(true);
    expect(maxDist).toBeLessThanOrEqual(BARRIER - CAR_RADIUS + 1e-6);
    expect(maxDist).toBeGreaterThan(BARRIER - CAR_RADIUS - 1);
    expect(maxSpeed).toBeLessThanOrEqual(MAX_SPEED + 1e-6);
  }, 30_000);

  it('can turn away from a barrier from a standstill', () => {
    const p = pointAt(track, 2600);
    const nx = -p.ty;
    const ny = p.tx;
    const car = createCar(p.x + nx * (BARRIER - CAR_RADIUS), p.y + ny * (BARRIER - CAR_RADIUS), Math.atan2(ny, nx));
    const start = car.heading;
    for (let i = 0; i < 120; i++) driveCar(car, { throttle: 1, brake: 0, steer: 1 }, true, STEP);
    expect(Math.abs(wrapAngle(car.heading - start))).toBeGreaterThan(0.3);
  });
});

describe('Car Racing race flow', () => {
  it('holds the car during the 3-2-1 countdown and keeps a consistent timer', () => {
    const sim = new CarRacingSimulation({ seed: 1, modifier: null });
    const x = sim.car.x;
    for (let i = 0; i < 120 * 2; i++) sim.update(STEP, keys(true, false, true, false));
    expect(sim.phase).toBe('countdown');
    expect(sim.car.x).toBe(x);
    expect(sim.score).toBe(0);
    skipCountdown(sim);
    expect(sim.phase).toBe('racing');
    const t0 = sim.raceTime;
    for (let i = 0; i < 600; i++) sim.update(STEP, keys(true, false, false, false));
    expect(sim.raceTime - t0).toBeCloseTo(600 * STEP, 9);
    expect(sim.score).toBe(Math.round(sim.raceTime * 1000));
    expect(Number.isInteger(sim.score)).toBe(true);
  });

  it('finishes three laps, wins, and freezes the time', { timeout: 20_000 }, () => {
    const sim = new CarRacingSimulation({ seed: 1, modifier: null });
    for (let i = 0; i < 120 * 200 && !sim.outcome; i++) sim.update(STEP, autopilot(sim));
    expect(sim.outcome).toBe('won');
    expect(sim.lapTimes).toHaveLength(LAPS);
    const total = sim.lapTimes.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(sim.finishTime, 6);
    expect(sim.score).toBe(Math.round(sim.finishTime * 1000));
    expect(sim.bestLap).toBe(Math.min(...sim.lapTimes));
    expect(sim.getHud().find((h) => h.id === 'lap')?.value).toBe(`${LAPS}/${LAPS}`);
    const frozen = sim.score;
    for (let i = 0; i < 240; i++) sim.update(STEP, autopilot(sim));
    expect(sim.score).toBe(frozen);
  });

  it('ends as did-not-finish after the time limit', () => {
    const sim = new CarRacingSimulation({ seed: 1, modifier: null });
    skipCountdown(sim);
    sim.raceTime = DNF_SECONDS - STEP / 2;
    sim.update(STEP, none);
    expect(sim.phase).toBe('dnf');
    for (let i = 0; i < 200 && !sim.outcome; i++) sim.update(STEP, none);
    expect(sim.outcome).toBe('lost');
  });

  it('maps touch to throttle, brake and proportional steering', () => {
    expect(touchSteer(CR_WIDTH / 2)).toBe(0);
    expect(touchSteer(CR_WIDTH / 2 + TOUCH_STEER_RANGE)).toBe(1);
    expect(touchSteer(CR_WIDTH / 2 - TOUCH_STEER_RANGE * 2)).toBe(-1);
    expect(touchSteer(CR_WIDTH / 2 + TOUCH_STEER_RANGE / 2)).toBeGreaterThan(0.4);
    const sim = new CarRacingSimulation({ seed: 1, modifier: null });
    skipCountdown(sim);
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, x: CR_WIDTH, y: 300 }));
    expect(sim.controls.throttle).toBe(1);
    expect(sim.controls.steer).toBe(1);
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, x: CR_WIDTH / 2, y: TOUCH_BRAKE_Y + 20 }));
    expect(sim.controls.brake).toBe(1);
    expect(sim.controls.throttle).toBe(0);
  });
});
