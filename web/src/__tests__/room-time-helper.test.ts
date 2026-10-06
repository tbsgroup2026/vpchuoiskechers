import { describe, it, expect } from "vitest";
import {
  parseTimeToMinutes,
  formatMinutesTo24h,
  parseTimeSlot,
  parseDateParts,
  getVietnamNowParts,
  isMeetingTimePassed,
} from "../lib/roomTimeHelper";

describe("roomTimeHelper Unit Tests", () => {
  describe("parseTimeToMinutes", () => {
    it("parses 24h format HH:mm correctly", () => {
      expect(parseTimeToMinutes("13:30")).toBe(810);
      expect(parseTimeToMinutes("09:00")).toBe(540);
      expect(parseTimeToMinutes("00:00")).toBe(0);
      expect(parseTimeToMinutes("23:59")).toBe(1439);
    });

    it("parses Vietnamese 12h format CH/SA correctly", () => {
      expect(parseTimeToMinutes("01:30 CH")).toBe(810); // 13:30
      expect(parseTimeToMinutes("1:30 CH")).toBe(810);  // 13:30
      expect(parseTimeToMinutes("02:00 CH")).toBe(840); // 14:00
      expect(parseTimeToMinutes("09:15 SA")).toBe(555); // 09:15
      expect(parseTimeToMinutes("12:00 SA")).toBe(0);   // 00:00 midnight
      expect(parseTimeToMinutes("12:30 SA")).toBe(30);  // 00:30
      expect(parseTimeToMinutes("12:00 CH")).toBe(720); // 12:00 noon
      expect(parseTimeToMinutes("12:30 CH")).toBe(750); // 12:30
    });

    it("parses English 12h format AM/PM correctly", () => {
      expect(parseTimeToMinutes("01:30 PM")).toBe(810);
      expect(parseTimeToMinutes("09:15 AM")).toBe(555);
      expect(parseTimeToMinutes("12:00 AM")).toBe(0);
      expect(parseTimeToMinutes("12:00 PM")).toBe(720);
    });
  });

  describe("parseTimeSlot", () => {
    it("parses time slot with CH/SA format into 24h start & end times", () => {
      const res = parseTimeSlot("01:30 CH - 02:00 CH");
      expect(res.startMinutes).toBe(810);
      expect(res.endMinutes).toBe(840);
      expect(res.startTime24).toBe("13:30");
      expect(res.endTime24).toBe("14:00");
    });

    it("parses 24h time slot correctly", () => {
      const res = parseTimeSlot("13:30 - 14:00");
      expect(res.startMinutes).toBe(810);
      expect(res.endMinutes).toBe(840);
      expect(res.startTime24).toBe("13:30");
      expect(res.endTime24).toBe("14:00");
    });
  });

  describe("parseDateParts", () => {
    it("parses YYYY-MM-DD ISO format", () => {
      const res = parseDateParts("2026-10-05");
      expect(res.year).toBe(2026);
      expect(res.month).toBe(10);
      expect(res.day).toBe(5);
      expect(res.isoDate).toBe("2026-10-05");
      expect(res.vnDisplayDate).toBe("05/10/2026");
    });

    it("parses DD/MM/YYYY VN display format", () => {
      const res = parseDateParts("05/10/2026");
      expect(res.year).toBe(2026);
      expect(res.month).toBe(10);
      expect(res.day).toBe(5);
      expect(res.isoDate).toBe("2026-10-05");
      expect(res.vnDisplayDate).toBe("05/10/2026");
    });
  });

  describe("isMeetingTimePassed - User Real-World Bug Scenario", () => {
    it("CRITICAL FIX: 10:34 AM on 05/10/2026 booking for 13:30 - 14:00 on 05/10/2026 MUST BE SUCCESS (NOT PASSED)", () => {
      // Mock reference time: 10:34 AM Oct 5, 2026 UTC+7
      // 10:34 AM in UTC is 03:34 AM UTC
      const mockNow = new Date("2026-10-05T03:34:00.000Z");

      const check24h = isMeetingTimePassed("2026-10-05", "13:30 - 14:00", 5, mockNow);
      expect(check24h.isPassed).toBe(false);

      const check12h = isMeetingTimePassed("2026-10-05", "01:30 CH - 02:00 CH", 5, mockNow);
      expect(check12h.isPassed).toBe(false);
    });

    it("correctly identifies past meeting on the same day", () => {
      // Mock reference time: 10:34 AM Oct 5, 2026 UTC+7
      const mockNow = new Date("2026-10-05T03:34:00.000Z");

      // 09:00 - 10:00 (has passed by > 5 minutes at 10:34 AM)
      const checkPast = isMeetingTimePassed("2026-10-05", "09:00 - 10:00", 5, mockNow);
      expect(checkPast.isPassed).toBe(true);
      expect(checkPast.reason).toContain("đã qua");
    });

    it("respects 5-minute grace tolerance for ongoing/just-started meetings", () => {
      // Mock reference time: 10:33 AM
      const mockNow = new Date("2026-10-05T03:33:00.000Z");

      // Meeting starting at 10:30 AM (3 mins ago, within 5-min tolerance)
      const checkGrace = isMeetingTimePassed("2026-10-05", "10:30 - 11:30", 5, mockNow);
      expect(checkGrace.isPassed).toBe(false);
    });

    it("correctly allows booking for future dates", () => {
      // Mock reference time: 10:34 AM Oct 5, 2026
      const mockNow = new Date("2026-10-05T03:34:00.000Z");

      const checkFuture = isMeetingTimePassed("2026-10-06", "08:00 - 09:00", 5, mockNow);
      expect(checkFuture.isPassed).toBe(false);
    });
  });
});
