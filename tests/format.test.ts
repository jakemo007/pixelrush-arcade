import { describe, expect, it } from 'vitest';
import type { BestConfig } from '@/config/games';
import { formatDuration, formatPoints, formatRaceTime, formatResult, formatValue } from '@/lib/format';

describe('value formatting', () => {
  it('formats points with thousands separators', () => {
    expect(formatPoints(0)).toBe('0');
    expect(formatPoints(1234567)).toBe('1,234,567');
  });

  it('formats puzzle durations as m:ss or h:mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(59_999)).toBe('0:59');
    expect(formatDuration(61_000)).toBe('1:01');
    expect(formatDuration(3_600_000 + 5_000)).toBe('1:00:05');
    expect(formatDuration(-500)).toBe('0:00');
  });

  it('formats race times with hundredths', () => {
    expect(formatRaceTime(0)).toBe('0:00.00');
    expect(formatRaceTime(83_456)).toBe('1:23.45');
    expect(formatRaceTime(9_999)).toBe('0:09.99');
  });

  it('formats results with units for counts only', () => {
    const moves: BestConfig = { label: 'Moves', format: 'count', unit: 'moves', direction: 'lower' };
    const time: BestConfig = { label: 'Time', format: 'duration', direction: 'lower' };
    expect(formatResult(52, moves)).toBe('52 moves');
    expect(formatValue(52, 'count')).toBe('52');
    expect(formatResult(125_000, time)).toBe('2:05');
  });
});
