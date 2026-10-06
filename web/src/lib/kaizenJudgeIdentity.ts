/**
 * Kaizen Judge Identity & Status Helper Module
 * Shared functions for consistent judge scoring badges, filters, and identity mapping.
 */

export interface JudgeIdentityKey {
  accountId: string;          // e.g. "BGK02" or "202608001"
  declarerName: string;       // e.g. "LÊ KHẢI"
  declarerEmpCode: string;    // e.g. "202112003"
  isGuestShared: boolean;     // true if shared account like BGK02
  roleCode?: string;          // e.g. "JUDGE_GUEST" or "SUPER_ADMIN"
}

export interface JudgeScoreInfo {
  totalScore: number;
  isLocked: boolean;
  c1Score?: number;
  c2Score?: number;
  c3Score?: number;
  c4Score?: number;
  c5Score?: number;
}

export type JudgeEntryStatusType = "SCORED" | "DRAFT" | "UNSCORED";

export interface JudgeEntryStatusResult {
  status: JudgeEntryStatusType;
  score: number | null;
  label: string;
  badgeClass: string;
}

/**
 * Extract active judge identity from current session (both standard login & guest session)
 */
export function getClientJudgeIdentity(currentUser?: any): JudgeIdentityKey {
  let accountId = "";
  let declarerName = "";
  let declarerEmpCode = "";
  let isGuestShared = false;
  let roleCode = "";

  if (typeof window !== "undefined") {
    // 1. Check guest session first
    try {
      const gRaw = localStorage.getItem("tbs_guest_session") || sessionStorage.getItem("tbs_guest_session");
      if (gRaw) {
        const g = JSON.parse(gRaw);
        accountId = g.username || g.empCode || g.id || "";
        declarerName = g.full_name || g.fullName || g.declarerName || g.name || "";
        declarerEmpCode = g.msnv || g.realScorerEmpCode || g.empCode || "";
        isGuestShared = true;
        roleCode = "JUDGE_GUEST";
      }
    } catch (e) {}

    // 2. Check current user if not guest session
    if (!accountId) {
      try {
        const uRaw = sessionStorage.getItem("tbs_current_user") || localStorage.getItem("tbs_current_user");
        if (uRaw) {
          const u = JSON.parse(uRaw);
          accountId = u.username || u.empCode || "";
          declarerName = u.name || "";
          declarerEmpCode = u.empCode || "";
          roleCode = u.roleCode || "";
          isGuestShared = Boolean(u.isGuest || (accountId && accountId.toUpperCase().startsWith("BGK")));
        }
      } catch (e) {}
    }
  }

  // Fallback to passed currentUser prop
  if (!accountId && currentUser) {
    accountId = currentUser.username || currentUser.empCode || "";
    declarerName = currentUser.name || "";
    declarerEmpCode = currentUser.empCode || "";
    roleCode = currentUser.roleCode || "";
    isGuestShared = Boolean(currentUser.isGuest || (accountId && accountId.toUpperCase().startsWith("BGK")));
  }

  return {
    accountId: accountId.trim().toUpperCase(),
    declarerName: declarerName.trim(),
    declarerEmpCode: declarerEmpCode.trim().toUpperCase(),
    isGuestShared,
    roleCode: roleCode.toUpperCase(),
  };
}

/**
 * Check if the viewer is currently acting as a Judge (BGK or guest evaluator)
 */
export function isJudgeUser(identity: JudgeIdentityKey): boolean {
  if (!identity || !identity.accountId) return false;
  const acc = identity.accountId.toUpperCase();
  const role = (identity.roleCode || "").toUpperCase();
  return (
    acc.startsWith("BGK") ||
    role === "JUDGE_GUEST" ||
    role === "JUDGE" ||
    role === "GIAM_KHAO" ||
    identity.isGuestShared
  );
}

/**
 * Compute the single source of truth status for a proposal card/item
 */
export function getJudgeEntryStatus(
  proposal: any,
  myScoresMap: Record<string, JudgeScoreInfo> | null | undefined,
  isJudgeViewer: boolean = true
): JudgeEntryStatusResult {
  if (!proposal) {
    return {
      status: "UNSCORED",
      score: null,
      label: "🔴 Chưa chấm",
      badgeClass: "bg-[#fff0f0] text-rose-700 border border-rose-200 shadow-2xs",
    };
  }

  if (isJudgeViewer && myScoresMap) {
    const idStr = String(proposal.id || "").trim();
    const codeStr = String(proposal.code || "").trim();
    const cleanId = idStr.replace(/^ci_/i, "").replace(/^CI-/i, "");
    const cleanCode = codeStr.replace(/^CI-/i, "");

    const keys = [
      idStr,
      codeStr,
      idStr.toLowerCase(),
      codeStr.toLowerCase(),
      cleanId,
      cleanCode,
      `ci_${cleanId}`,
      `CI-${cleanCode}`,
      `ci_${cleanCode}`,
      `CI-${cleanId}`,
    ].filter(Boolean);

    let match: JudgeScoreInfo | null = null;
    for (const k of keys) {
      if (myScoresMap[k]) {
        match = myScoresMap[k];
        break;
      }
    }

    if (match) {
      if (match.isLocked === false) {
        return {
          status: "DRAFT",
          score: match.totalScore,
          label: `🟡 Đang chấm dở (${match.totalScore}đ)`,
          badgeClass: "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-extrabold",
        };
      }
      return {
        status: "SCORED",
        score: match.totalScore,
        label: "🟢 Đã chấm",
        badgeClass: "bg-emerald-600 text-white shadow-2xs font-black",
      };
    }

    return {
      status: "UNSCORED",
      score: null,
      label: "🔴 Chưa chấm",
      badgeClass: "bg-[#fff0f0] text-rose-700 border border-rose-200 shadow-2xs font-bold",
    };
  }

  // Non-judge viewer (Admin or general viewer): aggregate view
  const rawScore = (proposal as any).judge_final_score || proposal.score_points || (proposal as any).scorePoints || 0;
  const parsedScore = rawScore ? Number(String(rawScore).replace(",", ".")) : 0;
  const isGlobalScored = Boolean(
    parsedScore > 0 ||
    (proposal as any).sub_status === "DA_DANH_GIA" ||
    (proposal as any).trang_thai === "DA_DANH_GIA"
  );

  if (isGlobalScored) {
    return {
      status: "SCORED",
      score: parsedScore,
      label: "🟢 Đã chấm",
      badgeClass: "bg-emerald-700 text-white shadow-2xs font-black",
    };
  }

  return {
    status: "UNSCORED",
    score: null,
    label: "🔴 Chưa chấm",
    badgeClass: "bg-[#fff0f0] text-rose-700 border border-rose-200 shadow-2xs font-bold",
  };
}
