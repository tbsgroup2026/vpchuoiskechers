import { describe, expect, it } from "vitest";
import { SCM_DEPTS, type OwnerDept, type ScmDept } from "../config";
import {
  DEFAULT_MATRIX,
  OWNER_SCREEN,
  SCREENS,
  applyOverrides,
  canApprovePermissions,
  canEditStep,
  isLockedCell,
  mapUserToDept,
  resolveAccess,
  type ScreenKey,
} from "../permissions";

const user = (depts: ScmDept[], extra: Partial<{ isHead: boolean; bypass: boolean }> = {}) => ({ depts, isHead: false, bypass: false, ...extra });
const OWN_SCREEN: Partial<Record<ScmDept, ScreenKey>> = { KH: "planning", MH: "purchasing", KHO: "warehouse", KDCNQC: "kdcnqc", SH: "digital" };

describe("Ma trận mặc định, lặp qua mọi phòng ban × mọi màn hình", () => {
  for (const dept of SCM_DEPTS) {
    for (const { key: screen } of SCREENS) {
      it(`${dept} · ${screen}`, () => {
        const a = resolveAccess(user([dept]), screen);
        if (screen === "progress") expect(a).toBe("view");
        else if (dept === "BDH") expect(a).toBe("view");
        else if (screen === "kpi") expect(a).toBe("view");
        else if (OWN_SCREEN[dept] === screen || (dept === "SH" && screen === "permissions")) expect(a).toBe("edit");
        else expect(a).toBe("lock");
      });
    }
  }

  it("mỗi màn nghiệp vụ có đúng một phòng được Sửa", () => {
    for (const s of ["planning", "purchasing", "warehouse", "kdcnqc", "digital"] as ScreenKey[]) {
      expect(SCM_DEPTS.filter((d) => DEFAULT_MATRIX[s][d] === "edit")).toHaveLength(1);
    }
  });

  it("không ai được Sửa Tiến độ chung", () => {
    for (const d of SCM_DEPTS) expect(resolveAccess(user([d]), "progress")).toBe("view");
  });

  it("người chưa map phòng ban chỉ xem Tiến độ chung và KPI", () => {
    for (const { key } of SCREENS) {
      expect(resolveAccess(user([]), key)).toBe(key === "progress" || key === "kpi" ? "view" : "lock");
    }
  });

  it("tài khoản dev/control bỏ qua kiểm tra quyền", () => {
    for (const { key } of SCREENS) expect(resolveAccess(user([], { bypass: true }), key)).toBe("edit");
  });

  it("người thuộc nhiều phòng lấy quyền cao nhất", () => {
    expect(resolveAccess(user(["KH", "MH"]), "purchasing")).toBe("edit");
    expect(resolveAccess(user(["KH", "MH"]), "planning")).toBe("edit");
  });
});

describe("Thay đổi phân quyền", () => {
  it("ô khóa (dòng Tiến độ chung, cột Ban điều hành) không đổi được", () => {
    const m = applyOverrides([
      { screen: "progress", dept: "KH", access: "edit" },
      { screen: "planning", dept: "BDH", access: "edit" },
      { screen: "planning", dept: "MH", access: "view" },
      { screen: "nope", dept: "KH", access: "edit" },
      { screen: "planning", dept: "KHO", access: "admin" },
    ]);
    expect(m.progress.KH).toBe("view");
    expect(m.planning.BDH).toBe("view");
    expect(m.planning.MH).toBe("view");
    expect(m.planning.KHO).toBe("lock");
    expect(isLockedCell("progress", "SH")).toBe(true);
    expect(isLockedCell("planning", "BDH")).toBe(true);
    expect(isLockedCell("planning", "KH")).toBe(false);
  });

  it("chỉ Ban điều hành (hoặc tài khoản dev) duyệt được thay đổi", () => {
    for (const d of SCM_DEPTS) expect(canApprovePermissions(user([d]))).toBe(d === "BDH");
    expect(canApprovePermissions(user([], { bypass: true }))).toBe(true);
  });

  it("cờ 'Số hóa xem nghiệp vụ' chỉ mở quyền Xem, không mở quyền Sửa", () => {
    expect(resolveAccess(user(["SH"]), "warehouse")).toBe("lock");
    expect(resolveAccess(user(["SH"]), "warehouse", DEFAULT_MATRIX, { digitalCanViewBusiness: true })).toBe("view");
    expect(resolveAccess(user(["KH"]), "warehouse", DEFAULT_MATRIX, { digitalCanViewBusiness: true })).toBe("lock");
  });
});

