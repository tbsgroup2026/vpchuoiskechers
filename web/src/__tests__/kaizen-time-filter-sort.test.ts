import { describe, it, expect } from 'vitest';

function getProposalSavedSeconds(p: any): number {
  if (!p) return 0;
  const tb = Number(p.time_before_seconds ?? p.timeBeforeSeconds ?? 0);
  const ta = Number(p.time_after_seconds ?? p.timeAfterSeconds ?? 0);
  if (tb > 0 || ta > 0) return Math.max(0, tb - ta);
  return Number(p.saved_seconds ?? p.so_giay_tiet_kiem ?? p.savedSeconds ?? 0);
}

function hasTimeData(p: any): boolean {
  return getProposalSavedSeconds(p) > 0;
}

function filterAndSortProposals(
  proposals: any[],
  options: {
    selectedSortBy?: string;
    minSavedSeconds?: string;
    maxSavedSeconds?: string;
    timeDataMode?: 'ALL' | 'HAS_TIME' | 'NO_TIME';
  }
) {
  const {
    selectedSortBy = 'DEFAULT',
    minSavedSeconds = '',
    maxSavedSeconds = '',
    timeDataMode = 'ALL',
  } = options;

  const filtered = proposals.filter((p) => {
    if (timeDataMode === 'HAS_TIME' && !hasTimeData(p)) return false;
    if (timeDataMode === 'NO_TIME' && hasTimeData(p)) return false;

    const pSecs = getProposalSavedSeconds(p);
    const minSecs = minSavedSeconds !== '' ? parseFloat(minSavedSeconds) : NaN;
    const maxSecs = maxSavedSeconds !== '' ? parseFloat(maxSavedSeconds) : NaN;

    if (!isNaN(minSecs) && minSecs > 0) {
      if (pSecs < minSecs) return false;
    }
    if (!isNaN(maxSecs) && maxSecs >= 0) {
      if (pSecs > maxSecs || pSecs <= 0) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (selectedSortBy === 'TIME_DESC') {
      const tA = getProposalSavedSeconds(a);
      const tB = getProposalSavedSeconds(b);
      const hasA = tA > 0;
      const hasB = tB > 0;
      if (hasA !== hasB) return hasA ? -1 : 1;
      return tB - tA;
    }

    if (selectedSortBy === 'TIME_ASC') {
      const tA = getProposalSavedSeconds(a);
      const tB = getProposalSavedSeconds(b);
      const hasA = tA > 0;
      const hasB = tB > 0;
      if (hasA !== hasB) return hasA ? -1 : 1;
      return tA - tB;
    }

    return 0;
  });
}

describe('Kaizen Time Savings Sort & Range Filter Tests', () => {
  const mockProposals = [
    { id: '1', code: 'P01', title: '5S Clean', saved_seconds: 0, category: '5S' },
    { id: '2', code: 'P02', title: 'Quick Cut 15s', saved_seconds: 15, time_before_seconds: 45, time_after_seconds: 30 },
    { id: '3', code: 'P03', title: 'Automation 60s', saved_seconds: 60, time_before_seconds: 120, time_after_seconds: 60 },
    { id: '4', code: 'P04', title: 'Safety Gear', saved_seconds: 0, category: 'SAFETY' },
    { id: '5', code: 'P05', title: 'Minor Fix 5s', saved_seconds: 5, time_before_seconds: 20, time_after_seconds: 15 },
    { id: '6', code: 'P06', title: 'Huge Save 120s', saved_seconds: 120, time_before_seconds: 180, time_after_seconds: 60 },
  ];

  it('correctly calculates saved seconds from time_before and time_after', () => {
    expect(getProposalSavedSeconds(mockProposals[1])).toBe(15);
    expect(getProposalSavedSeconds(mockProposals[2])).toBe(60);
    expect(getProposalSavedSeconds(mockProposals[0])).toBe(0);
  });

  it('sorts TIME_DESC with valid >0 time cards first (descending) and 0s cards at bottom', () => {
    const sorted = filterAndSortProposals(mockProposals, { selectedSortBy: 'TIME_DESC' });
    const ids = sorted.map((p) => p.id);

    expect(ids[0]).toBe('6'); // 120s
    expect(ids[1]).toBe('3'); // 60s
    expect(ids[2]).toBe('2'); // 15s
    expect(ids[3]).toBe('5'); // 5s

    // 0s cards are pushed to the bottom
    expect(getProposalSavedSeconds(sorted[4])).toBe(0);
    expect(getProposalSavedSeconds(sorted[5])).toBe(0);
  });

  it('sorts TIME_ASC with valid >0 time cards first (ascending) and 0s cards at bottom', () => {
    const sorted = filterAndSortProposals(mockProposals, { selectedSortBy: 'TIME_ASC' });
    const ids = sorted.map((p) => p.id);

    expect(ids[0]).toBe('5'); // 5s
    expect(ids[1]).toBe('2'); // 15s
    expect(ids[2]).toBe('3'); // 60s
    expect(ids[3]).toBe('6'); // 120s

    // 0s cards are pushed to the bottom
    expect(getProposalSavedSeconds(sorted[4])).toBe(0);
    expect(getProposalSavedSeconds(sorted[5])).toBe(0);
  });

  it('filters by range minSavedSeconds = 10 and maxSavedSeconds = 100', () => {
    const filtered = filterAndSortProposals(mockProposals, {
      minSavedSeconds: '10',
      maxSavedSeconds: '100',
    });
    const ids = filtered.map((p) => p.id);

    expect(ids).toContain('2'); // 15s
    expect(ids).toContain('3'); // 60s
    expect(ids).not.toContain('5'); // 5s (too small)
    expect(ids).not.toContain('6'); // 120s (too big)
    expect(ids).not.toContain('1'); // 0s
  });

  it('filters by HAS_TIME mode (excludes 0s cards)', () => {
    const filtered = filterAndSortProposals(mockProposals, { timeDataMode: 'HAS_TIME' });
    expect(filtered.length).toBe(4);
    filtered.forEach((p) => expect(getProposalSavedSeconds(p)).toBeGreaterThan(0));
  });

  it('filters by NO_TIME mode (only 0s cards)', () => {
    const filtered = filterAndSortProposals(mockProposals, { timeDataMode: 'NO_TIME' });
    expect(filtered.length).toBe(2);
    filtered.forEach((p) => expect(getProposalSavedSeconds(p)).toBe(0));
  });
});
