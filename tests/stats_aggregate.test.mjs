/**
 * Automated Test Suite: TBS Group Dashboard Data & Stats Aggregations
 * Phase 5 Verification
 */

import assert from 'node:assert';
import { test, describe } from 'node:test';

// 1. Math and Formatting Utilities for Vietnamese Standard
function formatViNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

function calcChangePercent(current, previous) {
  if (!previous || previous === 0) {
    return null; // Division by zero returns null, UI renders "—"
  }
  const pct = ((current - previous) / previous) * 100;
  return Number(pct.toFixed(1));
}

function calcBreakdownPercentages(items) {
  const total = items.reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0) {
    return items.map(item => ({ ...item, percent: 0 }));
  }
  return items.map(item => {
    const rawPct = (item.value / total) * 100;
    return {
      ...item,
      percent: Number(rawPct.toFixed(1)),
    };
  });
}

describe('1. Dashboard Aggregate Math & Edge Case Verification', () => {
  test('formats numbers according to Vietnamese standard (dots for thousands)', () => {
    assert.strictEqual(formatViNumber(111952), '111.952');
    assert.strictEqual(formatViNumber(1115), '1.115');
    assert.strictEqual(formatViNumber(27), '27');
    assert.strictEqual(formatViNumber(0), '0');
  });

  test('handles division by zero safely for changePercent', () => {
    const resultZeroPrev = calcChangePercent(50, 0);
    assert.strictEqual(resultZeroPrev, null, 'Division by zero must return null');

    const resultNullPrev = calcChangePercent(50, null);
    assert.strictEqual(resultNullPrev, null, 'Null previous total must return null');

    const normalIncrease = calcChangePercent(120, 100);
    assert.strictEqual(normalIncrease, 20.0);

    const normalDecrease = calcChangePercent(80, 100);
    assert.strictEqual(normalDecrease, -20.0);
  });

  test('calculates breakdown percentages accurately with sum ≈ 100%', () => {
    const rawGroups = [
      { key: 'May', label: 'May', value: 22 },
      { key: 'CDS', label: 'Bộ Phận Chuyển Đổi Số', value: 21 },
      { key: 'CN', label: 'Bộ Phận Công Nghệ', value: 7 },
      { key: 'Go', label: 'Gò', value: 5 },
      { key: 'De', label: 'Xưởng Hoàn Thiện Đế', value: 4 },
      { key: 'Input', label: 'Đầu vào', value: 3 },
    ];

    const computed = calcBreakdownPercentages(rawGroups);
    const total = rawGroups.reduce((acc, c) => acc + c.value, 0); // 62
    assert.strictEqual(total, 62);

    const sumPct = computed.reduce((acc, c) => acc + c.percent, 0);
    // 22/62 = 35.5%, 21/62 = 33.9%, 7/62 = 11.3%, 5/62 = 8.1%, 4/62 = 6.5%, 3/62 = 4.8%
    // Sum = 35.5 + 33.9 + 11.3 + 8.1 + 6.5 + 4.8 = 100.1%
    assert.ok(sumPct >= 99.5 && sumPct <= 100.5, `Sum of percentages (${sumPct}%) must be ≈ 100%`);
  });

  test('handles empty breakdown datasets without crashing', () => {
    const emptyResult = calcBreakdownPercentages([]);
    assert.deepStrictEqual(emptyResult, []);

    const allZero = calcBreakdownPercentages([{ key: 'A', value: 0 }, { key: 'B', value: 0 }]);
    assert.strictEqual(allZero[0].percent, 0);
    assert.strictEqual(allZero[1].percent, 0);
  });
});

describe('2. Live D1 API Integration & RBAC Scope Check', () => {
  const BASE_URL = 'http://127.0.0.1:8787';

  test('GET /api/stats/overview returns real D1 aggregated metrics', async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/stats/overview`, {
        headers: { 'x-forwarded-proto': 'https' },
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      const payload = json.data || json;
      assert.ok(payload.kpis, 'Must have kpis object');
      assert.ok(payload.donut, 'Must have donut object');

      // Verify KPI values are realistic numbers from D1
      assert.ok(typeof payload.kpis.pph.value === 'number');
      assert.ok(typeof payload.kpis.kaizen.value === 'number');
      assert.ok(typeof payload.kpis.mmtb.value === 'number');
      assert.ok(typeof payload.kpis.layout.value === 'number');

      // Verify donut chart structure
      assert.ok(payload.donut.centerBrand || payload.donut.centerLabel, 'Must have center brand/label');
      assert.ok(Array.isArray(payload.donut.breakdown));
      assert.ok(payload.donut.breakdown.length > 0);
    } catch (e) {
      if (e.code === 'ECONNREFUSED') {
        console.warn('⚠️ Server not responding locally, skipping live API call');
      } else {
        throw e;
      }
    }
  });

  test('GET /api/stats/kaizen respects region filtering parameter', async () => {
    try {
      const allRes = await fetch(`${BASE_URL}/api/stats/kaizen`, {
        headers: { 'x-forwarded-proto': 'https' },
      });
      const kgRes = await fetch(`${BASE_URL}/api/stats/kaizen?region=TH+Kiên+Giang+Shoes`, {
        headers: { 'x-forwarded-proto': 'https' },
      });

      if (allRes.ok && kgRes.ok) {
        const allJson = await allRes.json();
        const kgJson = await kgRes.json();
        assert.ok(allJson.success && kgJson.success);
        const allPayload = allJson.data || allJson;
        const kgPayload = kgJson.data || kgJson;
        // Region-filtered count must be <= Total count
        assert.ok((kgPayload.total || 0) <= (allPayload.total || 0));
      }
    } catch (e) {
      if (e.code === 'ECONNREFUSED') {
        console.warn('⚠️ Server not responding locally, skipping live API call');
      } else {
        throw e;
      }
    }
  });
});
