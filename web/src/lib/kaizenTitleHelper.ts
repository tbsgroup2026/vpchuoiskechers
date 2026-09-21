export function getKaizenDisplayTitle(p: any): string {
  if (!p) return "Sáng kiến cải tiến Kaizen";

  const rawTitle = (p.title && String(p.title).trim()) || p.tieu_de || p.name || "";

  // 1. Explicit title restoration for standard proposals
  if (p.code === "CI-2026-001" || p.id === "kz_nmmd_001" || p.code === "ACI-2026-001") {
    return "Tán nút ô dê bằng máy tán bán tự động";
  }
  if (p.code === "CI-2026-002" || p.id === "kz_nmmd_002" || p.code === "ACI-2026-002") {
    return "Tăng số đôi trên khuôn in lô gô chắn bùn ngoài mẫu 118433";
  }
  if (p.code === "CI-2026-003" || p.id === "kz_vpc_001" || p.code === "ACI-2026-003") {
    return "Số hóa quy trình duyệt đăng ký sáng kiến Kaizen realtime";
  }

  // 2. Check if title is custom and non-generic
  const isGeneric =
    !rawTitle ||
    rawTitle === "Sáng kiến cải tiến Kaizen" ||
    rawTitle === "Ý tưởng đề xuất cải tiến Kaizen" ||
    rawTitle === "Sáng kiến Cải tiến Kaizen" ||
    rawTitle.toLowerCase() === "sáng kiến cải tiến kaizen";

  if (!isGeneric) {
    return rawTitle;
  }

  // 3. Extract title from before_description if available
  const beforeDesc = (p.before_description && String(p.before_description).trim()) || "";
  if (beforeDesc && !beforeDesc.includes("Chưa có mô tả") && beforeDesc.length > 5) {
    return beforeDesc.length > 70 ? `Cải tiến: ${beforeDesc.substring(0, 68)}...` : `Cải tiến: ${beforeDesc}`;
  }

  // 4. Extract title from after_solution if available
  const afterSol = (p.after_solution && String(p.after_solution).trim()) || "";
  if (afterSol && !afterSol.includes("Chưa có mô tả") && !afterSol.includes("Đề xuất đăng ký") && afterSol.length > 5) {
    return afterSol.length > 70 ? `Giải pháp: ${afterSol.substring(0, 68)}...` : `Giải pháp: ${afterSol}`;
  }

  // 5. Build clean dynamic title from Category, Department/Line, and Proposer
  const cat = p.category_label || p.category || "";
  let catClean = String(cat).replace(/^\d+\.\s*/, "").trim();
  if (!catClean || catClean === "PRODUCTIVITY") catClean = "Tăng Năng suất";
  if (catClean === "EQUIPMENT") catClean = "MMTB CCDC";
  if (catClean === "AUTOMATION") catClean = "Tự động hoá";
  if (catClean === "MATERIAL_SAVING") catClean = "Tiết kiệm Vật tư";
  if (catClean === "COST_SAVING") catClean = "Tiết kiệm Chi phí";
  if (catClean === "SAFETY") catClean = "An toàn lao động";
  if (catClean === "5S") catClean = "5S";

  const lineDept = [p.line, p.department].filter((s) => Boolean(s && String(s).trim())).join(" - ") || p.factory || p.region || "Nhà Máy Miền Đông";
  const proposer = p.proposer_name || (p.proposer_emp_code ? `MSNV ${p.proposer_emp_code}` : "");

  if (proposer) {
    return `Sáng kiến ${catClean} - ${lineDept} (${proposer})`;
  }
  return `Sáng kiến ${catClean} - ${lineDept}`;
}

export function getKaizenBeforeDescription(p: any): string {
  if (!p) return "Chưa có mô tả hiện trạng lãng phí trước cải tiến.";

  const desc = (p.before_description || p.beforeDescription || "").trim();
  if (desc && !desc.includes("Chưa có mô tả hiện trạng lãng phí")) {
    return desc;
  }

  const title = getKaizenDisplayTitle(p);
  const dept = p.department || p.line || p.factory || p.region || "bộ phận sản xuất";
  return `Hiện trạng công đoạn/thao tác "${title}" tại ${dept} còn làm thủ công, tiêu tốn thời gian và có nguy cơ phát sinh lãng phí.`;
}

export function getKaizenAfterSolution(p: any): string {
  if (!p) return "Chưa có mô tả giải pháp sáng kiến cải tiến.";

  const sol = (p.after_solution || p.afterSolution || "").trim();
  if (sol && !sol.includes("Chưa có mô tả giải pháp sáng kiến")) {
    return sol;
  }

  const title = getKaizenDisplayTitle(p);
  const dept = p.department || p.line || p.factory || p.region || "bộ phận sản xuất";
  return `Đã triển khai cải tiến "${title}" giúp tối ưu hóa thao tác tại ${dept}, nâng cao năng suất và đảm bảo chất lượng.`;
}

