import { createSprite, FONT_STACK, PALETTE, roundRectPath, type Sprite } from '../engine/canvas';
import type { TokenShape, TokenStyle } from './tokens';

export interface BackdropOptions {
  top?: string;
  bottom?: string;
  grid?: string;
  step?: number;
}

export function createBackdrop(width: number, height: number, options: BackdropOptions = {}): Sprite {
  const { top = '#0b0e2b', bottom = '#05060f', grid = 'rgba(167, 139, 250, 0.07)', step = 36 } = options;
  return createSprite(width, height, 0, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, width, height);
    if (step > 0) {
      g.strokeStyle = grid;
      g.lineWidth = 1;
      g.beginPath();
      for (let x = 0; x <= width; x += step) {
        g.moveTo(x + 0.5, 0);
        g.lineTo(x + 0.5, height);
      }
      for (let y = 0; y <= height; y += step) {
        g.moveTo(0, y + 0.5);
        g.lineTo(width, y + 0.5);
      }
      g.stroke();
    }
  });
}

export function traceShape(ctx: CanvasRenderingContext2D, shape: TokenShape, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  switch (shape) {
    case 'circle':
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case 'diamond':
      ctx.moveTo(cx, cy - r * 1.08);
      ctx.lineTo(cx + r * 0.86, cy);
      ctx.lineTo(cx, cy + r * 1.08);
      ctx.lineTo(cx - r * 0.86, cy);
      ctx.closePath();
      break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 === 0 ? r * 1.08 : r * 0.48;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      break;
    case 'triangle':
      ctx.moveTo(cx, cy - r * 1.05);
      ctx.lineTo(cx + r * 1.0, cy + r * 0.78);
      ctx.lineTo(cx - r * 1.0, cy + r * 0.78);
      ctx.closePath();
      break;
    case 'square':
      roundRectPath(ctx, cx - r * 0.82, cy - r * 0.82, r * 1.64, r * 1.64, r * 0.22);
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
  }
}

export function paintGem(ctx: CanvasRenderingContext2D, style: TokenStyle, cx: number, cy: number, r: number, glow = 10): void {
  ctx.save();
  ctx.shadowColor = style.color;
  ctx.shadowBlur = glow;
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, style.light);
  g.addColorStop(0.45, style.color);
  g.addColorStop(1, style.dark);
  ctx.fillStyle = g;
  traceShape(ctx, style.shape, cx, cy, r);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1.5, r * 0.09);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  traceShape(ctx, style.shape, cx - r * 0.12, cy - r * 0.16, r * 0.42);
  ctx.fill();
  ctx.restore();
}

export function paintBubble(ctx: CanvasRenderingContext2D, style: TokenStyle, cx: number, cy: number, r: number, glow = 8): void {
  ctx.save();
  ctx.shadowColor = style.color;
  ctx.shadowBlur = glow;
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  g.addColorStop(0, style.light);
  g.addColorStop(0.55, style.color);
  g.addColorStop(1, style.dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(7, 10, 24, 0.72)';
  traceShape(ctx, style.shape, cx, cy + r * 0.04, r * 0.38);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.38, cy - r * 0.45, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  weight = 700,
): void {
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke: string = PALETTE.violet, alpha = 0.82): void {
  ctx.fillStyle = `rgba(7, 10, 24, ${alpha})`;
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function pill(ctx: CanvasRenderingContext2D, value: string, cx: number, cy: number, color: string, size = 13): void {
  ctx.font = `800 ${size}px ${FONT_STACK}`;
  const w = ctx.measureText(value).width + size * 1.4;
  const h = size * 1.8;
  ctx.fillStyle = 'rgba(7, 10, 24, 0.85)';
  roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, cx, cy + 0.5);
}

export function powerColor(power: number): string {
  if (power < 0.5) return PALETTE.green;
  if (power < 0.8) return PALETTE.yellow;
  return PALETTE.red;
}

export function powerMeter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, power: number): void {
  ctx.fillStyle = 'rgba(7, 10, 24, 0.8)';
  roundRectPath(ctx, x - 3, y - 3, w + 6, h + 6, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(238, 242, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const fill = Math.max(0, Math.min(1, power)) * h;
  if (fill > 0) {
    ctx.fillStyle = powerColor(power);
    roundRectPath(ctx, x, y + h - fill, w, fill, 3);
    ctx.fill();
  }
}

export function dottedPath(
  ctx: CanvasRenderingContext2D,
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  count: number,
  color: string,
  radius = 2.5,
  fade = true,
): void {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = fade ? 0.9 - (0.75 * i) / Math.max(1, count) : 0.85;
    ctx.beginPath();
    ctx.arc(xs[i]!, ys[i]!, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function glowDot(radius: number, inner: string, outer: string, glow: string, blur = 12): Sprite {
  const d = radius * 2;
  return createSprite(d, d, blur, (g) => {
    g.shadowColor = glow;
    g.shadowBlur = blur;
    const grad = g.createRadialGradient(radius * 0.7, radius * 0.7, radius * 0.1, radius, radius, radius);
    grad.addColorStop(0, inner);
    grad.addColorStop(1, outer);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(radius, radius, radius, 0, Math.PI * 2);
    g.fill();
  });
}
