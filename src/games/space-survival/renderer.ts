import { createSprite, drawBanner, drawSprite, FONT_STACK, PALETTE, type Sprite } from '../engine/canvas';
import { drawParticles } from '../engine/particles';
import type { RenderEnv, Renderer } from '../engine/types';
import { createRng } from '@/lib/utils/random';
import { SS_HEIGHT, SS_WIDTH, type EnemyKind, type SpaceSurvivalSimulation } from './simulation';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

function makeStars(): Star[] {
  const rng = createRng(99);
  const layers = [
    { count: 60, speed: 18, size: 1, alpha: 0.45 },
    { count: 35, speed: 45, size: 1.6, alpha: 0.7 },
    { count: 14, speed: 110, size: 2.2, alpha: 0.9 },
  ];
  return layers.flatMap((l) =>
    Array.from({ length: l.count }, () => ({
      x: rng() * SS_WIDTH,
      y: rng() * SS_HEIGHT,
      size: l.size,
      speed: l.speed,
      alpha: l.alpha * (0.6 + rng() * 0.4),
    })),
  );
}

function makeNebula(): Sprite {
  return createSprite(SS_WIDTH, SS_HEIGHT, 0, (ctx) => {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, SS_WIDTH, SS_HEIGHT);
    const blobs: [number, number, number, string][] = [
      [90, 180, 220, 'rgba(161, 75, 255, 0.16)'],
      [400, 420, 260, 'rgba(255, 79, 216, 0.10)'],
      [180, 620, 200, 'rgba(56, 232, 255, 0.08)'],
    ];
    for (const [x, y, r, color] of blobs) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SS_WIDTH, SS_HEIGHT);
    }
  });
}

