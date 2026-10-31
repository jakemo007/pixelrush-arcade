export type Suit = 'dots' | 'bamboo' | 'characters';

export type TileKind =
  | `${Suit}-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | 'wind-east'
  | 'wind-south'
  | 'wind-west'
  | 'wind-north'
  | 'dragon-red'
  | 'dragon-green'
  | 'dragon-white'
  | 'flower-plum'
  | 'flower-orchid'
  | 'flower-chrysanthemum'
  | 'flower-lotus'
  | 'season-spring'
  | 'season-summer'
  | 'season-autumn'
  | 'season-winter';

export const SUITS: readonly Suit[] = ['dots', 'bamboo', 'characters'];
export const WINDS = ['wind-east', 'wind-south', 'wind-west', 'wind-north'] as const;
export const DRAGONS = ['dragon-red', 'dragon-green', 'dragon-white'] as const;
export const FLOWERS = ['flower-plum', 'flower-orchid', 'flower-chrysanthemum', 'flower-lotus'] as const;
export const SEASONS = ['season-spring', 'season-summer', 'season-autumn', 'season-winter'] as const;

export function suitedKinds(): TileKind[] {
  const out: TileKind[] = [];
  for (const suit of SUITS) for (let n = 1; n <= 9; n++) out.push(`${suit}-${n}` as TileKind);
  return out;
}

export function matchGroup(kind: TileKind): string {
  if (kind.startsWith('flower-')) return 'flower';
  if (kind.startsWith('season-')) return 'season';
  return kind;
}

export function tilesMatch(a: TileKind, b: TileKind): boolean {
  return matchGroup(a) === matchGroup(b);
}

export function fullSet(): TileKind[] {
  const out: TileKind[] = [];
  for (const kind of [...suitedKinds(), ...WINDS, ...DRAGONS]) for (let i = 0; i < 4; i++) out.push(kind);
  out.push(...FLOWERS, ...SEASONS);
  return out;
}

export function halfSet(): TileKind[] {
  const out: TileKind[] = [];
  for (const kind of [...suitedKinds(), ...WINDS, ...DRAGONS]) out.push(kind, kind);
  out.push('flower-plum', 'flower-orchid', 'season-spring', 'season-summer');
  return out;
}

export function tileSetFor(count: number): TileKind[] {
  if (count === 144) return fullSet();
  if (count === 72) return halfSet();
  throw new Error(`No tile set for ${count} tiles`);
}

export function pairUp(kinds: readonly TileKind[]): [TileKind, TileKind][] {
  const groups = new Map<string, TileKind[]>();
  for (const k of kinds) {
    const g = matchGroup(k);
    const list = groups.get(g);
    if (list) list.push(k);
    else groups.set(g, [k]);
  }
  const pairs: [TileKind, TileKind][] = [];
  for (const [group, list] of groups) {
    if (list.length % 2 !== 0) throw new Error(`Odd number of ${group} tiles`);
    for (let i = 0; i < list.length; i += 2) pairs.push([list[i]!, list[i + 1]!]);
  }
  return pairs;
}

const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

export function tileName(kind: TileKind): string {
  const [a, b] = kind.split('-') as [string, string];
  const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
  switch (a) {
    case 'dots':
    case 'bamboo':
    case 'characters':
      return `${NUMBER_WORDS[Number(b)]} of ${cap(a)}`;
    case 'wind':
      return `${cap(b)} Wind`;
    case 'dragon':
      return `${cap(b)} Dragon`;
    case 'flower':
      return `${cap(b)} flower`;
    default:
      return `${cap(b)} season`;
  }
}
