/**
 * Fixed-timestep game loop driven by requestAnimationFrame.
 *
 * Simulations always advance in equal steps (default 1/120 s) regardless of
 * the display refresh rate, which keeps physics and collisions stable and
 * makes seeded runs reproducible. Long frames (tab switches, slow devices)
 * are clamped so the game never tries to "catch up" seconds at once.
 */

export interface LoopOptions {
  step: (dt: number) => void;
  render: () => void;
  onError?: (error: unknown) => void;
  stepSeconds?: number;
  maxFrameSeconds?: number;
  maxStepsPerFrame?: number;
  // Injectable for tests.
  requestFrame?: (cb: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
  now?: () => number;
}

export interface Loop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

export const DEFAULT_STEP = 1 / 120;

export function createFixedStepLoop(options: LoopOptions): Loop {
  const stepSeconds = options.stepSeconds ?? DEFAULT_STEP;
  const maxFrame = options.maxFrameSeconds ?? 0.1;
  const maxSteps = options.maxStepsPerFrame ?? 24;
  const requestFrame = options.requestFrame ?? ((cb) => requestAnimationFrame(cb));
  const cancelFrame = options.cancelFrame ?? ((h) => cancelAnimationFrame(h));
  const now = options.now ?? (() => performance.now());

  let running = false;
  let handle = 0;
  let last = 0;
  let accumulator = 0;

  const frame = (time: number) => {
    if (!running) return;
    try {
      let elapsed = (time - last) / 1000;
      last = time;
      if (!(elapsed > 0)) elapsed = 0;
      if (elapsed > maxFrame) elapsed = maxFrame;
      accumulator += elapsed;

      let steps = 0;
      // The epsilon absorbs floating-point drift so 50 ms is always exactly 5 x 10 ms steps.
      while (accumulator + 1e-9 >= stepSeconds && steps < maxSteps && running) {
        options.step(stepSeconds);
        accumulator -= stepSeconds;
        steps++;
      }
      if (steps >= maxSteps) accumulator = 0;

      options.render();
    } catch (error) {
      running = false;
      options.onError?.(error);
      return;
    }
    if (running) handle = requestFrame(frame);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = now();
      accumulator = 0;
      handle = requestFrame(frame);
    },
    stop() {
      running = false;
      cancelFrame(handle);
    },
    get running() {
      return running;
    },
  };
}
