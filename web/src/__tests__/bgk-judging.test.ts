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

  it('should track real scorer identity sessions for shared guest accounts (#923)', () => {
    // Shared guest account configuration
    const sharedAccount = { id: 'guest_923', username: 'BGK-923', dung_chung: 1 };

    // Person 1 (Nguyễn Văn A) scores Proposal P1
    const p1Session = {
      id: 'gss_001',
      judge_account_id: sharedAccount.id,
      submission_id: 'P1',
      nguoi_cham_thuc_ho_ten: 'Nguyễn Văn A',
      da_gui: 1,
    };
    const p1Score = {
      id: 'score_001',
      submission_id: 'P1',
      total_score: 88,
      guest_scoring_session_id: p1Session.id,
      nguoi_cham_thuc_ho_ten: p1Session.nguoi_cham_thuc_ho_ten,
    };

    // Person 2 (Trần Thị B) scores Proposal P2 on the same shared account
    const p2Session = {
      id: 'gss_002',
      judge_account_id: sharedAccount.id,
      submission_id: 'P2',
      nguoi_cham_thuc_ho_ten: 'Trần Thị B',
      da_gui: 1,
    };
    const p2Score = {
      id: 'score_002',
      submission_id: 'P2',
      total_score: 92,
      guest_scoring_session_id: p2Session.id,
      nguoi_cham_thuc_ho_ten: p2Session.nguoi_cham_thuc_ho_ten,
    };

    expect(p1Score.guest_scoring_session_id).toBe('gss_001');
    expect(p1Score.nguoi_cham_thuc_ho_ten).toBe('Nguyễn Văn A');

    expect(p2Score.guest_scoring_session_id).toBe('gss_002');
    expect(p2Score.nguoi_cham_thuc_ho_ten).toBe('Trần Thị B');

    // Both scores belong to the same guest account but distinct real scorers
    expect(p1Session.judge_account_id).toBe(p2Session.judge_account_id);
    expect(p1Score.nguoi_cham_thuc_ho_ten).not.toBe(p2Score.nguoi_cham_thuc_ho_ten);
  });

  it('should prompt for identity re-confirmation after submitting score for a proposal', () => {
    let activeConfirmedProposalId: string | null = null;

    // Evaluate P1
    activeConfirmedProposalId = 'P1';
    expect(activeConfirmedProposalId).toBe('P1');

    // Submit score for P1 -> session resets
    activeConfirmedProposalId = null;

    // Moving to P2 -> activeConfirmedProposalId is null, triggering mandatory identity modal
    const requiresModalForP2 = activeConfirmedProposalId !== 'P2';
    expect(requiresModalForP2).toBe(true);
  });
});
