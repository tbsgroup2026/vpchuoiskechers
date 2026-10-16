// Tiện ích ngày cho DEMO. Mọi ngày là chuỗi "YYYY-MM-DD", tính theo UTC để không lệch múi giờ.

const DAY_MS = 86_400_000;

export function toMs(d: string): number {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

export function fromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d: string, n: number): string {
  return fromMs(toMs(d) + n * DAY_MS);
}

/** Số ngày từ b đến a (a − b) */
export function diffDays(a: string, b: string): number {
  return Math.round((toMs(a) - toMs(b)) / DAY_MS);
}

export function maxDate(...ds: (string | null | undefined)[]): string | null {
  const valid = ds.filter((d): d is string => !!d);
  if (valid.length === 0) return null;
  return valid.reduce((acc, d) => (d > acc ? d : acc));
}

/** 0 = Chủ nhật … 6 = Thứ Bảy */
export function weekday(d: string): number {
  return new Date(toMs(d)).getUTCDay();
}

/** Ngày đầu tiên từ d trở đi rơi vào thứ wd */
export function onOrAfterWeekday(d: string, wd: number): string {
  const delta = (wd - weekday(d) + 7) % 7;
  return addDays(d, delta);
}

/** Thứ Hai của tuần chứa d (tuần bắt đầu thứ Hai) */
export function weekStart(d: string): string {
  const wd = weekday(d);
  return addDays(d, -((wd + 6) % 7));
}

/** Số tuần ISO-8601 của ngày d */
export function isoWeek(d: string): number {
  const thursday = addDays(weekStart(d), 3);
  const year = thursday.slice(0, 4);
  const firstThursday = onOrAfterWeekday(`${year}-01-01`, 4);
  return 1 + Math.round(diffDays(thursday, firstThursday) / 7);
}

export function fmtDM(d?: string | null): string {
  if (!d) return "—";
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

export function fmtDMY(d?: string | null): string {
  if (!d) return "—";
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

const WEEKDAY_VI = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function weekdayName(d: string): string {
  return WEEKDAY_VI[weekday(d)];
}

export function weekLabel(monday: string): string {
  return `Tuần ${isoWeek(monday)}`;
}
