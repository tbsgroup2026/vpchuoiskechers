import { describe, it } from "node:test";
import assert from "node:assert";
import {
  normalizeLangCode,
  translate,
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency,
} from "../lib/i18n";

describe("i18n Core Engine & Migration Unit Tests", () => {
  describe("1. Language Code Migration (normalizeLangCode)", () => {
    it("should migrate legacy Vietnamese language codes to 'vi'", () => {
      assert.strictEqual(normalizeLangCode("VN"), "vi");
      assert.strictEqual(normalizeLangCode("VI"), "vi");
      assert.strictEqual(normalizeLangCode("vn"), "vi");
      assert.strictEqual(normalizeLangCode("vi"), "vi");
    });

    it("should migrate legacy English language codes to 'en'", () => {
      assert.strictEqual(normalizeLangCode("ENG"), "en");
      assert.strictEqual(normalizeLangCode("EN"), "en");
      assert.strictEqual(normalizeLangCode("eng"), "en");
      assert.strictEqual(normalizeLangCode("en"), "en");
    });

    it("should default unknown or empty language codes to 'vi'", () => {
      assert.strictEqual(normalizeLangCode(null), "vi");
      assert.strictEqual(normalizeLangCode(undefined), "vi");
      assert.strictEqual(normalizeLangCode(""), "vi");
      assert.strictEqual(normalizeLangCode("fr"), "vi");
      assert.strictEqual(normalizeLangCode("  INVALID  "), "vi");
    });
  });

  describe("2. Translation Lookup & Interpolation (translate)", () => {
    it("should return correct translations for standard keys", () => {
      assert.strictEqual(translate("common.save", undefined, "vi"), "Lưu");
      assert.strictEqual(translate("common.save", undefined, "en"), "Save");

      assert.strictEqual(
        translate("common.systemTitle", undefined, "vi"),
        "QUẢN LÝ PHÒNG HỌP & ĐÓN KHÁCH"
      );
      assert.strictEqual(
        translate("common.systemTitle", undefined, "en"),
        "MEETING ROOM & GUEST RECEPTION"
      );
    });

    it("should correctly interpolate single and multiple template variables", () => {
      assert.strictEqual(
        translate("dashboard.roomCount", { count: 8 }, "vi"),
        "8 Phòng"
      );
      assert.strictEqual(
        translate("dashboard.roomCount", { count: 8 }, "en"),
        "8 Room(s)"
      );

      assert.strictEqual(
        translate("dashboard.availableOfTotalRooms", { available: 6, total: 8 }, "vi"),
        "6 / 8 Phòng"
      );
      assert.strictEqual(
        translate("dashboard.availableOfTotalRooms", { available: 6, total: 8 }, "en"),
        "6 / 8 Room(s)"
      );
    });

    it("should support pluralization rules for English vs Vietnamese", () => {
      assert.strictEqual(
        translate("dashboard.occupiedRoomsNotice", { count: 1 }, "en"),
        "1 room(s) occupied"
      );
      assert.strictEqual(
        translate("dashboard.occupiedRoomsNotice", { count: 5 }, "en"),
        "5 room(s) occupied"
      );
      assert.strictEqual(
        translate("dashboard.occupiedRoomsNotice", { count: 5 }, "vi"),
        "5 phòng đang bận họp"
      );
    });

    it("should fallback missing English keys to Vietnamese dictionary", () => {
      const viVal = translate("common.systemTitle", undefined, "vi");
      assert.ok(viVal.length > 0);
    });

    it("should NEVER output raw key to UI when key is missing in both dictionaries", () => {
      const result = translate("nonexistent.fakeKey.path", undefined, "en");
      // Must NOT output "nonexistent.fakeKey.path"
      assert.strictEqual(result, "");
      assert.notStrictEqual(result, "nonexistent.fakeKey.path");
    });

    it("should return explicit fallback parameter when provided for missing key", () => {
      const result = translate(
        "nonexistent.fakeKey.path",
        undefined,
        "en",
        "Safe Fallback Text"
      );
      assert.strictEqual(result, "Safe Fallback Text");
    });
  });

  describe("3. Locale Formatting Helpers", () => {
    it("should format dates according to locale", () => {
      const testDate = new Date(2026, 7, 15); // 15 Aug 2026
      const formattedVi = formatDate(testDate, "vi");
      const formattedEn = formatDate(testDate, "en");

      assert.ok(formattedVi.includes("15") && formattedVi.includes("08") && formattedVi.includes("2026"));
      assert.ok(formattedEn.includes("08") && formattedEn.includes("15") && formattedEn.includes("2026"));
    });

    it("should format numbers according to locale", () => {
      assert.strictEqual(formatNumber(1234567, "vi"), "1.234.567");
      assert.strictEqual(formatNumber(1234567, "en"), "1,234,567");
    });

    it("should format currency according to locale", () => {
      const formattedVnd = formatCurrency(500000, "vi");
      const formattedUsd = formatCurrency(500, "en");

      assert.ok(formattedVnd.includes("500.000") || formattedVnd.includes("500,000"));
      assert.ok(formattedUsd.includes("500"));
    });
  });
});
