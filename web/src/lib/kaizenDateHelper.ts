// Date helper functions for Kaizen date filter popover & Asia/Ho_Chi_Minh timezone

export function getVietnamDateStr(dateVal: string | number | Date): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d); // Returns YYYY-MM-DD
}

export function formatVnDateDisplay(isoDateStr: string): string {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return isoDateStr;
}

export function formatShortVnDateDisplay(isoDateStr: string): string {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length === 3) {
    const [, m, d] = parts;
    return `${d}/${m}`;
  }
  return isoDateStr;
}

export function isDateRangeInvalid(fromDate: string, toDate: string): boolean {
  return Boolean(fromDate && toDate && toDate < fromDate);
}
