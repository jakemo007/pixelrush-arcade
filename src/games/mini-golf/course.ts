import { polygonEdges, rectPolygon, type Segment } from '../arcade-kit/geometry';

export interface Bumper {
  x: number;
  y: number;
  r: number;
  bouncy: boolean;
}

export interface Slope {
  poly: number[];
  ax: number;
  ay: number;
}

export type Mover =
  | { kind: 'windmill'; x: number; y: number; length: number; speed: number; phase: number }
  | { kind: 'slider'; x: number; y: number; halfLength: number; amplitude: number; speed: number };

export interface HoleDef {
  name: string;
  par: number;
  tee: readonly [number, number];
  cup: readonly [number, number];
  outline: number[];
  walls?: number[][];
  bumpers?: Bumper[];
  sand?: number[][];
  water?: number[][];
  slopes?: Slope[];
  movers?: Mover[];
}

export const HOLES: readonly HoleDef[] = [
  {
    name: 'First Putt',
    par: 2,
    tee: [270, 620],
    cup: [270, 170],
    outline: rectPolygon(170, 90, 200, 590),
  },
  {
    name: 'Dogleg',
    par: 3,
    tee: [155, 625],
    cup: [405, 190],
    outline: [70, 680, 240, 680, 240, 290, 470, 290, 470, 90, 140, 90, 70, 160],
  },
  {
    name: 'Bunker',
    par: 3,
    tee: [270, 630],
    cup: [270, 165],
    outline: rectPolygon(90, 90, 360, 590),
    sand: [rectPolygon(180, 225, 180, 85)],
    bumpers: [
      { x: 165, y: 450, r: 20, bouncy: true },
      { x: 375, y: 450, r: 20, bouncy: true },
    ],
  },
  {
    name: 'Water Hazard',
    par: 3,
    tee: [170, 620],
    cup: [170, 175],
    outline: [80, 90, 400, 90, 460, 150, 460, 680, 80, 680],
    water: [rectPolygon(80, 330, 290, 90)],
  },
  {
    name: 'Windmill',
    par: 3,
    tee: [270, 630],
    cup: [270, 165],
    outline: rectPolygon(150, 90, 240, 590),
    bumpers: [{ x: 270, y: 390, r: 13, bouncy: false }],
    movers: [{ kind: 'windmill', x: 270, y: 390, length: 78, speed: 1.1, phase: 0.4 }],
  },
  {
    name: 'The Ramp',
    par: 3,
    tee: [370, 630],
    cup: [370, 170],
    outline: rectPolygon(80, 90, 380, 590),
    slopes: [{ poly: rectPolygon(80, 300, 380, 150), ax: -340, ay: 0 }],
    bumpers: [{ x: 200, y: 200, r: 18, bouncy: true }],
    walls: [[80, 560, 160, 680]],
  },
  {
    name: 'Zigzag',
    par: 4,
    tee: [120, 630],
    cup: [120, 170],
    outline: [70, 90, 470, 90, 470, 630, 420, 680, 70, 680],
    walls: [
      [70, 490, 350, 490],
      [190, 290, 470, 290],
    ],
    bumpers: [{ x: 420, y: 390, r: 18, bouncy: true }],
  },
  {
    name: 'Slider',
    par: 3,
    tee: [270, 630],
    cup: [300, 170],
    outline: rectPolygon(120, 90, 300, 590),
    sand: [rectPolygon(120, 225, 90, 75)],
    movers: [{ kind: 'slider', x: 270, y: 400, halfLength: 55, amplitude: 70, speed: 1.3 }],
  },
  {
    name: 'Grand Finale',
    par: 4,
    tee: [270, 640],
    cup: [270, 160],
    outline: [270, 80, 500, 250, 500, 520, 330, 690, 210, 690, 40, 520, 40, 250],
    water: [rectPolygon(205, 330, 130, 100)],
    bumpers: [
      { x: 140, y: 300, r: 18, bouncy: true },
      { x: 400, y: 300, r: 18, bouncy: true },
    ],
    slopes: [{ poly: rectPolygon(40, 470, 460, 70), ax: 0, ay: -260 }],
  },
];

export const TOTAL_PAR = HOLES.reduce((sum, h) => sum + h.par, 0);

export interface CompiledHole {
  def: HoleDef;
  segments: Segment[];
  bumpers: Bumper[];
  sand: number[][];
  water: number[][];
  slopes: Slope[];
  movers: Mover[];
}

export function compileHole(def: HoleDef): CompiledHole {
  const segments = polygonEdges(def.outline);
  for (const wall of def.walls ?? []) {
    for (let i = 0; i + 3 < wall.length; i += 2) {
      segments.push({ ax: wall[i]!, ay: wall[i + 1]!, bx: wall[i + 2]!, by: wall[i + 3]! });
    }
  }
  return {
    def,
    segments,
    bumpers: def.bumpers ?? [],
    sand: def.sand ?? [],
    water: def.water ?? [],
    slopes: def.slopes ?? [],
    movers: def.movers ?? [],
  };
}

export function moverSegments(m: Mover, t: number, out: Segment[]): void {
  out.length = 0;
  if (m.kind === 'windmill') {
    const a = m.phase + m.speed * t;
    for (const offset of [0, Math.PI / 2]) {
      const c = Math.cos(a + offset) * m.length;
      const s = Math.sin(a + offset) * m.length;
      out.push({ ax: m.x - c, ay: m.y - s, bx: m.x + c, by: m.y + s });
    }
  } else {
    const cx = m.x + Math.sin(m.speed * t) * m.amplitude;
    out.push({ ax: cx - m.halfLength, ay: m.y, bx: cx + m.halfLength, by: m.y });
  }
}

export function moverVelocity(m: Mover, t: number, px: number, py: number): { vx: number; vy: number } {
  if (m.kind === 'windmill') return { vx: -m.speed * (py - m.y), vy: m.speed * (px - m.x) };
  return { vx: Math.cos(m.speed * t) * m.speed * m.amplitude, vy: 0 };
}

export const MOVER_THICKNESS = 4;
