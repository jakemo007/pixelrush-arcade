export const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const PALETTE = {
  bg: '#070a18',
  cyan: '#38e8ff',
  violet: '#a78bfa',
  magenta: '#ff4fd8',
  yellow: '#ffd23f',
  orange: '#ff8a3d',
  red: '#ff4d6d',
  green: '#4dffb5',
  white: '#eef2ff',
  dim: '#8c96c8',
} as const;

const SPRITE_SCALE = 2;

export interface Sprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pad: number;
}

export function createSprite(
  width: number,
  height: number,
  pad: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((width + pad * 2) * SPRITE_SCALE);
  canvas.height = Math.ceil((height + pad * 2) * SPRITE_SCALE);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(SPRITE_SCALE, SPRITE_SCALE);
    ctx.translate(pad, pad);
    draw(ctx);
  }
  return { canvas, width, height, pad };
}

export function drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, w = sprite.width, h = sprite.height): void {
  const sx = w / sprite.width;
  const sy = h / sprite.height;
  ctx.drawImage(
    sprite.canvas,
    x - sprite.pad * sx,
    y - sprite.pad * sy,
    (sprite.width + sprite.pad * 2) * sx,
    (sprite.height + sprite.pad * 2) * sy,
  );
}

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function neonLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2): void {
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = width * 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function drawBanner(ctx: CanvasRenderingContext2D, text: string, sub: string | null, cx: number, cy: number, alpha: number, color: string): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 34px ${FONT_STACK}`;
  const width = Math.max(ctx.measureText(text).width, sub ? 200 : 0) + 64;
  ctx.fillStyle = 'rgba(7, 10, 24, 0.78)';
  roundRectPath(ctx, cx - width / 2, cy - (sub ? 44 : 32), width, sub ? 88 : 64, 14);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.white;
  ctx.fillText(text, cx, sub ? cy - 10 : cy);
  if (sub) {
    ctx.font = `600 17px ${FONT_STACK}`;
    ctx.fillStyle = color;
    ctx.fillText(sub, cx, cy + 22);
  }
  ctx.restore();
}
