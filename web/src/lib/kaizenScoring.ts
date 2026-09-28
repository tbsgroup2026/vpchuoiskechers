/**
 * KAIZEN SCORING ENGINE - PURE FUNCTIONS & TYPES
 * Implementations for Individual Proposal Scoring (100 pts scale)
 * and Collective Unit Movement Ranking (100 pts scale).
 */

export const BELOW_FLOOR_POLICY = 'ZERO'; // Giả định: Dưới mốc sàn = 0đ (Đặt hằng số để dễ đổi)
export const MIN_PROPOSALS_FOR_AWARD = 3; // Điều kiện tối thiểu 3 bài hợp lệ/tháng để xét giải tập thể
export const DISCREPANCY_LIMIT = 15; // Cờ chênh lệch 2 giám khảo > 15đ

/**
 * 1. TIÊU CHÍ 1 BAREM CONFIG & MILESTONE DEFINITIONS
 * TODO: Xác nhận lại danh sách mốc điểm sàn/giữa/trần chính thức với Ban 2.2 nếu có thay đổi.
 */
export type Tc1Group = 'PRODUCTIVITY' | 'MATERIAL_SAVING' | 'SAFETY';
export type Tc1Milestone = 'SAN' | 'GIUA' | 'TRAN';

export interface Tc1RangeConfig {
  rangeLabel: string;
  minScore: number;
  maxScore: number;
  san: number;
  giua: number;
  tran: number;
}

export const TC1_BAREM_CONFIG: Record<Tc1Group, Tc1RangeConfig[]> = {
  PRODUCTIVITY: [
    { rangeLabel: '0–9đ (Thiếu tin cậy / Sơ lược)', minScore: 0, maxScore: 9, san: 0, giua: 4, tran: 9 },
    { rangeLabel: '10–19đ (Số liệu sơ bộ / Thấp)', minScore: 10, maxScore: 19, san: 10, giua: 14, tran: 19 },
    { rangeLabel: '20–29đ (Đã xác nhận / Trung bình)', minScore: 20, maxScore: 29, san: 20, giua: 24, tran: 29 },
    { rangeLabel: '30–35đ (Hiệu quả cao / Xuất sắc)', minScore: 30, maxScore: 35, san: 30, giua: 33, tran: 35 },
  ],
  MATERIAL_SAVING: [
    { rangeLabel: '0–9đ (Thiếu tin cậy / Sơ lược)', minScore: 0, maxScore: 9, san: 0, giua: 4, tran: 9 },
    { rangeLabel: '10–19đ (Số liệu sơ bộ / Thấp)', minScore: 10, maxScore: 19, san: 10, giua: 14, tran: 19 },
    { rangeLabel: '20–29đ (Đã xác nhận / Trung bình)', minScore: 20, maxScore: 29, san: 20, giua: 24, tran: 29 },
    { rangeLabel: '30–35đ (Tiết kiệm lớn / Xuất sắc)', minScore: 30, maxScore: 35, san: 30, giua: 33, tran: 35 },
  ],
  SAFETY: [
    { rangeLabel: '0–9đ (Thiếu tin cậy / Sơ lược)', minScore: 0, maxScore: 9, san: 0, giua: 4, tran: 9 },
    { rangeLabel: '10–19đ (Số liệu sơ bộ / Thấp)', minScore: 10, maxScore: 19, san: 10, giua: 14, tran: 19 },
    { rangeLabel: '20–29đ (Đã xác nhận / Trung bình)', minScore: 20, maxScore: 29, san: 20, giua: 24, tran: 29 },
    { rangeLabel: '30–35đ (Triệt tiêu rủi ro cao)', minScore: 30, maxScore: 35, san: 30, giua: 33, tran: 35 },
  ],
};

export const CRITERIA_MAX_SCORES = {
  tc1: 35,
  tc2: 20,
  tc3: 20,
  tc4: 15,
  tc5: 10,
};

export const CRITERIA_CAP_60_PERCENT = {
  tc1: 21, // 35 * 0.6
  tc2: 12, // 20 * 0.6
  tc3: 12, // 20 * 0.6
  tc4: 9,  // 15 * 0.6
  tc5: 6,  // 10 * 0.6
};

