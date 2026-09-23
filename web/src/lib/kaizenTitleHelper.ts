export function getKaizenDisplayTitle(p: any): string {
  if (!p) return "Sáng kiến cải tiến Kaizen";

  const rawTitle = (p.title && String(p.title).trim()) || p.tieu_de || p.name || "";
  if (rawTitle) {
    return rawTitle;
  }

  const beforeDesc = (p.before_description && String(p.before_description).trim()) || "";
  if (beforeDesc && !beforeDesc.includes("Chưa có mô tả") && beforeDesc.length > 5) {
    return beforeDesc.length > 70 ? `Cải tiến: ${beforeDesc.substring(0, 68)}...` : `Cải tiến: ${beforeDesc}`;
  }

  const afterSol = (p.after_solution && String(p.after_solution).trim()) || "";
  if (afterSol && !afterSol.includes("Chưa có mô tả") && !afterSol.includes("Đề xuất đăng ký") && afterSol.length > 5) {
    return afterSol.length > 70 ? `Giải pháp: ${afterSol.substring(0, 68)}...` : `Giải pháp: ${afterSol}`;
  }

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

