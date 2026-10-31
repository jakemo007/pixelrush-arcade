import { closestParam } from '../arcade-kit/geometry';

export const HALF_WIDTH = 70;
export const KERB_WIDTH = 9;
export const BARRIER = 124;
export const SAMPLE_SPACING = 10;
export const GATE_COUNT = 10;

export const CONTROL_POINTS: readonly (readonly [number, number])[] = [
  [700, 1700],
  [1300, 1700],
  [1900, 1690],
  [2280, 1560],
  [2400, 1260],
  [2330, 960],
  [2350, 640],
  [2240, 380],
  [1960, 330],
  [1760, 520],
  [1700, 820],
  [1540, 1080],
  [1270, 1160],
  [1030, 1020],
  [980, 740],
  [860, 480],
  [600, 380],
  [360, 500],
  [300, 820],
  [420, 1080],
  [380, 1380],
  [460, 1620],
];

export interface Gate {
  index: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export interface Track {
  xs: Float64Array;
  ys: Float64Array;
  tx: Float64Array;
  ty: Float64Array;
  cum: Float64Array;
  count: number;
  length: number;
  gates: Gate[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export function buildTrack(points: readonly (readonly [number, number])[] = CONTROL_POINTS, spacing = SAMPLE_SPACING): Track {
  const n = points.length;
  const dense: [number, number][] = [];
  const per = 60;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    const p3 = points[(i + 2) % n]!;
    for (let k = 0; k < per; k++) {
      const t = k / per;
      dense.push([catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t)]);
    }
  }
  const outX: number[] = [dense[0]![0]];
  const outY: number[] = [dense[0]![1]];
  let carry = 0;
  const total = dense.length;
  for (let i = 0; i < total; i++) {
    const a = dense[i]!;
    const b = dense[(i + 1) % total]!;
    const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let d = spacing - carry;
    while (d <= segLen) {
      const t = d / segLen;
      outX.push(a[0] + (b[0] - a[0]) * t);
      outY.push(a[1] + (b[1] - a[1]) * t);
      d += spacing;
    }
    carry = segLen - (d - spacing);
  }
  const lastX = outX[outX.length - 1]!;
  const lastY = outY[outY.length - 1]!;
  if (Math.hypot(lastX - outX[0]!, lastY - outY[0]!) < spacing * 0.5) {
    outX.pop();
    outY.pop();
  }

  const count = outX.length;
  const xs = Float64Array.from(outX);
  const ys = Float64Array.from(outY);
  const tx = new Float64Array(count);
  const ty = new Float64Array(count);
  const cum = new Float64Array(count);
  let length = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const prev = (i - 1 + count) % count;
    const next = (i + 1) % count;
    const dx = xs[next]! - xs[prev]!;
    const dy = ys[next]! - ys[prev]!;
    const l = Math.hypot(dx, dy) || 1;
    tx[i] = dx / l;
    ty[i] = dy / l;
    cum[i] = length;
    length += Math.hypot(xs[next]! - xs[i]!, ys[next]! - ys[i]!);
    minX = Math.min(minX, xs[i]!);
    minY = Math.min(minY, ys[i]!);
    maxX = Math.max(maxX, xs[i]!);
    maxY = Math.max(maxY, ys[i]!);
  }

  const gates: Gate[] = [];
  const reach = BARRIER + 30;
  for (let k = 0; k < GATE_COUNT; k++) {
    const index = Math.floor((k * count) / GATE_COUNT);
    const nx = -ty[index]!;
    const ny = tx[index]!;
    gates.push({
      index,
      ax: xs[index]! + nx * reach,
      ay: ys[index]! + ny * reach,
      bx: xs[index]! - nx * reach,
      by: ys[index]! - ny * reach,
    });
  }
  return { xs, ys, tx, ty, cum, count, length, gates, minX, minY, maxX, maxY };
}

export interface Nearest {
  index: number;
  t: number;
  px: number;
  py: number;
  dist: number;
  s: number;
}

function nearestInRange(track: Track, x: number, y: number, from: number, span: number, out: Nearest): void {
  const { xs, ys, count } = track;
  let best = Infinity;
  for (let k = 0; k <= span; k++) {
    const i = (((from + k) % count) + count) % count;
    const j = (i + 1) % count;
    const ax = xs[i]!;
    const ay = ys[i]!;
    const bx = xs[j]!;
    const by = ys[j]!;
    const t = closestParam(x, y, ax, ay, bx, by);
    const px = ax + (bx - ax) * t;
    const py = ay + (by - ay) * t;
    const d2 = (x - px) * (x - px) + (y - py) * (y - py);
    if (d2 < best) {
      best = d2;
      out.index = i;
      out.t = t;
      out.px = px;
      out.py = py;
    }
  }
  out.dist = Math.sqrt(best);
  const segLen = Math.hypot(xs[(out.index + 1) % count]! - xs[out.index]!, ys[(out.index + 1) % count]! - ys[out.index]!);
  out.s = track.cum[out.index]! + segLen * out.t;
}

export function nearestPoint(track: Track, x: number, y: number, hint: number, out: Nearest): Nearest {
  const window = 40;
  if (hint >= 0) {
    nearestInRange(track, x, y, hint - window, window * 2, out);
    if (out.dist <= BARRIER + 40) return out;
  }
  nearestInRange(track, x, y, 0, track.count - 1, out);
  return out;
}

export function emptyNearest(): Nearest {
  return { index: -1, t: 0, px: 0, py: 0, dist: 0, s: 0 };
}

export function pointAt(track: Track, s: number): { x: number; y: number; tx: number; ty: number } {
  const L = track.length;
  const w = ((s % L) + L) % L;
  let lo = 0;
  let hi = track.count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (track.cum[mid]! <= w) lo = mid;
    else hi = mid - 1;
  }
  const i = lo;
  const j = (i + 1) % track.count;
  const segLen = (j === 0 ? L : track.cum[j]!) - track.cum[i]!;
  const t = segLen > 0 ? (w - track.cum[i]!) / segLen : 0;
  return {
    x: track.xs[i]! + (track.xs[j]! - track.xs[i]!) * t,
    y: track.ys[i]! + (track.ys[j]! - track.ys[i]!) * t,
    tx: track.tx[i]!,
    ty: track.ty[i]!,
  };
}
