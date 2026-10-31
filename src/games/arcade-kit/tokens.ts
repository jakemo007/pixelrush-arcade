export type TokenShape = 'circle' | 'diamond' | 'star' | 'triangle' | 'square' | 'hexagon';

export interface TokenStyle {
  name: string;
  shape: TokenShape;
  color: string;
  light: string;
  dark: string;
}

export const TOKENS: readonly TokenStyle[] = [
  { name: 'cyan circle', shape: 'circle', color: '#38e8ff', light: '#c2f8ff', dark: '#0b7590' },
  { name: 'pink diamond', shape: 'diamond', color: '#ff4fd8', light: '#ffc6f2', dark: '#9c0f79' },
  { name: 'yellow star', shape: 'star', color: '#ffd23f', light: '#fff2bd', dark: '#a37600' },
  { name: 'green triangle', shape: 'triangle', color: '#4dffb5', light: '#c9ffe8', dark: '#0b8a57' },
  { name: 'violet square', shape: 'square', color: '#a78bfa', light: '#e4dbff', dark: '#5236b8' },
  { name: 'orange hexagon', shape: 'hexagon', color: '#ff8a3d', light: '#ffd3b5', dark: '#ad4508' },
];

export const TOKEN_COUNT = TOKENS.length;

export function tokenStyle(kind: number): TokenStyle {
  return TOKENS[kind] ?? TOKENS[0]!;
}
