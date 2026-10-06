import { describe, it, expect } from "vitest";
import { normalizeKaizenSyncPayload, extractCategoryGroup } from "../lib/kaizenDataContract";

describe("Kaizen Data Contract & Normalization", () => {
  it("extracts category groups correctly for all categories (1-7)", () => {
    expect(extractCategoryGroup("PRODUCTIVITY", "3.Tăng Năng suất")).toBe("PRODUCTIVITY");
    expect(extractCategoryGroup("MATERIAL_SAVING", "1.Tiết kiệm Vật tư")).toBe("COST_SAVING");
    expect(extractCategoryGroup("COST_SAVING", "2.Tiết kiệm Chi phí")).toBe("COST_SAVING");
    expect(extractCategoryGroup("SAFETY", "4.An toàn lao động")).toBe("NON_FINANCIAL");
    expect(extractCategoryGroup("5S", "5.5S")).toBe("NON_FINANCIAL");
    expect(extractCategoryGroup("AUTOMATION", "6.Tự động hoá")).toBe("NON_FINANCIAL");
    expect(extractCategoryGroup("EQUIPMENT", "7.MMTB CCDC")).toBe("NON_FINANCIAL");
  });

  it("normalizes camelCase and Vietnamese field names without losing data", () => {
    const rawPayloadCaseA = {
      id: "ci_1789205869469_vawpy",
      code: "KZ-2026-KG1-MAY-0007",
      tieu_de: "Bỏ quét keo dán-chuyển may sống.",
      beforeDescription: "Bôi kao dán",
      afterSolution: "May sống",
      productCode: "KZ-2026-KG1-MAY-0004",
      category_label: "3.Tăng Năng suất",
      proposerEmpCode: "211006004",
      siteCode: "thkiengiangshoes",
    };

    const normA = normalizeKaizenSyncPayload(rawPayloadCaseA, "thkiengiangshoes");
    expect(normA.id).toBe("tkg_ci_1789205869469_vawpy");
    expect(normA.title).toBe("Bỏ quét keo dán-chuyển may sống.");
    expect(normA.before_description).toBe("Bôi kao dán");
    expect(normA.after_solution).toBe("May sống");
    expect(normA.product_code).toBe("KZ-2026-KG1-MAY-0004");
    expect(normA.proposer_emp_code).toBe("211006004");
    expect(normA.category_group).toBe("PRODUCTIVITY");
  });

  it("normalizes Case B MMTB CCDC non-financial savings proposal", () => {
    const rawPayloadCaseB = {
      id: "ci_1788493379259_sip7v",
      code: "KZ-2026-PHNG-BPHN-0005",
      title: "CẢI THIỆN NHIỆT ĐỔ MÁY NÉN KHÍ, NĂNG CAO HIỆU SUẤT CHO MÁY",
      before_description: "MÁY NÉN KHÍ CHẠY LIÊN TỤC, KHÔNG ĐẠT ÁP SUẤT CÀI ĐẶT.",
      after_solution: "LẮP ỐNG HÚT GIÓ TƯƠI CHO MÁY VÀ ỐNG THẢI GIÓ NÓNG RA NGOÀI.",
      category: "EQUIPMENT",
      category_label: "7.MMTB CCDC",
      tong_tien_tiet_kiem: 2853792,
      proposer_emp_code: "402607027",
    };

    const normB = normalizeKaizenSyncPayload(rawPayloadCaseB, "thkiengiangshoes");
    expect(normB.title).toBe("CẢI THIỆN NHIỆT ĐỔ MÁY NÉN KHÍ, NĂNG CAO HIỆU SUẤT CHO MÁY");
    expect(normB.before_description).toBe("MÁY NÉN KHÍ CHẠY LIÊN TỤC, KHÔNG ĐẠT ÁP SUẤT CÀI ĐẶT.");
    expect(normB.after_solution).toBe("LẮP ỐNG HÚT GIÓ TƯƠI CHO MÁY VÀ ỐNG THẢI GIÓ NÓNG RA NGOÀI.");
    expect(normB.total_savings_vnd).toBe(2853792);
    expect(normB.category_group).toBe("NON_FINANCIAL");
  });
});