describe("Xác nhận bước theo bộ phận giữ việc", () => {
  const owners: OwnerDept[] = ["KD", "CN", "QC", "KH", "MH", "KHO"];
  for (const dept of SCM_DEPTS) {
    it(`${dept} chỉ xác nhận được bước của phòng mình`, () => {
      for (const o of owners) {
        const expected = OWN_SCREEN[dept] === OWNER_SCREEN[o];
        expect(canEditStep(user([dept]), o)).toBe(expected);
      }
    });
  }
});

describe("Map người dùng vào phòng ban từ dữ liệu CB-CNV", () => {
  const cases: [string, ScmDept | null][] = [
    ["Phòng Kế Hoạch", "KH"],
    ["Bộ Phận Kế Hoạch Sản Xuất (PPC)", "KH"],
    ["Phòng Mua Hàng", "MH"],
    ["Kho Nguyên Phụ Liệu", "KHO"],
    ["Trung tâm phân phối", "KHO"],
    ["Khối Sản Xuất", null],
    ["Bộ Phận Chuyển Đổi Số & Kaizen", "SH"],
    ["Phòng Công Nghệ Thông Tin", "SH"],
    ["Bộ Phận Công Nghệ", "KDCNQC"],
    ["Bộ Phận Quản Lý Chất Lượng (QC)", "KDCNQC"],
    ["Phòng Kinh Doanh", "KDCNQC"],
    ["Ban Giám Đốc", "BDH"],
    ["", null],
  ];
  for (const [dept, expected] of cases) {
    it(`"${dept}" → ${expected}`, () => expect(mapUserToDept({ department: dept }).dept).toBe(expected));
  }

  it("VTCV có chữ Trưởng/Giám đốc là trưởng bộ phận", () => {
    expect(mapUserToDept({ department: "Phòng Kho", vtcv: "Trưởng phòng" }).isHead).toBe(true);
    expect(mapUserToDept({ department: "Phòng Kho", vtcv: "Nhân viên kho" }).isHead).toBe(false);
    expect(mapUserToDept({ department: "Ban Giám Đốc", title: "Giám đốc nhà máy" }).isHead).toBe(true);
  });
});

describe("Đoán nhà máy trực thuộc từ phòng ban", () => {
  it("nhận diện tên có dấu, không dấu và mã viết tắt", async () => {
    const { guessSiteFromText } = await import("../config");
    expect(guessSiteFromText("Phòng Kế hoạch - Nhà máy Kiên Giang 1")).toBe("KG1");
    expect(guessSiteFromText("XƯỞNG MŨI KG2")).toBe("KG2");
    expect(guessSiteFromText("kho nguyen lieu kg-3")).toBe("KG3");
    expect(guessSiteFromText("Nhà máy Miền Đông")).toBe("NMMD");
    expect(guessSiteFromText("Xưởng Hoàn thiện đế")).toBe("HTD");
    expect(guessSiteFromText("Phân xưởng Mẫu")).toBe("PXM");
    expect(guessSiteFromText("Văn phòng chuỗi SKECHERS")).toBe("VPC");
    expect(guessSiteFromText("Phòng Nhân sự")).toBe("");
    expect(guessSiteFromText("KG12 không phải KG1")).toBe("KG1");
  });
});
