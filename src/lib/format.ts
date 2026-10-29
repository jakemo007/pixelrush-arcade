import type { BestConfig, ValueFormat } from '@/config/games';

export function formatPoints(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function formatRaceTime(ms: number): string {
  const totalCs = Math.max(0, Math.floor(ms / 10));
  const m = Math.floor(totalCs / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case 'points':
    case 'count':
      return formatPoints(value);
    case 'duration':
      return formatDuration(value);
    case 'racetime':
      return formatRaceTime(value);
  }
}

export function formatResult(value: number, best: BestConfig): string {
  const text = formatValue(value, best.format);
  return best.format === 'count' && best.unit ? `${text} ${best.unit}` : text;
}
