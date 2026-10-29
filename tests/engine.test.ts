import { describe, expect, it } from 'vitest';
import { circleRectContact, circlesOverlap, clamp, insetRect, rectsOverlap, reflect } from '@/games/engine/collision';
import { InputManager } from '@/games/engine/input';
import { createFixedStepLoop } from '@/games/engine/loop';
import { ParticlePool } from '@/games/engine/particles';
import { transition, type GameStatus, type StatusEvent } from '@/games/engine/status';
import { createRng, deriveSeed, hashString, pick, pickWeighted, randomInt } from '@/lib/utils/random';

describe('game status transitions', () => {
  it('follows the documented lifecycle', () => {
    expect(transition('ready', 'start')).toBe('playing');
    expect(transition('playing', 'pause')).toBe('paused');
    expect(transition('paused', 'resume')).toBe('playing');
    expect(transition('playing', 'end')).toBe('over');
    expect(transition('over', 'restart')).toBe('playing');
    expect(transition('paused', 'restart')).toBe('playing');
  });

  it('rejects invalid transitions', () => {
    const invalid: [GameStatus, StatusEvent][] = [
      ['ready', 'pause'],
      ['ready', 'restart'],
      ['ready', 'end'],
      ['playing', 'start'],
      ['playing', 'restart'],
      ['paused', 'start'],
      ['over', 'pause'],
      ['over', 'resume'],
      ['over', 'start'],
    ];
    for (const [status, event] of invalid) expect(transition(status, event)).toBeNull();
  });
});

describe('InputManager', () => {
  const bindings = { jump: ['Space', 'ArrowUp'], left: ['ArrowLeft'] } as const;

  it('latches a press until the next snapshot, even if released first', () => {
    const input = new InputManager(bindings);
    input.keyDown('Space', false);
    input.keyUp('Space');
    const snap = input.snapshot();
    expect(snap.actions.jump).toEqual({ held: false, pressed: true, released: true });
    expect(input.snapshot().actions.jump.pressed).toBe(false);
  });

  it('ignores keyboard auto-repeat', () => {
    const input = new InputManager(bindings);
    input.keyDown('Space', false);
    input.snapshot();
    input.keyDown('Space', true);
    input.keyDown('Space', true);
    const snap = input.snapshot();
    expect(snap.actions.jump.pressed).toBe(false);
    expect(snap.actions.jump.held).toBe(true);
  });

  it('treats several keys bound to one action as one held action', () => {
    const input = new InputManager(bindings);
    input.keyDown('Space', false);
    input.keyDown('ArrowUp', false);
    input.keyUp('Space');
    const snap = input.snapshot();
    expect(snap.actions.jump.held).toBe(true);
    expect(snap.actions.jump.released).toBe(false);
  });

  it('reports which keys belong to the game', () => {
    const input = new InputManager(bindings);
    expect(input.keyDown('KeyZ', false)).toBe(false);
    expect(input.keyDown('ArrowLeft', false)).toBe(true);
    expect(input.isBound('ArrowUp')).toBe(true);
  });

  it('releaseAll clears held keys and pointers', () => {
    const input = new InputManager(bindings);
    input.keyDown('ArrowLeft', false);
    input.pointerDown(1, 10, 20);
    input.releaseAll();
    const snap = input.snapshot();
    expect(snap.actions.left.held).toBe(false);
    expect(snap.actions.left.released).toBe(true);
    expect(snap.pointer.down).toBe(false);
  });

  it('tracks pointer presses and touch release', () => {
    const input = new InputManager(bindings);
    input.pointerDown(7, 50, 60);
    let snap = input.snapshot();
    expect(snap.pointer).toMatchObject({ down: true, pressed: true, x: 50, y: 60, inside: true });
    input.pointerUp(7, true);
    snap = input.snapshot();
    expect(snap.pointer).toMatchObject({ down: false, released: true, inside: false });
  });
});

