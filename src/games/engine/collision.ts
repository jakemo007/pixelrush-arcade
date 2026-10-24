/** Geometry helpers shared by the games. All functions are pure. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Contact {
  /** Unit normal pointing from the rectangle towards the circle. */
  nx: number;
  ny: number;
  /** Overlap distance along the normal. */
  depth: number;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Shrinks a rectangle on each side (negative values grow it). */
export function insetRect(r: Rect, dx: number, dy: number = dx): Rect {
  return { x: r.x + dx, y: r.y + dy, w: Math.max(0, r.w - dx * 2), h: Math.max(0, r.h - dy * 2) };
}

export function circlesOverlap(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy < r * r;
}

export function circleRectOverlap(cx: number, cy: number, r: number, rect: Rect): boolean {
  const px = clamp(cx, rect.x, rect.x + rect.w);
  const py = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - px;
  const dy = cy - py;
  return dx * dx + dy * dy < r * r;
}

/**
 * Contact information for a circle touching a rectangle, or null.
 * If the circle's centre is inside the rectangle (deep penetration) the
 * normal points out through the nearest side, so the circle is always pushed
 * back out instead of getting stuck.
 */
export function circleRectContact(cx: number, cy: number, r: number, rect: Rect): Contact | null {
  const px = clamp(cx, rect.x, rect.x + rect.w);
  const py = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - px;
  const dy = cy - py;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;

  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    return { nx: dx / d, ny: dy / d, depth: r - d };
  }

  const left = cx - rect.x;
  const right = rect.x + rect.w - cx;
  const top = cy - rect.y;
  const bottom = rect.y + rect.h - cy;
  const min = Math.min(left, right, top, bottom);
  if (min === top) return { nx: 0, ny: -1, depth: top + r };
  if (min === bottom) return { nx: 0, ny: 1, depth: bottom + r };
  if (min === left) return { nx: -1, ny: 0, depth: left + r };
  return { nx: 1, ny: 0, depth: right + r };
}

/** Reflects a velocity about a unit normal. */
export function reflect(vx: number, vy: number, nx: number, ny: number): { vx: number; vy: number } {
  const dot = vx * nx + vy * ny;
  return { vx: vx - 2 * dot * nx, vy: vy - 2 * dot * ny };
}
