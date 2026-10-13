import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { HR_CONFIG_ENTRIES, listUnverifiedConstants } from './hrConfig';
import { calculateSalary } from './hrLogic';

const GO_LIVE = process.env.GO_LIVE === '1';

describe('Cổng xác minh hằng số pháp lý', () => {
  it('mỗi hằng số có đủ metadata nguồn', () => {
    for (const [key, entry] of Object.entries(HR_CONFIG_ENTRIES)) {
      const s = (entry as any).source;
      expect(s.docName, key).toBeTruthy();
      expect(s.docNumber, key).toBeTruthy();
      expect(s.clause, key).toBeTruthy();
      expect(s.effectiveDate, key).toBeTruthy();
      expect(s.url, key).toBeTruthy();
      expect(typeof (entry as any).verified, key).toBe('boolean');
    }
  });

  it('cảnh báo nếu còn hằng số verified:false (GO_LIVE=1 thì FAIL)', () => {
    const unverified = listUnverifiedConstants();
    if (unverified.length > 0) {
      console.warn(
        `\n⚠️  CẢNH BÁO: ${unverified.length} hằng số pháp lý CHƯA XÁC MINH (verified:false): ${unverified.join(', ')}\n` +
        `   Không được go-live khi còn hằng số chưa xác minh.\n`
      );
    }
    if (GO_LIVE) expect(unverified).toEqual([]);
  });

  it('verified:true phải có URL thật (không chứa CHƯA XÁC MINH)', () => {
    for (const [key, entry] of Object.entries(HR_CONFIG_ENTRIES)) {
      const e = entry as any;
      if (e.verified) {
        expect(e.source.url, key).toMatch(/^https?:\/\//);
        expect(e.source.docNumber, key).not.toMatch(/CHƯA XÁC MINH/);
      }
    }
  });
});

describe('Ca tính tay của kế toán (cases/accountant-cases.json)', () => {
  const file = path.resolve(__dirname, '../../cases/accountant-cases.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const cases: any[] = data.cases || [];
  const min: number = data.minimumCasesForGoLive ?? 8;

  it(`số ca hiện có: ${cases.length}/${min}`, () => {
    if (cases.length < min) {
      console.warn(`\n⚠️  CẢNH BÁO: mới có ${cases.length}/${min} ca tính tay của kế toán. Chờ kế toán nhập vào cases/accountant-cases.json.\n`);
    }
    if (GO_LIVE) expect(cases.length).toBeGreaterThanOrEqual(min);
  });

  for (const c of cases) {
    it(`khớp ca ${c.id} (${c.accountant})`, () => {
      const res = calculateSalary(c.input.baseSalary, c.input.dependents ?? 0);
      expect(res.insurance).toBe(c.expected.insurance);
      expect(res.tax).toBe(c.expected.tax);
      expect(res.net).toBe(c.expected.net);
    });
  }
});
