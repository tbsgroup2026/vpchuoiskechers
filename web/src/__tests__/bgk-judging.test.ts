import { describe, it, expect } from 'vitest';

describe('BGK Judging & N-Judge Average Formula Tests', () => {
  it('should calculate exact average score across 3 judges (divided by 3)', () => {
    const judgeScores = [85, 90, 77];
    const count = judgeScores.length; // 3
    const sum = judgeScores.reduce((a, b) => a + b, 0);
    const avgScore = Math.round((sum / count) * 10) / 10;

    expect(count).toBe(3);
    expect(sum).toBe(252);
    expect(avgScore).toBe(84);
  });

  it('should calculate exact average score across 5 judges (divided by 5)', () => {
    const scores = [80, 85, 90, 95, 75];
    const count = scores.length; // 5
    const sum = scores.reduce((a, b) => a + b, 0);
    const avgScore = Math.round((sum / count) * 10) / 10;

    expect(count).toBe(5);
    expect(sum).toBe(425);
    expect(avgScore).toBe(85);
  });

  it('should cap scores at 60% of criterion max if data is not independently verified', () => {
    const isVerified = false;
    const factor = isVerified ? 1.0 : 0.6;

    const rawC1 = 35; // Max 35
    const cappedC1 = Math.min(rawC1, 35 * factor);

    expect(cappedC1).toBe(21); // 35 * 0.6 = 21
  });

  it('should flag divergence if max judge score - min judge score exceeds 15 points', () => {
    const judgeScores = [92, 75];
    const diff = Math.max(...judgeScores) - Math.min(...judgeScores);
    const isFlagged = diff > 15;

    expect(diff).toBe(17);
    expect(isFlagged).toBe(true);
  });

  it('should sort tie-breaking by Total score -> C1 score -> C3 score', () => {
    const p1 = { totalScore: 85, c1: 30, c3: 15 };
    const p2 = { totalScore: 85, c1: 30, c3: 18 }; // Same total, higher C3
    const p3 = { totalScore: 85, c1: 33, c3: 10 }; // Same total, higher C1

    const list = [p1, p2, p3];

    list.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.c1 !== a.c1) return b.c1 - a.c1;
      return b.c3 - a.c3;
    });

    expect(list[0]).toBe(p3); // Highest C1
    expect(list[1]).toBe(p2); // Highest C3
    expect(list[2]).toBe(p1);
  });
});
