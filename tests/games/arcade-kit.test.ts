import { describe, expect, it } from 'vitest';
import { DragAim } from '@/games/arcade-kit/aim';
import { SimEvents } from '@/games/arcade-kit/events';
import {
  bounce,
  circleCircleContact,
  circleSegmentContact,
  closestParam,
  pointInPolygon,
  polygonEdges,
  rectPolygon,
  segmentCrossing,
} from '@/games/arcade-kit/geometry';
import { approach, clamp, holdRamp, smoothing, wrapAngle } from '@/games/arcade-kit/math';
import { TOKENS } from '@/games/arcade-kit/tokens';
import type { PointerSnapshot } from '@/games/engine/types';

const pointer = (p: Partial<PointerSnapshot>): PointerSnapshot => ({
  inside: true,
  x: 0,
  y: 0,
  down: false,
  pressed: false,
  released: false,
  moved: false,
  ...p,
});

describe('arcade-kit math', () => {
  it('clamps, wraps angles and approaches targets', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-Math.PI * 1.5)).toBeCloseTo(Math.PI / 2);
    expect(approach(0, 10, 3)).toBe(3);
    expect(approach(10, 0, 30)).toBe(0);
    expect(smoothing(5, 0)).toBe(0);
    expect(smoothing(5, 100)).toBeCloseTo(1);
  });

  it('ramps a held key from slow to full speed', () => {
    expect(holdRamp(0)).toBeCloseTo(0.25);
    expect(holdRamp(10)).toBe(1);
    expect(holdRamp(0.3)).toBeGreaterThan(holdRamp(0.1));
  });
});

describe('arcade-kit geometry', () => {
  const wall = { ax: 0, ay: 0, bx: 100, by: 0 };

  it('finds the closest point on a segment, clamped to its ends', () => {
    expect(closestParam(50, 10, 0, 0, 100, 0)).toBeCloseTo(0.5);
    expect(closestParam(-20, 5, 0, 0, 100, 0)).toBe(0);
    expect(closestParam(150, 5, 0, 0, 100, 0)).toBe(1);
  });

  it('reports circle-segment contacts with an outward normal and depth', () => {
    const c = circleSegmentContact(40, 6, 8, wall)!;
    expect(c.nx).toBeCloseTo(0);
    expect(c.ny).toBeCloseTo(1);
    expect(c.depth).toBeCloseTo(2);
    expect(circleSegmentContact(40, 9, 8, wall)).toBeNull();
    const cap = circleSegmentContact(104, -3, 8, wall)!;
    expect(cap.nx).toBeGreaterThan(0);
    expect(cap.ny).toBeLessThan(0);
    expect(circleSegmentContact(40, 10, 8, wall, 4)).not.toBeNull();
    expect(circleSegmentContact(40, 0, 8, wall)!.depth).toBe(8);
  });

  it('reports circle-circle contacts', () => {
    const c = circleCircleContact(10, 0, 5, 0, 0, 6)!;
    expect(c.nx).toBeCloseTo(1);
    expect(c.depth).toBeCloseTo(1);
    expect(circleCircleContact(20, 0, 5, 0, 0, 6)).toBeNull();
  });

  it('bounces only a velocity that moves into the surface', () => {
    const v = { vx: 30, vy: -100 };
    const impact = bounce(v, 0, 1, 0.5, 1);
    expect(impact).toBe(100);
    expect(v.vy).toBeCloseTo(50);
    expect(v.vx).toBeCloseTo(30);
    const away = { vx: 0, vy: 40 };
    expect(bounce(away, 0, 1, 0.5)).toBe(0);
    expect(away.vy).toBe(40);
  });

  it('detects segment crossings and their position', () => {
    expect(segmentCrossing(0, -10, 0, 10, -5, 0, 5, 0)).toBeCloseTo(0.5);
    expect(segmentCrossing(0, -10, 0, -1, -5, 0, 5, 0)).toBe(-1);
    expect(segmentCrossing(0, 0, 10, 0, 0, 1, 10, 1)).toBe(-1);
  });

  it('tests points against polygons and builds edges', () => {
    const square = rectPolygon(0, 0, 10, 10);
    expect(pointInPolygon(5, 5, square)).toBe(true);
    expect(pointInPolygon(15, 5, square)).toBe(false);
    const edges = polygonEdges(square);
    expect(edges).toHaveLength(4);
    expect(edges[3]).toEqual({ ax: 0, ay: 10, bx: 0, by: 0 });
    const L = [0, 0, 20, 0, 20, 10, 10, 10, 10, 20, 0, 20];
    expect(pointInPolygon(15, 15, L)).toBe(false);
    expect(pointInPolygon(5, 15, L)).toBe(true);
  });
});

describe('arcade-kit drag aiming', () => {
  it('aims opposite the drag with power from its length, and fires on release', () => {
    const aim = new DragAim({ maxDrag: 100, minPower: 0.1 });
    expect(aim.update(pointer({ x: 200, y: 200, down: true, pressed: true }), true)).toBe('aiming');
    expect(aim.update(pointer({ x: 150, y: 200, down: true, moved: true }), true)).toBe('aiming');
    expect(aim.power).toBeCloseTo(0.5);
    expect(aim.angle).toBeCloseTo(0);
    aim.update(pointer({ x: 100, y: 300, down: true, moved: true }), true);
    expect(aim.power).toBe(1);
    expect(aim.update(pointer({ x: 100, y: 300, released: true, inside: false }), true)).toBe('fire');
    expect(aim.active).toBe(false);
  });

  it('cancels a tiny drag or a quick tap, and respects canStart', () => {
    const aim = new DragAim({ maxDrag: 100, minPower: 0.1 });
    expect(aim.update(pointer({ x: 10, y: 10, pressed: true, released: true }), true)).toBe('cancel');
    expect(aim.update(pointer({ x: 10, y: 10, down: true, pressed: true }), false)).toBe('idle');
    aim.update(pointer({ x: 10, y: 10, down: true, pressed: true }), true);
    expect(aim.update(pointer({ x: 13, y: 10, released: true }), true)).toBe('cancel');
  });
});

describe('arcade-kit events and tokens', () => {
  it('drains queued cues and announcements once', () => {
    const events = new SimEvents();
    expect(events.drainCues()).toEqual([]);
    events.cue('pop');
    events.say('Hello');
    expect(events.drainCues()).toEqual(['pop']);
    expect(events.drainCues()).toEqual([]);
    expect(events.drainAnnouncements()).toEqual(['Hello']);
    expect(events.drainAnnouncements()).toEqual([]);
  });

  it('gives every token a distinct shape and colour', () => {
    expect(new Set(TOKENS.map((t) => t.shape)).size).toBe(TOKENS.length);
    expect(new Set(TOKENS.map((t) => t.color)).size).toBe(TOKENS.length);
  });
});
