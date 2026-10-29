export class PlayClock {
  private accumulated = 0;
  private since: number | null = null;

  get running(): boolean {
    return this.since !== null;
  }

  start(now: number): void {
    if (this.since === null) this.since = now;
  }

  stop(now: number): void {
    if (this.since === null) return;
    this.accumulated += Math.max(0, now - this.since);
    this.since = null;
  }

  read(now: number): number {
    return Math.round(this.accumulated + (this.since === null ? 0 : Math.max(0, now - this.since)));
  }
}