// Allowed score sets for strict validation
export const ALLOWED_TC1_SCORES = new Set([0, 4, 9, 10, 14, 19, 20, 21, 24, 29, 30, 33, 35]);
export const ALLOWED_TC2_SCORES = new Set([0, 5, 10, 12, 15, 20]);
export const ALLOWED_TC3_SCORES = new Set([0, 5, 10, 12, 15, 20]);
export const ALLOWED_TC4_SCORES = new Set([0, 3, 7, 9, 11, 15]);
export const ALLOWED_TC5_SCORES = new Set([0, 3, 6, 7, 10]);

export function isValidTc1Score(score: number): boolean {
  return ALLOWED_TC1_SCORES.has(score);
}

export function isValidTc2Score(score: number): boolean {
  return ALLOWED_TC2_SCORES.has(score);
}

export function isValidTc3Score(score: number): boolean {
  return ALLOWED_TC3_SCORES.has(score);
}

export function isValidTc4Score(score: number): boolean {
  return ALLOWED_TC4_SCORES.has(score);
}

export function isValidTc5Score(score: number): boolean {
  return ALLOWED_TC5_SCORES.has(score);
}

// Interface for Prerequisite Conditions Check
export interface ProposalPrereqs {
  p1_pass?: boolean; // 1. Đã triển khai thực tế
  p2_pass?: boolean; // 2. Có minh chứng trước và sau
  p3_pass?: boolean; // 3. Không vi phạm an toàn lao động
  p4_pass?: boolean; // 4. Không trùng lặp với cải tiến đã đạt giải trước
}

export interface PrereqCheckResult {
  isAllPass: boolean;
  failedConditions: string[];
  badges: string[];
}

/**
 * 1.1 Pure Function: Check 4 prerequisite conditions
 */
export function checkPrerequisites(prereqs: ProposalPrereqs): PrereqCheckResult {
  const p1 = prereqs.p1_pass !== false;
  const p2 = prereqs.p2_pass !== false;
  const p3 = prereqs.p3_pass !== false;
  const p4 = prereqs.p4_pass !== false;

  const failedConditions: string[] = [];
  const badges: string[] = [];

  if (!p1) {
    failedConditions.push('Chưa triển khai thực tế');
    badges.push('Chưa triển khai');
  }
  if (!p2) {
    failedConditions.push('Thiếu minh chứng trước và sau');
    badges.push('Thiếu minh chứng');
  }
  if (!p3) {
    failedConditions.push('Vi phạm an toàn lao động');
    badges.push('Vi phạm ATLĐ');
  }
  if (!p4) {
    failedConditions.push('Trùng lặp với bài đạt giải trước');
    badges.push('Trùng lặp');
  }

  const isAllPass = p1 && p2 && p3 && p4;

  return {
    isAllPass,
    failedConditions,
    badges,
  };
}

/**
 * 1.2 Pure Function: Get exact Milestone score for TC1
 */
export function getTc1MilestoneScore(
  group: Tc1Group,
  rangeIndex: number,
  milestone: Tc1Milestone
): number {
  const groupRanges = TC1_BAREM_CONFIG[group] || TC1_BAREM_CONFIG.PRODUCTIVITY;
  const range = groupRanges[rangeIndex] || groupRanges[0];
  if (milestone === 'SAN') return range.san;
  if (milestone === 'GIUA') return range.giua;
  return range.tran;
}

export interface CriteriaRawScores {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
}

export interface VerifiedFlags {
  c1Verified?: boolean;
  c2Verified?: boolean;
  c3Verified?: boolean;
  c4Verified?: boolean;
  c5Verified?: boolean;
}

export interface CalculatedScoresResult {
  c1Final: number;
  c2Final: number;
  c3Final: number;
  c4Final: number;
  c5Final: number;
  c1Capped: boolean;
  c2Capped: boolean;
  c3Capped: boolean;
  c4Capped: boolean;
  c5Capped: boolean;
  hasAnyCapped: boolean;
  totalScore: number;
  totalScoreRounded: number;
}

