export interface SliceClock {
  sliceEnd: number;
}

export type ThinkMode = 'worker' | 'main-thread';

export interface ThinkerOptions<Req, Res> {
  createWorker?: () => Worker;
  search: (req: Req, clock: SliceClock) => Generator<void, Res, void>;
  workerTimeoutMs: (req: Req) => number;
  sliceMs?: number;
  maxBlockMs?: number;
}

interface WorkerReply<Res> {
  id: number;
  res?: Res;
  error?: string;
}

export class Thinker<Req, Res> {
  private worker: Worker | null = null;
  private workerBroken = false;
  private current = 0;
  private sliceTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private busyInWorker = false;
  private disposed = false;
  lastMode: ThinkMode | null = null;

  constructor(private readonly options: ThinkerOptions<Req, Res>) {}

  think(req: Req, onResult: (res: Res, mode: ThinkMode) => void): void {
    if (this.disposed) return;
    this.cancel();
    const id = ++this.current;
    const worker = this.getWorker();
    if (!worker) {
      this.runSliced(id, req, onResult);
      return;
    }
    this.lastMode = 'worker';
    this.busyInWorker = true;
    const fallBack = () => {
      if (id !== this.current) return;
      this.markWorkerBroken();
      this.runSliced(id, req, onResult);
    };
    worker.onmessage = (e: MessageEvent<WorkerReply<Res>>) => {
      const reply = e.data;
      if (!reply || reply.id !== this.current || reply.id !== id) return;
      this.busyInWorker = false;
      this.clearWatchdog();
      if (reply.error !== undefined || reply.res === undefined) fallBack();
      else onResult(reply.res, 'worker');
    };
    worker.onerror = (e) => {
      e.preventDefault?.();
      fallBack();
    };
    worker.onmessageerror = () => fallBack();
    this.watchdog = setTimeout(fallBack, this.options.workerTimeoutMs(req));
    try {
      worker.postMessage({ id, req });
    } catch {
      fallBack();
    }
  }

  cancel(): void {
    this.current++;
    if (this.sliceTimer !== null) {
      clearTimeout(this.sliceTimer);
      this.sliceTimer = null;
    }
    this.clearWatchdog();
    if (this.busyInWorker && this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.busyInWorker = false;
  }

  dispose(): void {
    this.cancel();
    this.disposed = true;
    this.worker?.terminate();
    this.worker = null;
  }

  private clearWatchdog(): void {
    if (this.watchdog !== null) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
  }

  private markWorkerBroken(): void {
    this.workerBroken = true;
    this.busyInWorker = false;
    this.clearWatchdog();
    this.worker?.terminate();
    this.worker = null;
  }

  private getWorker(): Worker | null {
    if (this.workerBroken || !this.options.createWorker || typeof Worker === 'undefined') return null;
    if (this.worker) return this.worker;
    try {
      this.worker = this.options.createWorker();
      return this.worker;
    } catch {
      this.workerBroken = true;
      return null;
    }
  }

  private runSliced(id: number, req: Req, onResult: (res: Res, mode: ThinkMode) => void): void {
    this.lastMode = 'main-thread';
    const sliceMs = this.options.sliceMs ?? 30;
    const maxBlockMs = this.options.maxBlockMs ?? 90;
    const clock: SliceClock = { sliceEnd: Infinity };
    const gen = this.options.search(req, clock);
    const step = () => {
      this.sliceTimer = null;
      if (id !== this.current || this.disposed) return;
      const start = performance.now();
      clock.sliceEnd = start + maxBlockMs;
      for (;;) {
        const r = gen.next();
        if (r.done) {
          onResult(r.value, 'main-thread');
          return;
        }
        if (performance.now() - start >= sliceMs) break;
      }
      this.sliceTimer = setTimeout(step, 0);
    };
    this.sliceTimer = setTimeout(step, 0);
  }
}
