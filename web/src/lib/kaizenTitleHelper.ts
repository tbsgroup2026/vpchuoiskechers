const KNOWN_CODE_TITLES: Record<string, string> = {
  "CI-2026-001": "Tán nút ô dê bằng máy tán bán tự động",
  "CI-2026-002": "Tăng số đôi trên khuôn in lô gô chắn bùn ngoài",
  "CI-2026-003": "Số hóa quy trình duyệt đăng ký sáng kiến Kaizen realtime",
};

export function isGenericTitle(title: string): boolean {
  if (!title) return true;
  const trimmed = title.trim();
  if (trimmed === "Sáng kiến cải tiến Kaizen" || trimmed === "Ý tưởng đề xuất cải tiến Kaizen") return true;
  if (/^Sáng kiến (Tăng Năng suất|MMTB CCDC|Tự động hoá|Chất lượng|An toàn|5S|Cải tiến|Môi trường|Chi phí|Quản lý) -/i.test(trimmed)) return true;
  if (/^Sáng kiến .* - .* \([^)]+\)$/i.test(trimmed)) return true;
  return false;
}

export function getKaizenDisplayTitle(p: any): string {
  if (!p) return "Sáng kiến cải tiến Kaizen";

  const rawTitle = (p.title && String(p.title).trim()) || p.tieu_de || p.name || "";
  if (rawTitle && !isGenericTitle(rawTitle)) {
    return rawTitle;
  }

  const code = (p.code || p.id || "").trim();
  if (code && KNOWN_CODE_TITLES[code]) {
    return KNOWN_CODE_TITLES[code];
  }

  const beforeDesc = (p.before_description && String(p.before_description).trim()) || "";
  if (beforeDesc && !beforeDesc.includes("Chưa có mô tả") && beforeDesc.length > 5) {
    return beforeDesc.length > 75 ? `${beforeDesc.substring(0, 72)}...` : beforeDesc;
  }

  const afterSol = (p.after_solution && String(p.after_solution).trim()) || "";
  if (afterSol && !afterSol.includes("Chưa có mô tả") && !afterSol.includes("Đề xuất đăng ký") && afterSol.length > 5) {
    return afterSol.length > 75 ? `${afterSol.substring(0, 72)}...` : afterSol;
  }

  if (rawTitle) return rawTitle;

  const cat = p.category_label || p.category || "";
  let catClean = String(cat).replace(/^\d+\.\s*/, "").trim();
  if (!catClean || catClean === "PRODUCTIVITY") catClean = "Tăng Năng suất";
  if (catClean === "EQUIPMENT") catClean = "MMTB CCDC";
  if (catClean === "AUTOMATION") catClean = "Tự động hoá";

  const lineDept = [p.line, p.department].filter((s) => Boolean(s && String(s).trim())).join(" - ") || p.factory || p.region || "Nhà Máy Miền Đông";
  const proposer = p.proposer_name || (p.proposer_emp_code ? `MSNV ${p.proposer_emp_code}` : "");

  if (proposer) {
    return `Sáng kiến ${catClean} - ${lineDept} (${proposer})`;
  }
  return `Sáng kiến ${catClean} - ${lineDept}`;
}

export function getKaizenBeforeDescription(p: any): string {
  if (!p) return "";
  const desc = (p.before_description || p.beforeDescription || "").trim();
  return desc;
}

export function getKaizenAfterSolution(p: any): string {
  if (!p) return "";
  const sol = (p.after_solution || p.afterSolution || "").trim();
  return sol;
}