/**
 * 1.3 Pure Function: Cap scores at 60% max if unverified
 */
export function calculateCriteriaScores(
  raw: CriteriaRawScores,
  verified: VerifiedFlags
): CalculatedScoresResult {
  // Validate maximum limits first
  const c1Valid = Math.min(Math.max(0, raw.c1 || 0), CRITERIA_MAX_SCORES.tc1);
  const c2Valid = Math.min(Math.max(0, raw.c2 || 0), CRITERIA_MAX_SCORES.tc2);
  const c3Valid = Math.min(Math.max(0, raw.c3 || 0), CRITERIA_MAX_SCORES.tc3);
  const c4Valid = Math.min(Math.max(0, raw.c4 || 0), CRITERIA_MAX_SCORES.tc4);
  const c5Valid = Math.min(Math.max(0, raw.c5 || 0), CRITERIA_MAX_SCORES.tc5);

  const c1Verified = verified.c1Verified !== false;
  const c2Verified = verified.c2Verified !== false;
  const c3Verified = verified.c3Verified !== false;
  const c4Verified = verified.c4Verified !== false;
  const c5Verified = verified.c5Verified !== false;

  const c1Capped = !c1Verified && c1Valid > CRITERIA_CAP_60_PERCENT.tc1;
  const c2Capped = !c2Verified && c2Valid > CRITERIA_CAP_60_PERCENT.tc2;
  const c3Capped = !c3Verified && c3Valid > CRITERIA_CAP_60_PERCENT.tc3;
  const c4Capped = !c4Verified && c4Valid > CRITERIA_CAP_60_PERCENT.tc4;
  const c5Capped = !c5Verified && c5Valid > CRITERIA_CAP_60_PERCENT.tc5;

  const c1Final = c1Capped ? CRITERIA_CAP_60_PERCENT.tc1 : c1Valid;
  const c2Final = c2Capped ? CRITERIA_CAP_60_PERCENT.tc2 : c2Valid;
  const c3Final = c3Capped ? CRITERIA_CAP_60_PERCENT.tc3 : c3Valid;
  const c4Final = c4Capped ? CRITERIA_CAP_60_PERCENT.tc4 : c4Valid;
  const c5Final = c5Capped ? CRITERIA_CAP_60_PERCENT.tc5 : c5Valid;

  const totalScore = c1Final + c2Final + c3Final + c4Final + c5Final;
  const totalScoreRounded = Math.round(totalScore * 10) / 10;

  return {
    c1Final,
    c2Final,
    c3Final,
    c4Final,
    c5Final,
    c1Capped,
    c2Capped,
    c3Capped,
    c4Capped,
    c5Capped,
    hasAnyCapped: c1Capped || c2Capped || c3Capped || c4Capped || c5Capped,
    totalScore,
    totalScoreRounded,
  };
}

/**
 * 1.3 Pure Function: Check judge discrepancy > 15
 */
export function checkJudgeDiscrepancy(
  judge1Total: number,
  judge2Total: number
): { isFlagged: boolean; discrepancy: number; officialScore: number; officialScoreRounded: number } {
  const discrepancy = Math.abs(judge1Total - judge2Total);
  const isFlagged = discrepancy > DISCREPANCY_LIMIT;
  const officialScore = (judge1Total + judge2Total) / 2;
  const officialScoreRounded = Math.round(officialScore * 10) / 10;

  return {
    isFlagged,
    discrepancy: Math.round(discrepancy * 10) / 10,
    officialScore,
    officialScoreRounded,
  };
}

export interface IndividualProposalScoringItem {
  id: string;
  title: string;
  unit: string;
  prereqs: ProposalPrereqs;
  totalScore: number;
  c1Score: number;
  c2Score: number;
  c3Score: number;
  c4Score: number;
  c5Score: number;
  isFlagged?: boolean;
  gk1Score?: number;
  gk2Score?: number;
  cappedInfo?: string;
  [key: string]: any;
}

export interface RankedProposalResult extends IndividualProposalScoringItem {
  rank: number;
  totalScoreRounded: number;
  statusText: 'Hợp lệ' | 'Bị loại' | 'Gắn cờ';
  isDisqualified: boolean;
}