describe('fixed-step loop', () => {
  function fakeFrames() {
    let pending: ((t: number) => void) | null = null;
    return {
      requestFrame: (cb: (t: number) => void) => {
        pending = cb;
        return 1;
      },
      cancelFrame: () => {
        pending = null;
      },
      fire(time: number) {
        const cb = pending;
        pending = null;
        cb?.(time);
      },
    };
  }

  it('runs a fixed number of steps for the elapsed time and renders once per frame', () => {
    const frames = fakeFrames();
    let steps = 0;
    let renders = 0;
    const loop = createFixedStepLoop({
      step: () => steps++,
      render: () => renders++,
      stepSeconds: 0.01,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
      now: () => 0,
    });
    loop.start();
    frames.fire(50);
    expect(steps).toBe(5);
    expect(renders).toBe(1);
    frames.fire(55);
    expect(steps).toBe(5);
    frames.fire(60);
    expect(steps).toBe(6);
  });

  it('clamps very long frames instead of catching up', () => {
    const frames = fakeFrames();
    let steps = 0;
    const loop = createFixedStepLoop({
      step: () => steps++,
      render: () => undefined,
      stepSeconds: 0.01,
      maxFrameSeconds: 0.1,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
      now: () => 0,
    });
    loop.start();
    frames.fire(10_000);
    expect(steps).toBe(10);
  });

  it('stops cleanly, including from inside a step', () => {
    const frames = fakeFrames();
    let steps = 0;
    const loop = createFixedStepLoop({
      step: () => {
        steps++;
        loop.stop();
      },
      render: () => undefined,
      stepSeconds: 0.01,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
      now: () => 0,
    });
    loop.start();
    frames.fire(100);
    expect(steps).toBe(1);
    expect(loop.running).toBe(false);
    frames.fire(200);
    expect(steps).toBe(1);
  });

  it('reports errors and stops instead of throwing from the frame callback', () => {
    const frames = fakeFrames();
    let caught: unknown = null;
    const loop = createFixedStepLoop({
      step: () => {
        throw new Error('boom');
      },
      render: () => undefined,
      onError: (e) => (caught = e),
      stepSeconds: 0.01,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
      now: () => 0,
    });
    loop.start();
    expect(() => frames.fire(100)).not.toThrow();
    expect(caught).toBeInstanceOf(Error);
    expect(loop.running).toBe(false);
  });
});

describe('collision helpers', () => {
  it('detects rectangle overlap, excluding touching edges', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('insets and clamps', () => {
    expect(insetRect({ x: 0, y: 0, w: 10, h: 10 }, 2)).toEqual({ x: 2, y: 2, w: 6, h: 6 });
    expect(insetRect({ x: 0, y: 0, w: 2, h: 2 }, 5).w).toBe(0);
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });

  it('detects circle overlap', () => {
    expect(circlesOverlap(0, 0, 5, 9, 0, 5)).toBe(true);
    expect(circlesOverlap(0, 0, 5, 11, 0, 5)).toBe(false);
  });

  it('returns a side normal for a circle touching a rectangle', () => {
    const rect = { x: 0, y: 0, w: 20, h: 10 };
    const below = circleRectContact(10, 14, 5, rect)!;
    expect(below.nx).toBeCloseTo(0);
    expect(below.ny).toBeCloseTo(1);
    expect(below.depth).toBeCloseTo(1);
    expect(circleRectContact(10, 30, 5, rect)).toBeNull();
  });

  it('pushes out through the nearest side when the centre is inside', () => {
    const rect = { x: 0, y: 0, w: 100, h: 20 };
    const c = circleRectContact(50, 2, 5, rect)!;
    expect(c).toEqual({ nx: 0, ny: -1, depth: 7 });
  });

  it('reflects velocity about a normal', () => {
    expect(reflect(3, 4, 0, -1)).toEqual({ vx: 3, vy: -4 });
  });
});

describe('random utilities', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(123);
    const b = createRng(123);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hashes strings stably', () => {
    expect(hashString('pixelrush')).toBe(hashString('pixelrush'));
    expect(hashString('a')).not.toBe(hashString('b'));
    expect(deriveSeed(1, 'fx')).not.toBe(deriveSeed(1, 'drops'));
  });

  it('picks within bounds and respects zero weights', () => {
    const rng = createRng(9);
    for (let i = 0; i < 200; i++) {
      const n = randomInt(rng, 2, 4);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(4);
      expect(pickWeighted(rng, [['a', 0], ['b', 1]] as const)).toBe('b');
      expect(['x', 'y']).toContain(pick(rng, ['x', 'y']));
    }
  });
});

describe('ParticlePool', () => {
  it('never grows beyond its capacity', () => {
    const pool = new ParticlePool(20, createRng(1));
    for (let i = 0; i < 50; i++) pool.burst({ x: 0, y: 0, count: 10, color: '#fff', speed: 100 });
    expect(pool.items.length).toBe(20);
    expect(pool.aliveCount).toBeLessThanOrEqual(20);
    for (let i = 0; i < 200; i++) pool.update(0.01);
    expect(pool.aliveCount).toBe(0);
  });
});