function makeShip(): Sprite {
  return createSprite(36, 40, 12, (ctx) => {
    ctx.shadowColor = PALETTE.cyan;
    ctx.shadowBlur = 12;
    const g = ctx.createLinearGradient(0, 0, 0, 40);
    g.addColorStop(0, '#c6fbff');
    g.addColorStop(1, '#1aa9c9');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(36, 34);
    ctx.lineTo(24, 30);
    ctx.lineTo(18, 40);
    ctx.lineTo(12, 30);
    ctx.lineTo(0, 34);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#071226';
    ctx.beginPath();
    ctx.ellipse(18, 17, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function polygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number, rotation: number): void {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

const ENEMY_LOOK: Record<EnemyKind, { color: string; fill: string; sides: number; rotation: number }> = {
  drifter: { color: PALETTE.magenta, fill: '#3a0b33', sides: 4, rotation: 0 },
  weaver: { color: PALETTE.violet, fill: '#24124f', sides: 6, rotation: Math.PI / 6 },
  charger: { color: PALETTE.orange, fill: '#3a1a08', sides: 3, rotation: Math.PI / 2 },
  gunship: { color: PALETTE.red, fill: '#3a0b18', sides: 8, rotation: Math.PI / 8 },
};

function makeEnemy(kind: EnemyKind, radius: number, flash: boolean): Sprite {
  const look = ENEMY_LOOK[kind];
  const d = radius * 2;
  return createSprite(d, d, 10, (ctx) => {
    ctx.shadowColor = look.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = flash ? '#ffffff' : look.fill;
    polygon(ctx, radius, radius, radius, look.sides, look.rotation);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = flash ? '#ffffff' : look.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = look.color;
    polygon(ctx, radius, radius, radius * 0.35, look.sides, look.rotation);
    ctx.fill();
  });
}

function makeOrb(color: string, r: number): Sprite {
  return createSprite(r * 2, r * 2, 8, (ctx) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r, r, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function createSpaceSurvivalRenderer({ ctx, reducedMotion }: RenderEnv): Renderer<SpaceSurvivalSimulation> {
  const nebula = makeNebula();
  const stars = makeStars();
  const ship = makeShip();
  const enemySprites = new Map<string, Sprite>();
  for (const kind of Object.keys(ENEMY_LOOK) as EnemyKind[]) {
    const r = { drifter: 14, weaver: 16, charger: 13, gunship: 22 }[kind];
    enemySprites.set(kind, makeEnemy(kind, r, false));
    enemySprites.set(`${kind}:flash`, makeEnemy(kind, r, true));
  }
  const enemyOrb = makeOrb(PALETTE.magenta, 6);
  const repair = makeOrb(PALETTE.green, 11);
  const twin = makeOrb(PALETTE.yellow, 11);

  return {
    render(sim) {
      ctx.save();
      if (!reducedMotion && sim.shake > 0) {
        const m = sim.shake * 7;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }
      drawSprite(ctx, nebula, 0, 0);

      for (const s of stars) {
        const y = (s.y + sim.time * s.speed) % SS_HEIGHT;
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = PALETTE.white;
        ctx.fillRect(s.x, y, s.size, s.size * (s.speed > 100 ? 3 : 1));
      }
      ctx.globalAlpha = 1;

      for (const p of sim.pickups) {
        const sprite = p.kind === 'repair' ? repair : twin;
        const bob = Math.sin(p.age * 5) * 2;
        drawSprite(ctx, sprite, p.x - 11, p.y - 11 + bob);
        ctx.fillStyle = '#071226';
        ctx.font = `900 11px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.kind === 'repair' ? '+' : '2x', p.x, p.y + bob + 0.5);
      }

      for (const e of sim.enemies) {
        if (e.kind === 'charger' && e.state === 'aim') {
          ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(e.stateTimer * 18));
          ctx.strokeStyle = PALETTE.orange;
          ctx.setLineDash([6, 8]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.aimX, e.aimY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        const sprite = enemySprites.get(e.flash > 0.4 ? `${e.kind}:flash` : e.kind);
        if (!sprite) continue;
        const spin = e.kind === 'weaver' ? 0 : e.kind === 'drifter' ? e.age * 1.5 : 0;
        if (spin) {
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.rotate(spin);
          drawSprite(ctx, sprite, -e.r, -e.r);
          ctx.restore();
        } else {
          drawSprite(ctx, sprite, e.x - e.r, e.y - e.r);
        }
      }

      ctx.fillStyle = PALETTE.cyan;
      for (const b of sim.bullets) {
        ctx.globalAlpha = 0.35;
        ctx.fillRect(b.x - 3, b.y - 6, 6, 18);
        ctx.globalAlpha = 1;
        ctx.fillRect(b.x - 1.5, b.y - 6, 3, 14);
      }
      for (const b of sim.enemyBullets) drawSprite(ctx, enemyOrb, b.x - b.r, b.y - b.r);

      if (!sim.dying) {
        const blink = sim.invulnerable > 0 && Math.floor(sim.invulnerable * 12) % 2 === 0;
        if (!blink) {
          const flame = 8 + (reducedMotion ? 2 : Math.random() * 6);
          ctx.fillStyle = PALETTE.orange;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.moveTo(sim.shipX - 5, sim.shipY + 16);
          ctx.lineTo(sim.shipX, sim.shipY + 16 + flame);
          ctx.lineTo(sim.shipX + 5, sim.shipY + 16);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
          const tilt = Math.max(-0.25, Math.min(0.25, sim.shipVx / 1800));
          ctx.save();
          ctx.translate(sim.shipX, sim.shipY);
          ctx.rotate(tilt);
          drawSprite(ctx, ship, -18, -20);
          ctx.restore();
        }
        if (sim.twinTimer > 0) {
          ctx.strokeStyle = 'rgba(255, 210, 63, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sim.shipX, sim.shipY, 26, 0, Math.PI * 2 * Math.min(1, sim.twinTimer / 10));
          ctx.stroke();
        }
      }

      drawParticles(ctx, sim.particles);

      if (sim.waveBanner > 0) {
        drawBanner(ctx, `Wave ${sim.wave}`, 'Enemies are getting faster', SS_WIDTH / 2, 300, Math.min(1, sim.waveBanner), PALETTE.magenta);
      }

      if (sim.damageFlash > 0) {
        const g = ctx.createRadialGradient(SS_WIDTH / 2, SS_HEIGHT / 2, SS_HEIGHT * 0.2, SS_WIDTH / 2, SS_HEIGHT / 2, SS_HEIGHT * 0.7);
        g.addColorStop(0, 'rgba(255, 77, 109, 0)');
        g.addColorStop(1, `rgba(255, 77, 109, ${(reducedMotion ? 0.25 : 0.5) * sim.damageFlash})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, SS_WIDTH, SS_HEIGHT);
      }
      ctx.restore();
    },
  };
}