/**
 * 1.4 Pure Function: Proposal Ranking with exact Tie-breaking rules
 */
export function rankIndividualProposals(
  proposals: IndividualProposalScoringItem[]
): RankedProposalResult[] {
  const processed = proposals.map((p) => {
    const prereqCheck = checkPrerequisites(p.prereqs || {});
    const isDisqualified = !prereqCheck.isAllPass;

    let isFlagged = Boolean(p.isFlagged);
    if (!isFlagged && p.gk1Score !== undefined && p.gk2Score !== undefined) {
      isFlagged = checkJudgeDiscrepancy(p.gk1Score, p.gk2Score).isFlagged;
    }

    const totalScoreRounded = Math.round(Number(p.totalScore || 0) * 10) / 10;

    let statusText: 'Hợp lệ' | 'Bị loại' | 'Gắn cờ' = 'Hợp lệ';
    if (isDisqualified) {
      statusText = 'Bị loại';
    } else if (isFlagged) {
      statusText = 'Gắn cờ';
    }

    return {
      ...p,
      isDisqualified,
      isFlagged,
      totalScoreRounded,
      statusText,
      prereqBadges: prereqCheck.badges,
      failedConditions: prereqCheck.failedConditions,
    };
  });

  // Valid proposals to be ranked
  const validList = processed.filter((p) => !p.isDisqualified);
  const disqualifiedList = processed.filter((p) => p.isDisqualified);

  // Tie-breaker sorting for valid proposals:
  // 1. Total Score DESC (after rounding to 1 decimal place)
  // 2. Higher TC1 score DESC
  // 3. Higher TC3 score DESC
  validList.sort((a, b) => {
    if (b.totalScoreRounded !== a.totalScoreRounded) {
      return b.totalScoreRounded - a.totalScoreRounded;
    }
    if ((b.c1Score || 0) !== (a.c1Score || 0)) {
      return (b.c1Score || 0) - (a.c1Score || 0);
    }
    if ((b.c3Score || 0) !== (a.c3Score || 0)) {
      return (b.c3Score || 0) - (a.c3Score || 0);
    }
    return 0;
  });

  // Assign ranks (handle tie -> same rank)
  let currentRank = 1;
  const rankedValid: RankedProposalResult[] = validList.map((item, index) => {
    if (index > 0) {
      const prev = validList[index - 1];
      const isTie =
        item.totalScoreRounded === prev.totalScoreRounded &&
        (item.c1Score || 0) === (prev.c1Score || 0) &&
        (item.c3Score || 0) === (prev.c3Score || 0);

      if (!isTie) {
        currentRank = index + 1;
      }
    } else {
      currentRank = 1;
    }

    return {
      ...item,
      rank: currentRank,
    };
  });

  // Disqualified entries get rank 0
  const rankedDisqualified: RankedProposalResult[] = disqualifiedList.map((item) => ({
    ...item,
    rank: 0,
  }));

  return [...rankedValid, ...rankedDisqualified];
}

/**
 * 2. COLLECTIVE UNIT MOVEMENT RANKING (XẾP HẠNG GIẢI TẬP THỂ - 100 PTS)
 */

export interface UnitRawInputData {
  unitName: string;
  totalEmployees: number; // Tổng NLĐ của đơn vị
  proposals: Array<{
    id: string;
    proposerCode: string; // Mã nhân viên người nộp
    prereqs: ProposalPrereqs;
    isFinalist?: boolean; // Bài lọt chung khảo
  }>;
}

export interface UnitMetricScore {
  actualRatePercent: number; // % thực tế
  actualRateFormatted: string; // Chuỗi hiển thị % hoặc "—"
  score: number; // Điểm đạt được
  scoreFormatted: string;
  maxScore: number;
}

