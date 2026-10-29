export type Direction = 'across' | 'down';

export interface Clue {
  number: number;
  answer: string;
  clue: string;
}

export interface CrosswordPuzzle {
  id: string;
  title: string;
  grid: readonly string[];
  across: readonly Clue[];
  down: readonly Clue[];
}

export interface Entry {
  direction: Direction;
  number: number;
  cells: number[];
  answer: string;
  clue: string;
}

export interface BuiltPuzzle {
  id: string;
  title: string;
  width: number;
  height: number;
  solution: string[];
  numbers: number[];
  across: Entry[];
  down: Entry[];
  entries: Entry[];
  acrossOf: number[];
  downOf: number[];
}

export interface DerivedEntry {
  direction: Direction;
  number: number;
  cells: number[];
  answer: string;
}

export function isBlack(ch: string | undefined): boolean {
  return ch === '#';
}

export function numberGrid(grid: readonly string[]): number[] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const numbers = new Array<number>(width * height).fill(0);
  let next = 1;
  const white = (r: number, c: number) => r >= 0 && r < height && c >= 0 && c < width && !isBlack(grid[r]![c]);
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!white(r, c)) continue;
      const startsAcross = !white(r, c - 1) && white(r, c + 1);
      const startsDown = !white(r - 1, c) && white(r + 1, c);
      if (startsAcross || startsDown) numbers[r * width + c] = next++;
    }
  }
  return numbers;
}

export function deriveEntries(grid: readonly string[]): { across: DerivedEntry[]; down: DerivedEntry[] } {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const numbers = numberGrid(grid);
  const across: DerivedEntry[] = [];
  const down: DerivedEntry[] = [];
  const collect = (direction: Direction) => {
    const outer = direction === 'across' ? height : width;
    const inner = direction === 'across' ? width : height;
    for (let a = 0; a < outer; a++) {
      let run: number[] = [];
      for (let b = 0; b <= inner; b++) {
        const r = direction === 'across' ? a : b;
        const c = direction === 'across' ? b : a;
        if (b < inner && !isBlack(grid[r]![c])) {
          run.push(r * width + c);
          continue;
        }
        if (run.length >= 2) {
          const answer = run.map((cell) => grid[Math.floor(cell / width)]![cell % width]!).join('');
          (direction === 'across' ? across : down).push({ direction, number: numbers[run[0]!]!, cells: run, answer });
        }
        run = [];
      }
    }
  };
  collect('across');
  collect('down');
  across.sort((x, y) => x.number - y.number);
  down.sort((x, y) => x.number - y.number);
  return { across, down };
}

export function validatePuzzle(p: CrosswordPuzzle): string[] {
  const problems: string[] = [];
  const width = p.grid[0]?.length ?? 0;
  if (p.grid.length < 3 || width < 3) problems.push('grid too small');
  p.grid.forEach((row, r) => {
    if (row.length !== width) problems.push(`row ${r + 1} has length ${row.length}`);
    if (!/^[A-Z#]+$/.test(row)) problems.push(`row ${r + 1} has invalid characters`);
  });
  if (problems.length) return problems;
  const derived = deriveEntries(p.grid);
  for (const direction of ['across', 'down'] as const) {
    const stated = p[direction];
    const found = derived[direction];
    if (stated.length !== found.length) problems.push(`${direction}: ${stated.length} clues for ${found.length} entries`);
    found.forEach((entry, i) => {
      const clue = stated[i];
      if (!clue) return;
      if (clue.number !== entry.number) problems.push(`${direction} clue ${i + 1} numbered ${clue.number}, grid says ${entry.number}`);
      if (clue.answer !== entry.answer) problems.push(`${entry.number} ${direction}: answer ${clue.answer} but grid reads ${entry.answer}`);
      if (!clue.clue.trim()) problems.push(`${entry.number} ${direction}: empty clue`);
    });
  }
  const all = [...derived.across, ...derived.down];
  for (let cell = 0; cell < width * p.grid.length; cell++) {
    const ch = p.grid[Math.floor(cell / width)]![cell % width]!;
    if (isBlack(ch)) continue;
    const count = all.filter((e) => e.cells.includes(cell)).length;
    if (count < 2) problems.push(`square ${cell} is ${count === 0 ? 'in no entry' : 'unchecked'}`);
  }
  const answers = all.map((e) => e.answer);
  if (new Set(answers).size !== answers.length) problems.push('an answer is used twice');
  return problems;
}

export function buildPuzzle(p: CrosswordPuzzle): BuiltPuzzle {
  const problems = validatePuzzle(p);
  if (problems.length) throw new Error(`Crossword ${p.id}: ${problems.join('; ')}`);
  const height = p.grid.length;
  const width = p.grid[0]!.length;
  const solution: string[] = [];
  for (const row of p.grid) for (const ch of row) solution.push(isBlack(ch) ? '' : ch);
  const derived = deriveEntries(p.grid);
  const toEntry = (d: DerivedEntry, i: number): Entry => ({ ...d, clue: p[d.direction][i]!.clue });
  const across = derived.across.map(toEntry);
  const down = derived.down.map(toEntry);
  const entries = [...across, ...down];
  const acrossOf = new Array<number>(width * height).fill(-1);
  const downOf = new Array<number>(width * height).fill(-1);
  entries.forEach((e, i) => {
    for (const cell of e.cells) (e.direction === 'across' ? acrossOf : downOf)[cell] = i;
  });
  return { id: p.id, title: p.title, width, height, solution, numbers: numberGrid(p.grid), across, down, entries, acrossOf, downOf };
}

export function entryIndexAt(b: BuiltPuzzle, cell: number, direction: Direction): number {
  const primary = direction === 'across' ? b.acrossOf[cell]! : b.downOf[cell]!;
  if (primary >= 0) return primary;
  return direction === 'across' ? b.downOf[cell]! : b.acrossOf[cell]!;
}

export function firstEmptyCell(entry: Entry, letters: readonly string[]): number {
  return entry.cells.find((c) => !letters[c]) ?? entry.cells[0]!;
}

export function stepEntry(b: BuiltPuzzle, index: number, delta: 1 | -1): number {
  const n = b.entries.length;
  return (((index + delta) % n) + n) % n;
}

export function moveCell(b: BuiltPuzzle, cell: number, dr: number, dc: number): number {
  let r = Math.floor(cell / b.width) + dr;
  let c = (cell % b.width) + dc;
  while (r >= 0 && r < b.height && c >= 0 && c < b.width) {
    const next = r * b.width + c;
    if (b.solution[next]) return next;
    r += dr;
    c += dc;
  }
  return cell;
}

export function wrongCells(b: BuiltPuzzle, letters: readonly string[], cells: readonly number[]): number[] {
  return cells.filter((c) => letters[c] && letters[c] !== b.solution[c]);
}

export function isFilled(b: BuiltPuzzle, letters: readonly string[]): boolean {
  return b.solution.every((s, i) => !s || Boolean(letters[i]));
}

export function isSolved(b: BuiltPuzzle, letters: readonly string[]): boolean {
  return b.solution.every((s, i) => !s || letters[i] === s);
}

export function whiteCells(b: BuiltPuzzle): number[] {
  return b.solution.flatMap((s, i) => (s ? [i] : []));
}
