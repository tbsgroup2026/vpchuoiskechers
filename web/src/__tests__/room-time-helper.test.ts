import { describe, it, expect } from "vitest";
import {
  parseTimeToMinutes,
  formatMinutesTo24h,
  parseTimeSlot,
  parseDateParts,
  getVietnamNowParts,
  isMeetingTimePassed,
  isSlotOverlapping,
  getMeetingRealtimeStatus,
  getRoomRealtimeStatus,
  isRoomAvailableForSlot,
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

  describe("Interval Overlap Tests (newStart < existingEnd && newEnd > existingStart)", () => {
    it("contiguous meetings (14:00-15:00 and 15:00-16:00) do NOT overlap", () => {
      expect(isSlotOverlapping("14:00 - 15:00", "15:00 - 16:00")).toBe(false);
      expect(isSlotOverlapping("13:45 - 14:00", "14:00 - 17:00")).toBe(false);
    });

    it("overlapping intervals are correctly detected", () => {
      expect(isSlotOverlapping("14:30 - 15:00", "14:00 - 17:00")).toBe(true);
      expect(isSlotOverlapping("13:30 - 14:30", "14:00 - 17:00")).toBe(true);
      expect(isSlotOverlapping("14:00 - 17:00", "14:00 - 17:00")).toBe(true);
      expect(isSlotOverlapping("16:30 - 17:30", "14:00 - 17:00")).toBe(true);
      expect(isSlotOverlapping("12:00 - 18:00", "14:00 - 17:00")).toBe(true);
    });
  });

  describe("Real-World User Scenario Tests (Cases a, b, c, d)", () => {
    // Reference: 13:44 on 2026-10-15 (UTC 06:44)
    const mock1344 = new Date("2026-10-15T06:44:00.000Z");

    const sampleBookings = [
      {
        id: "b_1",
        roomId: "room_1",
        roomName: "Phòng họp 1",
        bookingDate: "15/10/2026",
        timeSlot: "08:00 - 10:00",
        status: "CONFIRMED",
        title: "Họp giao ban sáng",
        bookerName: "Nguyễn Văn A",
      },
      {
        id: "b_2",
        roomId: "room_2",
        roomName: "Phòng họp 2",
        bookingDate: "15/10/2026",
        timeSlot: "14:00 - 17:00",
        status: "CONFIRMED",
        title: "Họp chiến lược Q4",
        bookerName: "Trần Thị B",
      },
      {
        id: "b_3",
        roomId: "room_3",
        roomName: "Phòng họp 3",
        bookingDate: "15/10/2026",
        timeSlot: "13:00 - 15:00",
        status: "CONFIRMED",
        title: "Họp Kaizen Cải Tiến",
        bookerName: "Lê Văn C",
      },
    ];

    const sampleRooms = [
      { id: "room_1", name: "Phòng họp 1", capacity: 10, isLocked: false },
      { id: "room_2", name: "Phòng họp 2", capacity: 20, isLocked: false },
      { id: "room_3", name: "Phòng họp 3", capacity: 8, isLocked: false },
    ];

    it("Case (a): At 13:44, Room 2 meeting is 'Sắp họp', Room 1 meeting is 'Đã kết thúc', Room 3 is 'Đang họp'", () => {
      const status1 = getMeetingRealtimeStatus(sampleBookings[0], mock1344);
      expect(status1.status).toBe("ENDED");
      expect(status1.label).toBe("Đã kết thúc");

      const status2 = getMeetingRealtimeStatus(sampleBookings[1], mock1344);
      expect(status2.status).toBe("UPCOMING");
      expect(status2.label).toBe("Sắp họp");
      expect(status2.isOccupyingRoom).toBe(false);

      const status3 = getMeetingRealtimeStatus(sampleBookings[2], mock1344);
      expect(status3.status).toBe("IN_PROGRESS");
      expect(status3.label).toBe("Đang họp");
      expect(status3.isOccupyingRoom).toBe(true);

      // Room 2 at 13:44 is NOT occupied, but is free until 14:00
      const room2Status = getRoomRealtimeStatus(sampleRooms[1], sampleBookings, mock1344);
      expect(room2Status.isOccupiedNow).toBe(false);
      expect(room2Status.badgeText).toBe("✓ Phòng trống");
      expect(room2Status.freeUntil).toBe("14:00");
      expect(room2Status.badgeSubText).toBe("Trống đến 14:00");

      // Room 3 at 13:44 is occupied until 15:00
      const room3Status = getRoomRealtimeStatus(sampleRooms[2], sampleBookings, mock1344);
      expect(room3Status.isOccupiedNow).toBe(true);
      expect(room3Status.badgeText).toBe("⏳ Đang họp");
      expect(room3Status.badgeSubText).toBe("Đến 15:00");

      // Count of available rooms: Room 1 (free all day now), Room 2 (free until 14:00) -> 2 rooms free
      const freeCount = sampleRooms.filter(r => !getRoomRealtimeStatus(r, sampleBookings, mock1344).isOccupiedNow).length;
      expect(freeCount).toBe(2); // 2 of 3 rooms available! Not 0/3!
    });

    it("Case (b): Booking Room 2 for 13:45 - 14:00 is ALLOWED (contiguous with 14:00)", () => {
      const availCheck = isRoomAvailableForSlot("room_2", "2026-10-15", "13:45 - 14:00", sampleBookings);
      expect(availCheck.isAvailable).toBe(true);
    });

    it("Case (c): Booking Room 2 for 14:30 - 15:00 is BLOCKED due to conflict with 14:00 - 17:00", () => {
      const availCheck = isRoomAvailableForSlot("room_2", "2026-10-15", "14:30 - 15:00", sampleBookings);
      expect(availCheck.isAvailable).toBe(false);
      expect(availCheck.conflictBooking?.id).toBe("b_2");
      expect(availCheck.reason).toContain("Trùng với cuộc họp");
    });

    it("Case (d): At 17:05 (meeting ends at 17:00), Room 2 automatically becomes free", () => {
      // Mock reference time: 17:05 on 2026-10-15 (UTC 10:05)
      const mock1705 = new Date("2026-10-15T10:05:00.000Z");

      const status2After = getMeetingRealtimeStatus(sampleBookings[1], mock1705);
      expect(status2After.status).toBe("ENDED");
      expect(status2After.label).toBe("Đã kết thúc");
      expect(status2After.isOccupyingRoom).toBe(false);

      const room2StatusAfter = getRoomRealtimeStatus(sampleRooms[1], sampleBookings, mock1705);
      expect(room2StatusAfter.isOccupiedNow).toBe(false);
      expect(room2StatusAfter.badgeText).toBe("✓ Phòng trống");
      expect(room2StatusAfter.badgeSubText).toBe("Trống cả ngày");
    });
  });
});

