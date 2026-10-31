import type { RunOptions } from '../modifiers';
import { SoundBoard } from './audio';
import { InputManager } from './input';
import { createFixedStepLoop } from './loop';
import { transition, type GameStatus, type StatusEvent } from './status';
import type { AnyGameDefinition, CounterEvent, GameOutcome, GameStats, HudItem, LevelResult, Simulation } from './types';

export interface HudState {
  score: number;
  items: readonly HudItem[];
  stats: GameStats;
}

export interface RunResult {
  score: number;
  stats: GameStats;
  outcome: GameOutcome;
}

export interface ControllerCallbacks {
  onStatusChange(status: GameStatus): void;
  onHud(hud: HudState): void;
  onGameOver(result: RunResult): void;
  onAnnounce(message: string): void;
  onError(error: unknown): void;
  onLevelResult?(result: LevelResult): void;
  onCounter?(event: CounterEvent): void;
}

export interface MountOptions {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
  stage: HTMLElement;
  getRunOptions(): RunOptions;
  muted: boolean;
  callbacks: ControllerCallbacks;
}

export interface GameController {
  readonly status: GameStatus;
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  refresh(): void;
  showMenu(): void;
  setMuted(muted: boolean): void;
  destroy(): void;
}

export const RESTART_LOCK_MS = 600;
const START_KEYS = new Set(['Space', 'Enter', 'NumpadEnter']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const HUD_INTERVAL_MS = 100;
const MAX_PIXEL_RATIO = 2;

const INTERACTIVE = 'button, a, input, select, textarea, summary, [contenteditable="true"]';

export function mountGame(def: AnyGameDefinition, options: MountOptions): GameController {
  const { canvas, root, stage, callbacks } = options;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('This browser does not support the 2D canvas.');

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const renderer = def.createRenderer({ ctx, reducedMotion });
  const input = new InputManager<string>(def.bindings);
  const sound = new SoundBoard(options.muted);

  let sim: Simulation<string> = def.createSimulation(options.getRunOptions());
  let status: GameStatus = 'ready';
  let overAt = 0;
  let lastHudAt = 0;
  let lastHudKey = '';
  let scaleX = 1;
  let scaleY = 1;
  let destroyed = false;

  const loop = createFixedStepLoop({
    step: stepOnce,
    render: draw,
    onError: fail,
  });

  function setStatus(next: GameStatus): void {
    if (next === status) return;
    status = next;
    root.dataset.status = next;
    callbacks.onStatusChange(next);
  }

  function apply(event: StatusEvent): boolean {
    const next = transition(status, event);
    if (!next) return false;
    setStatus(next);
    return true;
  }

  function draw(): void {
    ctx!.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    renderer.render(sim);
  }

  function emitHud(force: boolean): void {
    const now = performance.now();
    if (!force && now - lastHudAt < HUD_INTERVAL_MS) return;
    lastHudAt = now;
    const hud: HudState = { score: sim.score, items: sim.getHud(), stats: sim.getStats() };
    const key = JSON.stringify(hud);
    if (key === lastHudKey) return;
    lastHudKey = key;
    callbacks.onHud(hud);
  }

  function stepOnce(dt: number): void {
    sim.update(dt, input.snapshot());
    for (const cue of sim.drainCues()) sound.play(cue);
    for (const message of sim.drainAnnouncements()) callbacks.onAnnounce(message);
    if (sim.drainLevelResults) for (const r of sim.drainLevelResults()) callbacks.onLevelResult?.(r);
    if (sim.drainCounters) for (const e of sim.drainCounters()) callbacks.onCounter?.(e);
    emitHud(false);
    if (sim.outcome) finish(sim.outcome);
  }

  function finish(outcome: GameOutcome): void {
    loop.stop();
    input.releaseAll();
    emitHud(true);
    overAt = performance.now();
    apply('end');
    callbacks.onGameOver({ score: sim.score, stats: sim.getStats(), outcome });
  }

  function fail(error: unknown): void {
    loop.stop();
    input.releaseAll();
    callbacks.onError(error);
  }

  function focusStage(): void {
    if (document.activeElement !== stage) stage.focus({ preventScroll: true });
  }

  function start(): void {
    if (status !== 'ready') return;
    sound.unlock();
    apply('start');
    focusStage();
    emitHud(true);
    loop.start();
  }

  function pause(): void {
    if (!apply('pause')) return;
    loop.stop();
    input.releaseAll();
    draw();
  }

  function resume(): void {
    if (status !== 'paused') return;
    sound.unlock();
    apply('resume');
    focusStage();
    loop.start();
  }

  function restart(): void {
    if (!transition(status, 'restart')) return;
    sound.unlock();
    loop.stop();
    input.releaseAll();
    sim = def.createSimulation(options.getRunOptions());
    lastHudKey = '';
    apply('restart');
    focusStage();
    emitHud(true);
    draw();
    loop.start();
  }

  function rebuild(): void {
    sim = def.createSimulation(options.getRunOptions());
    lastHudKey = '';
    emitHud(true);
    draw();
  }

  function refresh(): void {
    if (status !== 'ready') return;
    rebuild();
  }

  function showMenu(): void {
    if (!transition(status, 'menu')) return;
    loop.stop();
    input.releaseAll();
    apply('menu');
    rebuild();
  }

  function ownsKeyEvent(target: EventTarget | null, allowBody: boolean): boolean {
    if (!(target instanceof Element)) return allowBody;
    if (target === document.body || target === document.documentElement) return allowBody;
    if (!root.contains(target)) return false;
    return target === stage || !target.closest(INTERACTIVE);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const code = e.code;

    if (status === 'playing') {
      if (!ownsKeyEvent(e.target, true)) return;
      if (PAUSE_KEYS.has(code)) {
        e.preventDefault();
        if (!e.repeat) pause();
        return;
      }
      if (input.keyDown(code, e.repeat)) e.preventDefault();
      return;
    }

    if (!ownsKeyEvent(e.target, false)) return;
    const isStartKey = START_KEYS.has(code);
    if (e.repeat) {
      if (isStartKey || input.isBound(code)) e.preventDefault();
      return;
    }
    if (status === 'ready' && (isStartKey || code === 'ArrowUp')) {
      e.preventDefault();
      start();
    } else if (status === 'paused' && (isStartKey || PAUSE_KEYS.has(code))) {
      e.preventDefault();
      resume();
    } else if (status === 'over' && (isStartKey || code === 'KeyR')) {
      e.preventDefault();
      if (performance.now() - overAt >= RESTART_LOCK_MS) restart();
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (input.keyUp(e.code) && status === 'playing') e.preventDefault();
  }

  function toLogical(e: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    return { x: ((e.clientX - rect.left) / w) * def.width, y: ((e.clientY - rect.top) / h) * def.height };
  }

  function onPointerDown(e: PointerEvent): void {
    if (status !== 'playing') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    focusStage();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
    }
    const p = toLogical(e);
    input.pointerDown(e.pointerId, p.x, p.y);
  }

  function onPointerMove(e: PointerEvent): void {
    const p = toLogical(e);
    input.pointerMove(p.x, p.y);
  }

  function onPointerUp(e: PointerEvent): void {
    input.pointerUp(e.pointerId, e.pointerType !== 'mouse');
  }

  function onPointerLeave(e: PointerEvent): void {
    if (e.pointerType === 'mouse') input.pointerLeave();
  }

  function autoPause(): void {
    if (status === 'playing') pause();
  }

  function onVisibility(): void {
    if (document.hidden) autoPause();
  }

  function onFocusOut(e: FocusEvent): void {
    const next = e.relatedTarget;
    if (status === 'playing' && next instanceof Node && !root.contains(next)) pause();
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    scaleX = w / def.width;
    scaleY = h / def.height;
    if (!loop.running) draw();
  }

  const preventContextMenu = (e: Event) => e.preventDefault();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', autoPause);
  document.addEventListener('visibilitychange', onVisibility);
  root.addEventListener('focusout', onFocusOut);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('contextmenu', preventContextMenu);

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  if (!resizeObserver) window.addEventListener('resize', resize);

  root.dataset.status = status;
  resize();
  emitHud(true);

  return {
    get status() {
      return status;
    },
    start,
    pause,
    resume,
    restart,
    refresh,
    showMenu,
    setMuted(muted: boolean) {
      sound.setMuted(muted);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      loop.stop();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', autoPause);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      root.removeEventListener('focusout', onFocusOut);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('contextmenu', preventContextMenu);
      resizeObserver?.disconnect();
      sound.destroy();
    },
  };
}
