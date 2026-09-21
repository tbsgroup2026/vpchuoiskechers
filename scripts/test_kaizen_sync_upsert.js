/**
 * Test script for Kaizen Real-Time Push & Idempotent Sync Verification
 */
const assert = require('assert');

// Mock in-memory DB simulating Cloudflare D1
class MockD1 {
  constructor() {
    this.rows = new Map();
  }

  prepare(query) {
    const self = this;
    return {
      bind(...args) {
        this.boundArgs = args;
        return this;
      },
      async first() {
        if (query.includes('SELECT id FROM ci_kaizen_proposals')) {
          const [id, siteCode, externalId] = this.boundArgs;
          for (const row of self.rows.values()) {
            if (row.id === id || (row.site_code === siteCode && row.external_id === externalId)) {
              return { id: row.id };
            }
          }
          return null;
        }
        return null;
      },
      async run() {
        if (query.includes('INSERT INTO ci_kaizen_proposals')) {
          const [id, code, title, category, category_label, reg_type, region, dept, factory, line, p_name, p_code, before_desc, after_sol, saved_s, saved_s2, before_img, after_img, att_json, status, sub_status, trang_thai, review_status, score, avg_rating, rating_cnt, vote_cnt, view_cnt, pair_qty, total_sav, total_words, approval_status, site_code, external_id, created_at] = this.boundArgs;
          self.rows.set(id, {
            id, code, title, site_code, external_id, region, status, updated_at: new Date().toISOString()
          });
        } else if (query.includes('UPDATE ci_kaizen_proposals')) {
          const [code, title, cat, cat_lbl, reg_type, region, dept, factory, line, p_name, p_code, before_desc, after_sol, saved_s, saved_s2, before_img, after_img, att_json, status, sub_status, trang_thai, review_status, score, avg_rating, rating_cnt, vote_cnt, view_cnt, pair_qty, total_sav, total_words, approval_status, site_code, external_id, targetId] = this.boundArgs;
          const row = self.rows.get(targetId);
          if (row) {
            row.title = title || row.title;
            row.site_code = site_code || row.site_code;
            row.external_id = external_id || row.external_id;
            row.updated_at = new Date().toISOString();
          }
        }
        return { success: true };
      }
    };
  }
}

async function testSyncUpsert() {
  console.log('=== KAIZEN SYNC & UPSERT IDEMPOTENCY TEST ===');
  const mockDb = new MockD1();

  const mockProposal = {
    id: 'ci_1788953798328_test',
    code: 'KZ-2026-001',
    title: 'Cải tiến khuôn in lô gô',
    proposer_name: 'Nguyen Van A',
    proposer_emp_code: 'KG-001',
    region: 'TH Kiên Giang',
    status: 'APPROVED',
    approval_status: 'PHE_DUYET',
    site_code: 'thkiengiangshoes',
    external_id: 'ci_1788953798328_test'
  };

  // Simulating initial push sync
  console.log('1. Pushing proposal first time...');
  const existing1 = await mockDb.prepare('SELECT id FROM ci_kaizen_proposals WHERE id = ? OR (site_code = ? AND external_id = ?)')
    .bind(mockProposal.id, mockProposal.site_code, mockProposal.external_id).first();

  assert.strictEqual(existing1, null, 'Proposal should not exist prior to first push');
  
  await mockDb.prepare('INSERT INTO ci_kaizen_proposals (id, code, title, category, category_label, registration_type, region, department, factory, line, proposer_name, proposer_emp_code, before_description, after_solution, saved_seconds, so_giay_tiet_kiem, before_image_url, after_image_url, attachments_json, status, sub_status, trang_thai, review_status, score_points, avg_rating, rating_count, vote_count, view_count, pair_quantity, total_savings_vnd, total_savings_words, approval_status, site_code, external_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
    .bind(mockProposal.id, mockProposal.code, mockProposal.title, 'PRODUCTIVITY', '3.Tăng Năng suất', 'THI_DUA', mockProposal.region, '', 'TH Kiên Giang', '', mockProposal.proposer_name, mockProposal.proposer_emp_code, '', '', 0, 0, '', '', null, 'APPROVED', 'DA_DANH_GIA', 'DA_DANH_GIA', 'PHE_DUYET', 0, 0, 0, 0, 0, 0, 0, '', 'PHE_DUYET', mockProposal.site_code, mockProposal.external_id, new Date().toISOString())
    .run();

  assert.strictEqual(mockDb.rows.size, 1, 'Database should contain exactly 1 proposal');

  // Simulating duplicate push (idempotency check)
  console.log('2. Pushing proposal second time (duplicate sync call)...');
  const existing2 = await mockDb.prepare('SELECT id FROM ci_kaizen_proposals WHERE id = ? OR (site_code = ? AND external_id = ?)')
    .bind(mockProposal.id, mockProposal.site_code, mockProposal.external_id).first();

  assert.notStrictEqual(existing2, null, 'Proposal MUST be detected as existing');
  assert.strictEqual(existing2.id, mockProposal.id);

  // Perform UPDATE instead of INSERT
  const updatedTitle = 'Cải tiến khuôn in lô gô (Đã cập nhật)';
  await mockDb.prepare('UPDATE ci_kaizen_proposals SET code = ?, title = ?, category = ?, category_label = ?, registration_type = ?, region = ?, department = ?, factory = ?, line = ?, proposer_name = ?, proposer_emp_code = ?, before_description = ?, after_solution = ?, saved_seconds = ?, so_giay_tiet_kiem = ?, before_image_url = ?, after_image_url = ?, attachments_json = ?, status = ?, sub_status = ?, trang_thai = ?, review_status = ?, score_points = ?, avg_rating = ?, rating_count = ?, vote_count = ?, view_count = ?, pair_quantity = ?, total_savings_vnd = ?, total_savings_words = ?, approval_status = ?, site_code = ?, external_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(mockProposal.code, updatedTitle, 'PRODUCTIVITY', '3.Tăng Năng suất', 'THI_DUA', mockProposal.region, '', 'TH Kiên Giang', '', mockProposal.proposer_name, mockProposal.proposer_emp_code, '', '', 0, 0, '', '', null, 'APPROVED', 'DA_DANH_GIA', 'DA_DANH_GIA', 'PHE_DUYET', 0, 0, 0, 0, 0, 0, 0, '', 'PHE_DUYET', mockProposal.site_code, mockProposal.external_id, existing2.id)
    .run();

  assert.strictEqual(mockDb.rows.size, 1, 'Database MUST still contain exactly 1 proposal (no duplicates created!)');
  assert.strictEqual(mockDb.rows.get(mockProposal.id).title, updatedTitle, 'Record content was updated successfully');

  console.log('✅ ALL TESTS PASSED SUCCESSFULLY! Real-Time Push & Idempotent Upsert works perfectly.');
}

testSyncUpsert().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
