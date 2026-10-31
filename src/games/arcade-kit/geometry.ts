export interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export interface CircleContact {
  nx: number;
  ny: number;
  depth: number;
  px: number;
  py: number;
}

export function segment(ax: number, ay: number, bx: number, by: number): Segment {
  return { ax, ay, bx, by };
}

export function closestParam(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return 0;
  const t = ((px - ax) * dx + (py - ay) * dy) / len2;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function distSqToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const t = closestParam(px, py, ax, ay, bx, by);
  const qx = ax + (bx - ax) * t - px;
  const qy = ay + (by - ay) * t - py;
  return qx * qx + qy * qy;
}

export function circleSegmentContact(cx: number, cy: number, r: number, s: Segment, thickness = 0): CircleContact | null {
  const t = closestParam(cx, cy, s.ax, s.ay, s.bx, s.by);
  const px = s.ax + (s.bx - s.ax) * t;
  const py = s.ay + (s.by - s.ay) * t;
  const dx = cx - px;
  const dy = cy - py;
  const reach = r + thickness;
  const d2 = dx * dx + dy * dy;
  if (d2 >= reach * reach) return null;
  const d = Math.sqrt(d2);
  if (d > 1e-9) return { nx: dx / d, ny: dy / d, depth: reach - d, px, py };
  const sx = s.bx - s.ax;
  const sy = s.by - s.ay;
  const sl = Math.hypot(sx, sy) || 1;
  return { nx: -sy / sl, ny: sx / sl, depth: reach, px, py };
}

export function circleCircleContact(ax: number, ay: number, ar: number, bx: number, by: number, br: number): CircleContact | null {
  const dx = ax - bx;
  const dy = ay - by;
  const reach = ar + br;
  const d2 = dx * dx + dy * dy;
  if (d2 >= reach * reach) return null;
  const d = Math.sqrt(d2);
  if (d > 1e-9) return { nx: dx / d, ny: dy / d, depth: reach - d, px: bx + (dx / d) * br, py: by + (dy / d) * br };
  return { nx: 0, ny: -1, depth: reach, px: bx, py: by - br };
}

export interface Velocity {
  vx: number;
  vy: number;
}

export function bounce(v: Velocity, nx: number, ny: number, restitution: number, tangentKeep = 1): number {
  const vn = v.vx * nx + v.vy * ny;
  if (vn >= 0) return 0;
  const tx = v.vx - vn * nx;
  const ty = v.vy - vn * ny;
  v.vx = tx * tangentKeep - vn * restitution * nx;
  v.vy = ty * tangentKeep - vn * restitution * ny;
  return -vn;
}

export function segmentCrossing(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  q1x: number,
  q1y: number,
  q2x: number,
  q2y: number,
): number {
  const rx = p2x - p1x;
  const ry = p2y - p1y;
  const sx = q2x - q1x;
  const sy = q2y - q1y;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-12) return -1;
  const qpx = q1x - p1x;
  const qpy = q1y - p1y;
  const t = (qpx * sy - qpy * sx) / denom;
  const u = (qpx * ry - qpy * rx) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return -1;
  return t;
}

export function pointInPolygon(x: number, y: number, poly: readonly number[]): boolean {
  let inside = false;
  const n = poly.length >> 1;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i * 2]!;
    const yi = poly[i * 2 + 1]!;
    const xj = poly[j * 2]!;
    const yj = poly[j * 2 + 1]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function polygonEdges(poly: readonly number[]): Segment[] {
  const out: Segment[] = [];
  const n = poly.length >> 1;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    out.push({ ax: poly[i * 2]!, ay: poly[i * 2 + 1]!, bx: poly[j * 2]!, by: poly[j * 2 + 1]! });
  }
  return out;
}

export function rectPolygon(x: number, y: number, w: number, h: number): number[] {
  return [x, y, x + w, y, x + w, y + h, x, y + h];
}
