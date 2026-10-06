// web/src/lib/rbac.ts

export const MODULE_ACCESS: Record<string, string[]> = {
  // Lễ Tân chỉ được phép truy cập 3 module cơ bản (và trang con liên quan)
  LE_TAN: ["home", "my-tasks", "my_tasks", "hr"],
  RECEPTIONIST: ["home", "my-tasks", "my_tasks", "hr"],
  
  // BGK (Guest Judge)
  JUDGE_GUEST: ["home", "ci"],
};

/**
 * Hàm chuẩn hóa role từ user object
 */
export const getNormalizedRoles = (activeUser: any, sysUser: any = null): string[] => {
  if (!activeUser && !sysUser) return ["GUEST"];
  
  const roles = new Set<string>();
  
  const addRole = (r?: string) => {
    if (r) roles.add(r.trim().toUpperCase());
  };

  addRole(activeUser?.roleCode);
  addRole(activeUser?.role_code);
  addRole(sysUser?.roleCode);

  if (Array.isArray(activeUser?.roles)) {
    activeUser.roles.forEach(addRole);
  }
  if (Array.isArray(sysUser?.roles)) {
    sysUser.roles.forEach(addRole);
  }

  // Fallback for receptionist based on title/dept if roleCode is missing
  const title = (activeUser?.title || sysUser?.title || "").toUpperCase();
  const dept = (activeUser?.department || sysUser?.department || "").toUpperCase();
  if (title.includes("LỄ TÂN") || dept.includes("LỄ TÂN")) {
    roles.add("LE_TAN");
  }

  return Array.from(roles);
};

/**
 * Trả về danh sách các module ID được phép dựa trên cấu hình tập trung.
 * Nếu trả về mảng rỗng hoặc chứa "ALL", nghĩa là được full quyền (Admin/Exec).
 */
export const getAllowedModules = (activeUser: any, sysUser: any = null): string[] | "ALL" => {
  const roles = getNormalizedRoles(activeUser, sysUser);
  
  // 1. Kiểm tra Admin / System Admin
  if (
    roles.includes("SUPER_ADMIN") || 
    roles.includes("ADMIN") || 
    roles.includes("SYSTEM_ADMIN") ||
    roles.includes("SUPERADMIN") ||
    activeUser?.roleLevel === 1 ||
    sysUser?.roleLevel === 1
  ) {
    return "ALL";
  }

  // 2. Executive Board
  const mgmtLevel = activeUser?.managementLevel || sysUser?.roleLevel || 4;
  const isExec = 
    mgmtLevel <= 2 || 
    roles.includes("CEO") || 
    roles.includes("TONG_GIAM_DOC") || 
    roles.includes("GIAM_DOC") ||
    roles.includes("PHO_GIAM_DOC");
    
  if (isExec) {
    return "ALL";
  }

  // 3. Kiểm tra các Role bị giới hạn chặt chẽ trong MODULE_ACCESS (như Lễ Tân, BGK)
  let strictAllowedModules: string[] | null = null;
  for (const r of roles) {
    if (MODULE_ACCESS[r]) {
      // Hợp nhất các module được phép nếu user có nhiều role giới hạn
      if (!strictAllowedModules) strictAllowedModules = [];
      strictAllowedModules = [...new Set([...strictAllowedModules, ...MODULE_ACCESS[r]])];
    }
  }
  
  // Nếu user thuộc role bị giới hạn (Lễ Tân), CHỈ trả về các module trong cấu hình
  if (strictAllowedModules !== null) {
    return strictAllowedModules;
  }

  // 4. Nếu là nhân viên thường hoặc Trưởng phòng, trả về các module theo logic hiện tại
  const allowed = new Set(["home", "overview", "my-tasks", "tasks", "projects", "hr", "ci"]);
  
  const isTP = roles.includes("TRUONG_PHONG") || roles.includes("MANAGER") || roles.includes("DEPARTMENT_HEAD") || mgmtLevel === 3;
  if (isTP) {
    allowed.add("finance"); // Trưởng phòng được xem 1-5-2
  }
  
  const deptCode = (activeUser?.departmentCode || sysUser?.departmentCode || "").toUpperCase();
  const deptName = (activeUser?.department || sysUser?.department || "").toUpperCase();
  const empCode = (activeUser?.empCode || "").toUpperCase();
  
  if (roles.includes("ACCOUNTANT")) allowed.add("finance");
  if (roles.includes("QC") || deptCode.includes("QC") || deptName.includes("CHẤT LƯỢNG") || empCode.startsWith("QC")) {
    allowed.add("qc");
    allowed.add("gemba");
  }
  if (roles.includes("RD") || deptCode.includes("RD") || deptName.includes("R&D") || empCode.startsWith("RD")) {
    allowed.add("rd");
  }
  if (roles.includes("LOGISTICS") || deptCode.includes("LOGISTICS") || deptName.includes("VẬT TƯ") || empCode.startsWith("LG")) {
    allowed.add("logistics");
  }
  
  const isFactoryMgmt = roles.includes("MAINTENANCE") || roles.includes("TECHNICIAN") || deptCode.includes("BAO_TRI") || deptName.includes("MÁY MÓC") || isTP || roles.includes("FACTORY_MANAGER") || roles.includes("SUPERVISOR");
  if (isFactoryMgmt) {
    allowed.add("production");
    allowed.add("production-output");
  }

  // Trưởng phòng không được xem gemba
  if (isTP) allowed.delete("gemba");
  
  allowed.add("my_tasks"); // alias for my-tasks
  
  return Array.from(allowed);
};