export interface UnitScoringResult {
  unitName: string;
  totalEmployees: number;
  totalSubmitted: number;
  validProposalsCount: number;
  distinctValidParticipants: number;
  finalistProposalsCount: number;
  isQualifiedForAward: boolean;
  qualificationNote: string;
  participationMetric: UnitMetricScore;
  qualifiedMetric: UnitMetricScore;
  finalistMetric: UnitMetricScore;
  totalCollectiveScore: number;
  totalCollectiveScoreRounded: number;
  rank: number;
  awardTitle?: 'Xuất sắc' | 'Tích cực';
}

/**
 * 2.1 Pure Functions: Linear Interpolation for Collective Metrics
 */

// Metric 1: Tỷ lệ tham gia (Max 50đ, Floor 15% -> 30đ, Ceiling ≥40% -> 50đ)
export function calculateParticipationScore(distinctValidParticipants: number, totalEmployees: number): UnitMetricScore {
  const maxScore = 50;
  if (!totalEmployees || totalEmployees <= 0) {
    return { actualRatePercent: 0, actualRateFormatted: '—', score: 0, scoreFormatted: '0.0đ', maxScore };
  }

  const ratePercent = (distinctValidParticipants / totalEmployees) * 100;
  let score = 0;

  if (ratePercent >= 40) {
    score = 50;
  } else if (ratePercent >= 15) {
    // Linear interpolation: 30 + (rate - 15) / (40 - 15) * (50 - 30)
    score = 30 + ((ratePercent - 15) / (40 - 15)) * (50 - 30);
  } else {
    score = 0; // BELOW_FLOOR_POLICY = 'ZERO'
  }

  score = Math.round(score * 10) / 10;

  return {
    actualRatePercent: Math.round(ratePercent * 10) / 10,
    actualRateFormatted: `${(Math.round(ratePercent * 10) / 10).toFixed(1)}%`,
    score,
    scoreFormatted: `${score.toFixed(1)}đ`,
    maxScore,
  };
}

// Metric 2: Tỷ lệ hồ sơ đạt chuẩn (Max 30đ, Floor 50% -> 18đ, Ceiling 100% -> 30đ)
export function calculateQualifiedProposalScore(validProposals: number, totalSubmitted: number): UnitMetricScore {
  const maxScore = 30;
  if (!totalSubmitted || totalSubmitted <= 0) {
    return { actualRatePercent: 0, actualRateFormatted: '—', score: 0, scoreFormatted: '0.0đ', maxScore };
  }

  const ratePercent = (validProposals / totalSubmitted) * 100;
  let score = 0;

  if (ratePercent >= 100) {
    score = 30;
  } else if (ratePercent >= 50) {
    // Linear interpolation: 18 + (rate - 50) / (100 - 50) * (30 - 18)
    score = 18 + ((ratePercent - 50) / (100 - 50)) * (30 - 18);
  } else {
    score = 0; // BELOW_FLOOR_POLICY = 'ZERO'
  }

  score = Math.round(score * 10) / 10;

  return {
    actualRatePercent: Math.round(ratePercent * 10) / 10,
    actualRateFormatted: `${(Math.round(ratePercent * 10) / 10).toFixed(1)}%`,
    score,
    scoreFormatted: `${score.toFixed(1)}đ`,
    maxScore,
  };
}

// Metric 3: Tỷ lệ lọt chung khảo (Max 20đ, Floor 20% -> 10đ, Ceiling ≥50% -> 20đ)
export function calculateFinalistProposalScore(finalistProposals: number, totalSubmitted: number): UnitMetricScore {
  const maxScore = 20;
  if (!totalSubmitted || totalSubmitted <= 0) {
    return { actualRatePercent: 0, actualRateFormatted: '—', score: 0, scoreFormatted: '0.0đ', maxScore };
  }

  const ratePercent = (finalistProposals / totalSubmitted) * 100;
  let score = 0;

  if (ratePercent >= 50) {
    score = 20;
  } else if (ratePercent >= 20) {
    // Linear interpolation: 10 + (rate - 20) / (50 - 20) * (20 - 10)
    score = 10 + ((ratePercent - 20) / (50 - 20)) * (20 - 10);
  } else {
    score = 0; // BELOW_FLOOR_POLICY = 'ZERO'
  }

  score = Math.round(score * 10) / 10;

  return {
    actualRatePercent: Math.round(ratePercent * 10) / 10,
    actualRateFormatted: `${(Math.round(ratePercent * 10) / 10).toFixed(1)}%`,
    score,
    scoreFormatted: `${score.toFixed(1)}đ`,
    maxScore,
  };
}

