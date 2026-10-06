import { describe, it, expect } from 'vitest';
import {
  checkPrerequisites,
  getTc1MilestoneScore,
  calculateCriteriaScores,
  checkJudgeDiscrepancy,
  rankIndividualProposals,
  calculateParticipationScore,
  calculateQualifiedProposalScore,
  calculateFinalistProposalScore,
  calculateUnitMovementScore,
  rankCollectiveUnits,
  isValidTc1Score,
  isValidTc2Score,
  isValidTc3Score,
  isValidTc4Score,
  isValidTc5Score,
  BELOW_FLOOR_POLICY,
  MIN_PROPOSALS_FOR_AWARD,
  DISCREPANCY_LIMIT,
} from '../lib/kaizenScoring';

describe('Kaizen Scoring Module Unit Tests', () => {
  // 1. Prerequisite Checks
  describe('1.1 Prerequisite Conditions (Pass / Fail)', () => {
    it('passes when all 4 conditions are met', () => {
      const result = checkPrerequisites({
        p1_pass: true,
        p2_pass: true,
        p3_pass: true,
        p4_pass: true,
      });
      expect(result.isAllPass).toBe(true);
      expect(result.failedConditions.length).toBe(0);
      expect(result.badges.length).toBe(0);
    });

    it('fails and reports exact badges when conditions fail', () => {
      const result = checkPrerequisites({
        p1_pass: false,
        p2_pass: true,
        p3_pass: false,
        p4_pass: true,
      });
      expect(result.isAllPass).toBe(false);
      expect(result.failedConditions).toContain('Chưa triển khai thực tế');
      expect(result.failedConditions).toContain('Vi phạm an toàn lao động');
      expect(result.badges).toEqual(['Chưa triển khai', 'Vi phạm ATLĐ']);
    });
  });

  // 2. Score Level Validation
  describe('1.2 Score Milestone Validation', () => {
    it('validates TC1 milestone scores strictly and rejects invalid values like 31 or 27', () => {
      // Valid milestones: 0, 4, 9, 10, 14, 19, 20, 21 (capped), 24, 29, 30, 33, 35
      expect(isValidTc1Score(0)).toBe(true);
      expect(isValidTc1Score(4)).toBe(true);
      expect(isValidTc1Score(14)).toBe(true);
      expect(isValidTc1Score(30)).toBe(true);
      expect(isValidTc1Score(33)).toBe(true);
      expect(isValidTc1Score(35)).toBe(true);

      // Invalid milestone scores: 31, 27, 12, 17, 32
      expect(isValidTc1Score(31)).toBe(false);
      expect(isValidTc1Score(27)).toBe(false);
      expect(isValidTc1Score(12)).toBe(false);
      expect(isValidTc1Score(17)).toBe(false);
    });

    it('validates TC2–TC5 scores strictly and rejects non-spec values', () => {
      // TC2 & TC3 valid: 5, 10, 12 (capped), 15, 20
      expect(isValidTc2Score(5)).toBe(true);
      expect(isValidTc2Score(15)).toBe(true);
      expect(isValidTc2Score(20)).toBe(true);
      expect(isValidTc2Score(14)).toBe(false);

      expect(isValidTc3Score(10)).toBe(true);
      expect(isValidTc3Score(20)).toBe(true);
      expect(isValidTc3Score(18)).toBe(false);

      // TC4 valid: 3, 7, 9 (capped), 11, 15
      expect(isValidTc4Score(3)).toBe(true);
      expect(isValidTc4Score(11)).toBe(true);
      expect(isValidTc4Score(15)).toBe(true);
      expect(isValidTc4Score(10)).toBe(false);

      // TC5 valid: 0, 3, 6 (capped), 7, 10
      expect(isValidTc5Score(0)).toBe(true);
      expect(isValidTc5Score(7)).toBe(true);
      expect(isValidTc5Score(10)).toBe(true);
      expect(isValidTc5Score(5)).toBe(false);
    });
  });

  // 3. Data Verification 60% Cap
  describe('1.3 Criteria 60% Cap for Unverified Data', () => {
    it('does not cap when criteria are verified', () => {
      const res = calculateCriteriaScores(
        { c1: 35, c2: 20, c3: 20, c4: 15, c5: 10 },
        { c1Verified: true, c2Verified: true, c3Verified: true, c4Verified: true, c5Verified: true }
      );
      expect(res.totalScore).toBe(100);
      expect(res.hasAnyCapped).toBe(false);
    });

    it('caps unverified criteria at 60% of max score', () => {
      const res = calculateCriteriaScores(
        { c1: 35, c2: 20, c3: 20, c4: 15, c5: 10 },
        { c1Verified: false, c2Verified: false, c3Verified: false, c4Verified: false, c5Verified: false }
      );
      expect(res.c1Final).toBe(21); // 35 * 0.6
      expect(res.c2Final).toBe(12); // 20 * 0.6
      expect(res.c3Final).toBe(12); // 20 * 0.6
      expect(res.c4Final).toBe(9);  // 15 * 0.6
      expect(res.c5Final).toBe(6);  // 10 * 0.6
      expect(res.totalScore).toBe(60);
      expect(res.hasAnyCapped).toBe(true);
    });

    it('partially caps only unverified criteria exceeding threshold', () => {
      const res = calculateCriteriaScores(
        { c1: 35, c2: 10, c3: 15, c4: 5, c5: 8 },
        { c1Verified: false, c2Verified: true, c3Verified: false, c4Verified: true, c5Verified: false }
      );
      expect(res.c1Final).toBe(21); // Capped from 35 to 21
      expect(res.c2Final).toBe(10); // Verified, stays 10
      expect(res.c3Final).toBe(12); // Unverified, capped from 15 to 12
      expect(res.c4Final).toBe(5);  // Verified, 5
      expect(res.c5Final).toBe(6);  // Unverified, capped from 8 to 6
    });
  });

  // 4. Cross-Judging Discrepancy Flag
  describe('1.3 Judge Cross-Checking (Discrepancy > 15)', () => {
    it('flags when difference between 2 judges > 15', () => {
      const check = checkJudgeDiscrepancy(85, 65);
      expect(check.isFlagged).toBe(true);
      expect(check.discrepancy).toBe(20);
      expect(check.officialScore).toBe(75);
    });

    it('does not flag when difference <= 15', () => {
      const check = checkJudgeDiscrepancy(80, 70);
      expect(check.isFlagged).toBe(false);
      expect(check.discrepancy).toBe(10);
      expect(check.officialScore).toBe(75);
    });
  });

  // 5. Proposal Tie-Breaking
  describe('1.4 Proposal Tie-Breaking Rules', () => {
    it('sorts by rounded total score DESC, then TC1 DESC, then TC3 DESC', () => {
      const input = [
        { id: '1', title: 'Prop 1', unit: 'A', prereqs: { p1_pass: true }, totalScore: 85.4, c1Score: 30, c3Score: 15, c2Score: 20, c4Score: 10, c5Score: 10.4 },
        { id: '2', title: 'Prop 2', unit: 'B', prereqs: { p1_pass: true }, totalScore: 85.4, c1Score: 32, c3Score: 10, c2Score: 20, c4Score: 10, c5Score: 13.4 },
        { id: '3', title: 'Prop 3', unit: 'C', prereqs: { p1_pass: true }, totalScore: 85.4, c1Score: 30, c3Score: 18, c2Score: 20, c4Score: 10, c5Score: 7.4 },
        { id: '4', title: 'Prop 4', unit: 'D', prereqs: { p1_pass: true }, totalScore: 90.0, c1Score: 35, c3Score: 20, c2Score: 20, c4Score: 10, c5Score: 5 },
      ];

      const ranked = rankIndividualProposals(input);

      expect(ranked[0].id).toBe('4'); // 90.0 pts (Rank 1)
      expect(ranked[1].id).toBe('2'); // 85.4 pts, TC1 = 32 (Rank 2)
      expect(ranked[2].id).toBe('3'); // 85.4 pts, TC1 = 30, TC3 = 18 (Rank 3)
      expect(ranked[3].id).toBe('1'); // 85.4 pts, TC1 = 30, TC3 = 15 (Rank 4)
    });

    it('assigns same rank (đồng hạng) when scores and tie-breakers match', () => {
      const input = [
        { id: '1', title: 'Prop 1', unit: 'A', prereqs: { p1_pass: true }, totalScore: 85.0, c1Score: 30, c3Score: 15, c2Score: 20, c4Score: 10, c5Score: 10 },
        { id: '2', title: 'Prop 2', unit: 'B', prereqs: { p1_pass: true }, totalScore: 85.0, c1Score: 30, c3Score: 15, c2Score: 20, c4Score: 10, c5Score: 10 },
      ];

      const ranked = rankIndividualProposals(input);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1);
    });

    it('moves disqualified proposals to the bottom with rank 0', () => {
      const input = [
        { id: '1', title: 'Prop 1', unit: 'A', prereqs: { p1_pass: false }, totalScore: 95.0, c1Score: 35, c3Score: 20, c2Score: 20, c4Score: 10, c5Score: 10 },
        { id: '2', title: 'Prop 2', unit: 'B', prereqs: { p1_pass: true }, totalScore: 80.0, c1Score: 30, c3Score: 15, c2Score: 15, c4Score: 10, c5Score: 10 },
      ];

      const ranked = rankIndividualProposals(input);
      expect(ranked[0].id).toBe('2');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].id).toBe('1');
      expect(ranked[1].rank).toBe(0);
      expect(ranked[1].statusText).toBe('Bị loại');
    });

    it('correctly ranks real evidence dataset: #005 (100pt), #004 (89pt), #001 (82pt), 79pt tie, and unscored items', () => {
      const input = [
        { id: '16', code: '#CI-2026-016', title: 'Prop 016', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 0, c1Score: 0, c2Score: 0, c3Score: 0, c4Score: 0, c5Score: 0, isEvaluated: false },
        { id: '3', code: '#CI-2026-003', title: 'Prop 003', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 0, c1Score: 0, c2Score: 0, c3Score: 0, c4Score: 0, c5Score: 0, isEvaluated: false },
        { id: '15', code: '#CI-2026-015', title: 'Prop 015', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 0, c1Score: 0, c2Score: 0, c3Score: 0, c4Score: 0, c5Score: 0, isEvaluated: false },
        { id: '6', code: '#CI-2026-006', title: 'Prop 006', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 79, c1Score: 25, c3Score: 15, c2Score: 15, c4Score: 12, c5Score: 12, isEvaluated: true },
        { id: '9', code: '#CI-2026-009', title: 'Prop 009', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 79, c1Score: 25, c3Score: 15, c2Score: 15, c4Score: 12, c5Score: 12, isEvaluated: true },
        { id: '8', code: '#CI-2026-008', title: 'Prop 008', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 79, c1Score: 25, c3Score: 15, c2Score: 15, c4Score: 12, c5Score: 12, isEvaluated: true },
        { id: '4', code: '#CI-2026-004', title: 'Prop 004', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 89, c1Score: 30, c3Score: 18, c2Score: 18, c4Score: 12, c5Score: 11, isEvaluated: true },
        { id: '1', code: '#CI-2026-001', title: 'Prop 001', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 82, c1Score: 28, c3Score: 16, c2Score: 16, c4Score: 11, c5Score: 11, isEvaluated: true },
        { id: '5', code: '#CI-2026-005', title: 'Prop 005', unit: 'NMMĐ', prereqs: { p1_pass: true }, totalScore: 100, c1Score: 35, c3Score: 20, c2Score: 20, c4Score: 15, c5Score: 10, isEvaluated: true },
      ];

      const ranked = rankIndividualProposals(input);

      // Scored proposals must be first and ranked by score DESC
      expect(ranked[0].code).toBe('#CI-2026-005');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].awardTitle).toBe('Giải Nhất');

      expect(ranked[1].code).toBe('#CI-2026-004');
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].awardTitle).toBe('Giải Nhì');

      expect(ranked[2].code).toBe('#CI-2026-001');
      expect(ranked[2].rank).toBe(3);
      expect(ranked[2].awardTitle).toBe('Giải Ba');

      // 79pt tie proposals get rank 4
      const prop006 = ranked.find((p) => p.code === '#CI-2026-006');
      const prop009 = ranked.find((p) => p.code === '#CI-2026-009');
      const prop008 = ranked.find((p) => p.code === '#CI-2026-008');

      expect(prop006?.rank).toBe(4);
      expect(prop009?.rank).toBe(4);
      expect(prop008?.rank).toBe(4);

      expect(prop006?.awardTitle).toBe('Ý tưởng');

      // Unscored proposals (#016, #003, #015) MUST NOT get numeric rank or award
      const prop016 = ranked.find((p) => p.code === '#CI-2026-016');
      const prop003 = ranked.find((p) => p.code === '#CI-2026-003');
      const prop015 = ranked.find((p) => p.code === '#CI-2026-015');

      expect(prop016?.rank).toBe(0);
      expect(prop016?.awardTitle).toBeUndefined();
      expect(prop016?.statusText).toBe('Chưa chấm');

      expect(prop003?.rank).toBe(0);
      expect(prop003?.awardTitle).toBeUndefined();
      expect(prop003?.statusText).toBe('Chưa chấm');

      expect(prop015?.rank).toBe(0);
      expect(prop015?.awardTitle).toBeUndefined();
      expect(prop015?.statusText).toBe('Chưa chấm');
    });
  });

  // 6. Collective Unit Linear Interpolation
  describe('2.1 Collective Movement Linear Interpolation', () => {
    it('calculates participation score correctly at exact prompt test points (15%, 27.5%, 40%, 55%)', () => {
      // Below 15% -> 0 pts
      expect(calculateParticipationScore(10, 100).score).toBe(0);

      // Floor 15% -> 30 pts
      expect(calculateParticipationScore(15, 100).score).toBe(30);

      // Mid point 27.5% -> 40 pts: 30 + (27.5 - 15) / (40 - 15) * 20 = 40
      expect(calculateParticipationScore(27.5, 100).score).toBe(40);

      // Ceiling 40% -> 50 pts
      expect(calculateParticipationScore(40, 100).score).toBe(50);

      // Above 40% (55%) -> 50 pts
      expect(calculateParticipationScore(55, 100).score).toBe(50);
    });

    it('calculates qualified proposal score correctly at exact prompt test points (50%, 75%, 100%)', () => {
      // Below 50% -> 0 pts
      expect(calculateQualifiedProposalScore(4, 10).score).toBe(0);

      // Floor 50% -> 18 pts
      expect(calculateQualifiedProposalScore(5, 10).score).toBe(18);

      // Mid point 75% -> 24 pts: 18 + (75 - 50) / 50 * 12 = 24
      expect(calculateQualifiedProposalScore(75, 100).score).toBe(24);

      // Ceiling 100% -> 30 pts
      expect(calculateQualifiedProposalScore(10, 10).score).toBe(30);
    });

    it('calculates finalist proposal score correctly at exact prompt test points (20%, 35%, 50%)', () => {
      // Below 20% -> 0 pts
      expect(calculateFinalistProposalScore(1, 10).score).toBe(0);

      // Floor 20% -> 10 pts
      expect(calculateFinalistProposalScore(2, 10).score).toBe(10);

      // Mid point 35% -> 15 pts: 10 + (35 - 20) / 30 * 10 = 15
      expect(calculateFinalistProposalScore(35, 100).score).toBe(15);

      // Ceiling >= 50% -> 20 pts
      expect(calculateFinalistProposalScore(5, 10).score).toBe(20);
    });

    it('handles edge cases safely without throwing or division by 0', () => {
      const res0 = calculateParticipationScore(0, 0);
      expect(res0.actualRateFormatted).toBe('—');
      expect(res0.score).toBe(0);

      const resQual0 = calculateQualifiedProposalScore(0, 0);
      expect(resQual0.actualRateFormatted).toBe('—');
      expect(resQual0.score).toBe(0);
    });
  });

  // 7. Distinct Person Count & Min 3 Proposals Rule
  describe('2.2 Distinct Participant Count & Award Qualification', () => {
    it('counts 1 person submitting multiple proposals only ONCE for participation metric', () => {
      const unitData = {
        unitName: 'Xưởng May 1',
        totalEmployees: 100,
        proposals: [
          { id: 'p1', proposerCode: 'EMP001', prereqs: { p1_pass: true } },
          { id: 'p2', proposerCode: 'EMP001', prereqs: { p1_pass: true } },
          { id: 'p3', proposerCode: 'EMP001', prereqs: { p1_pass: true } },
          { id: 'p4', proposerCode: 'EMP002', prereqs: { p1_pass: true } },
        ],
      };

      const result = calculateUnitMovementScore(unitData);
      expect(result.validProposalsCount).toBe(4);
      expect(result.distinctValidParticipants).toBe(2); // EMP001 & EMP002
    });

    it('disqualifies units with < 3 valid proposals from award ranking', () => {
      const units = [
        {
          unitName: 'Xưởng A (Đủ ĐK)',
          totalEmployees: 100,
          proposals: [
            { id: 'p1', proposerCode: 'EMP1', prereqs: { p1_pass: true } },
            { id: 'p2', proposerCode: 'EMP2', prereqs: { p1_pass: true } },
            { id: 'p3', proposerCode: 'EMP3', prereqs: { p1_pass: true } },
          ],
        },
        {
          unitName: 'Xưởng B (Không đủ ĐK)',
          totalEmployees: 100,
          proposals: [
            { id: 'p4', proposerCode: 'EMP4', prereqs: { p1_pass: true } },
            { id: 'p5', proposerCode: 'EMP5', prereqs: { p1_pass: true } },
          ],
        },
      ];

      const ranked = rankCollectiveUnits(units);
      expect(ranked[0].unitName).toBe('Xưởng A (Đủ ĐK)');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].awardTitle).toBe('Xuất sắc');

      expect(ranked[1].unitName).toBe('Xưởng B (Không đủ ĐK)');
      expect(ranked[1].rank).toBe(0);
      expect(ranked[1].isQualifiedForAward).toBe(false);
      expect(ranked[1].qualificationNote).toContain('Chưa đủ điều kiện xét giải (2/3 bài)');
    });

    it('assigns titles "Xuất sắc" and "Tích cực" to top 2 qualified units', () => {
      const units = [
        {
          unitName: 'Đơn vị Top 1',
          totalEmployees: 100,
          proposals: Array(40).fill(0).map((_, i) => ({ id: `p${i}`, proposerCode: `E${i}`, prereqs: { p1_pass: true } })),
        },
        {
          unitName: 'Đơn vị Top 2',
          totalEmployees: 100,
          proposals: Array(25).fill(0).map((_, i) => ({ id: `p2_${i}`, proposerCode: `E2_${i}`, prereqs: { p1_pass: true } })),
        },
        {
          unitName: 'Đơn vị Top 3',
          totalEmployees: 100,
          proposals: Array(15).fill(0).map((_, i) => ({ id: `p3_${i}`, proposerCode: `E3_${i}`, prereqs: { p1_pass: true } })),
        },
      ];

      const ranked = rankCollectiveUnits(units);
      expect(ranked[0].unitName).toBe('Đơn vị Top 1');
      expect(ranked[0].awardTitle).toBe('Xuất sắc');

      expect(ranked[1].unitName).toBe('Đơn vị Top 2');
      expect(ranked[1].awardTitle).toBe('Tích cực');

      expect(ranked[2].unitName).toBe('Đơn vị Top 3');
      expect(ranked[2].awardTitle).toBeUndefined();
    });
  });
});
