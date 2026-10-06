import { describe, it, expect } from "vitest";
import { getVietnamDateStr, formatVnDateDisplay, formatShortVnDateDisplay } from "../lib/kaizenDateHelper";

describe("Kaizen Calendar Date Filter & Timezone Verification", () => {
  it("converts dates into Asia/Ho_Chi_Minh YYYY-MM-DD timezone accurately", () => {
    // 00:10 AM Vietnam Time (UTC+7) on Oct 5, 2026 => Oct 4 17:10:00 UTC
    const date0010Vn = "2026-10-04T17:10:00.000Z";
    expect(getVietnamDateStr(date0010Vn)).toBe("2026-10-05");

    // 23:50 PM Vietnam Time (UTC+7) on Oct 5, 2026 => Oct 5 16:50:00 UTC
    const date2350Vn = "2026-10-05T16:50:00.000Z";
    expect(getVietnamDateStr(date2350Vn)).toBe("2026-10-05");

    // Next day 00:05 AM Vietnam Time => Oct 5 17:05:00 UTC -> Oct 6
    const dateNextDayVn = "2026-10-05T17:05:00.000Z";
    expect(getVietnamDateStr(dateNextDayVn)).toBe("2026-10-06");
  });

  it("formats single date and date range display strings correctly", () => {
    expect(formatVnDateDisplay("2026-10-05")).toBe("05/10/2026");
    expect(formatShortVnDateDisplay("2026-09-15")).toBe("15/09");
  });

  it("filters proposals by single day matching Vietnam timezone date string", () => {
    const proposals = [
      { id: "1", created_at: "2026-10-04T17:10:00.000Z", title: "Sáng kiến 00:10 ngày 5/10" },
      { id: "2", created_at: "2026-10-05T16:50:00.000Z", title: "Sáng kiến 23:50 ngày 5/10" },
      { id: "3", created_at: "2026-10-05T17:05:00.000Z", title: "Sáng kiến ngày 6/10" },
    ];

    const selectedSingleDate = "2026-10-05";

    const filtered = proposals.filter((p) => {
      const pVnDate = getVietnamDateStr(p.created_at);
      return pVnDate === selectedSingleDate;
    });

    expect(filtered.length).toBe(2);
    expect(filtered.map((f) => f.id)).toEqual(["1", "2"]);
  });

  it("filters proposals by date range inclusive", () => {
    const proposals = [
      { id: "1", created_at: "2026-09-14T20:00:00.000Z" }, // Sept 15 VN
      { id: "2", created_at: "2026-09-25T10:00:00.000Z" }, // Sept 25 VN
      { id: "3", created_at: "2026-10-05T10:00:00.000Z" }, // Oct 5 VN
      { id: "4", created_at: "2026-10-06T10:00:00.000Z" }, // Oct 6 VN
    ];

    const fromDate = "2026-09-15";
    const toDate = "2026-10-05";

    const filtered = proposals.filter((p) => {
      const pVnDate = getVietnamDateStr(p.created_at);
      return pVnDate >= fromDate && pVnDate <= toDate;
    });

    expect(filtered.length).toBe(3);
    expect(filtered.map((f) => f.id)).toEqual(["1", "2", "3"]);
  });

  it("validates range errors when toDate < fromDate", () => {
    const fromDate = "2026-10-05";
    const toDate = "2026-09-15";
    const isInvalid = Boolean(fromDate && toDate && toDate < fromDate);
    expect(isInvalid).toBe(true);
  });
});
