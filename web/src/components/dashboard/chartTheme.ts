/**
 * Dashboard Theme Tokens & Formatter Constants for TBS Group II
 * Standardized according to TBS Brand Guidelines
 */

// 1. TBS Brand Palette & Chart Sequence
export const TBS_BRAND = {
  primary: '#006838', // TBS Green Primary
  primaryDark: '#004d2a',
  primaryLight: '#ecfdf5', // emerald-50
  primaryBorder: '#a7f3d0', // emerald-200
  accent: '#10b981',
};

// 2. Curated Chart Colors (Stable, distinct, non-clashing)
// Matched to the sample dashboard donut chart palette
export const TBS_CHART_PALETTE: string[] = [
  '#2563eb', // Blue (May)
  '#ea580c', // Orange (Chuyển đổi số)
  '#006838', // Dark TBS Green
  '#0891b2', // Cyan / Teal (Công nghệ)
  '#8b5cf6', // Purple (Gò)
  '#db2777', // Magenta / Pink (Hoàn thiện đế)
  '#06b6d4', // Light Cyan (Đầu vào)
  '#f59e0b', // Amber / Gold (Điều hành)
  '#10b981', // Emerald (Nhân sự)
  '#e11d48', // Rose / Red (KG3)
  '#7c3aed', // Violet (Mũi KG2)
  '#0d9488', // Dark Teal
  '#f43f5e', // Coral Red
  '#4f46e5', // Indigo
  '#84cc16', // Lime
  '#64748b', // Slate Gray
];

/**
 * Deterministic color hashing for group names so each group keeps
 * the same color consistently across renders, page changes, and filters.
 */
export function getStableColor(label: string, fallbackIndex = 0): string {
  if (!label) return TBS_CHART_PALETTE[fallbackIndex % TBS_CHART_PALETTE.length];
  
  // Specific known mappings for exact visual harmony with sample
  const lower = label.toLowerCase();
  if (lower.includes('may')) return TBS_CHART_PALETTE[0]; // #2563eb
  if (lower.includes('chuyển đổi số') || lower.includes('cải tiến')) return TBS_CHART_PALETTE[1]; // #ea580c
  if (lower.includes('công nghệ')) return TBS_CHART_PALETTE[3]; // #0891b2
  if (lower.includes('gò')) return TBS_CHART_PALETTE[4]; // #8b5cf6
  if (lower.includes('đế') || lower.includes('hoàn thiện')) return TBS_CHART_PALETTE[5]; // #db2777
  if (lower.includes('đầu vào')) return TBS_CHART_PALETTE[6]; // #06b6d4
  if (lower.includes('điều hành') || lower.includes('văn phòng')) return TBS_CHART_PALETTE[7]; // #f59e0b
  if (lower.includes('nhân sự') || lower.includes('hành chính')) return TBS_CHART_PALETTE[8]; // #10b981

  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % TBS_CHART_PALETTE.length;
  return TBS_CHART_PALETTE[idx];
}

/**
 * Format numbers with Vietnamese locale formatting (dots as thousand separators)
 * Example: 111952 -> "111.952"
 */
export function formatVnNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Format currency in VND with suffix "₫" or "Tr" (Millions)
 */
export function formatVnCurrency(value: number | null | undefined, inMillions = false): string {
  if (value === null || value === undefined || isNaN(value)) return '0 ₫';
  if (inMillions) {
    const tr = value / 1_000_000;
    return `${formatVnNumber(Math.round(tr * 10) / 10)} Tr`;
  }
  return `${formatVnNumber(Math.round(value))} ₫`;
}

/**
 * Format percentage with Vietnamese sign
 * Example: 27.2 -> "27.2%"
 */
export function formatVnPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}
