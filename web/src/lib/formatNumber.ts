/**
 * Utility functions for formatting numbers according to International standards:
 * - Thousands separator: comma (,)
 * - Decimal separator: dot (.)
 * - Decimal places: max 2 decimal places with standard rounding (Math.round / EPSILON).
 * - Integers: displayed without decimal point or trailing zeros.
 * - Non-integers: displayed with 2 decimal places (e.g. 195.1000000000 -> 195.10, 406951.7 -> 406,951.70).
 */

/**
 * Formats a numeric value using International standard (en-US locale).
 *
 * Examples:
 *   195.1000000000 -> "195.10"
 *   2.439123       -> "2.44"
 *   406951.7       -> "406,951.70"
 *   166869         -> "166,869"
 */
export function formatFormattedNumber(
  val: number | string | null | undefined,
  locale: string = 'en-US'
): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return String(val);

  // Round to max 2 decimal places using EPSILON for floating point precision
  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;

  // If after rounding it is an integer, format without decimals
  if (rounded % 1 === 0) {
    return rounded.toLocaleString(locale, {
      maximumFractionDigits: 0,
    });
  }

  // If non-integer, format with exactly 2 decimal places (e.g. 195.10, 406,951.70, 2.44)
  return rounded.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a numeric value using International standard with dot decimal and comma thousands separator.
 */
export function formatMax2Decimals(val: number | string | null | undefined): string {
  return formatFormattedNumber(val, 'en-US');
}

/**
 * Shortcut helper for monetary or numeric values (using International format: comma thousands, dot decimal).
 */
export function formatVND(val: number | string | null | undefined): string {
  return formatFormattedNumber(val, 'en-US');
}

export default formatFormattedNumber;