/**
 * 2.2 Pure Function: Calculate Collective Movement Score for a Unit
 */
export function calculateUnitMovementScore(rawUnit: UnitRawInputData): Omit<UnitScoringResult, 'rank' | 'awardTitle'> {
  const totalSubmitted = rawUnit.proposals ? rawUnit.proposals.length : 0;

  // Filter valid proposals meeting all 4 prerequisite conditions
  const validProposals = (rawUnit.proposals || []).filter((p) => checkPrerequisites(p.prereqs || {}).isAllPass);
  const validProposalsCount = validProposals.length;

  // Count DISTINCT participants with >= 1 valid proposal (Rule: 1 person counted ONCE)
  const validParticipantSet = new Set<string>();
  validProposals.forEach((p) => {
    if (p.proposerCode) {
      validParticipantSet.add(String(p.proposerCode).trim().toUpperCase());
    }
  });
  const distinctValidParticipants = validParticipantSet.size;

  // Count finalist proposals
  const finalistProposalsCount = (rawUnit.proposals || []).filter((p) => p.isFinalist).length;

  // 2.2 Award qualification check (Must have >= 3 valid proposals per month)
  const isQualifiedForAward = validProposalsCount >= MIN_PROPOSALS_FOR_AWARD;
  const qualificationNote = isQualifiedForAward
    ? 'Đủ điều kiện xét giải'
    : `Chưa đủ điều kiện xét giải (${validProposalsCount}/${MIN_PROPOSALS_FOR_AWARD} bài)`;

  // Calculate the 3 metrics
  const participationMetric = calculateParticipationScore(distinctValidParticipants, rawUnit.totalEmployees);
  const qualifiedMetric = calculateQualifiedProposalScore(validProposalsCount, totalSubmitted);
  const finalistMetric = calculateFinalistProposalScore(finalistProposalsCount, totalSubmitted);

  const totalCollectiveScore = participationMetric.score + qualifiedMetric.score + finalistMetric.score;
  const totalCollectiveScoreRounded = Math.round(totalCollectiveScore * 10) / 10;

  return {
    unitName: rawUnit.unitName,
    totalEmployees: rawUnit.totalEmployees,
    totalSubmitted,
    validProposalsCount,
    distinctValidParticipants,
    finalistProposalsCount,
    isQualifiedForAward,
    qualificationNote,
    participationMetric,
    qualifiedMetric,
    finalistMetric,
    totalCollectiveScore,
    totalCollectiveScoreRounded,
  };
}

/**
 * 2.3 Pure Function: Rank Collective Units and Assign Titles ("Xuất sắc", "Tích cực")
 */
export function rankCollectiveUnits(units: UnitRawInputData[]): UnitScoringResult[] {
  const calculatedUnits = units.map(calculateUnitMovementScore);

  const qualifiedUnits = calculatedUnits.filter((u) => u.isQualifiedForAward);
  const unqualifiedUnits = calculatedUnits.filter((u) => !u.isQualifiedForAward);

  // Sort qualified units DESC by totalCollectiveScoreRounded
  qualifiedUnits.sort((a, b) => b.totalCollectiveScoreRounded - a.totalCollectiveScoreRounded);

  const rankedQualified: UnitScoringResult[] = qualifiedUnits.map((u, idx) => {
    const rank = idx + 1;
    let awardTitle: 'Xuất sắc' | 'Tích cực' | undefined = undefined;
    if (rank === 1) awardTitle = 'Xuất sắc';
    else if (rank === 2) awardTitle = 'Tích cực';

    return {
      ...u,
      rank,
      awardTitle,
    };
  });

  const rankedUnqualified: UnitScoringResult[] = unqualifiedUnits.map((u) => ({
    ...u,
    rank: 0,
  }));

  return [...rankedQualified, ...rankedUnqualified];
}
