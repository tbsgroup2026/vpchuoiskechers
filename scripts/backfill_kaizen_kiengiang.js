/**
 * Backfill & Reconciliation Script for Kaizen Proposals from Kiên Giang to VP Chuỗi Hub
 * 
 * Usage:
 *   node scripts/backfill_kaizen_kiengiang.js --dry-run
 *   node scripts/backfill_kaizen_kiengiang.js --execute
 */

const SOURCE_URL = 'https://thkiengiangshoes.tbsgroup2026.workers.dev/api/ci-kaizen?sync=1';
const SYNC_HUB_URL = 'https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen/sync';
const SYNC_SECRET = 'tbs_ii_secure_jwt_secret_key_2026';

async function runBackfill() {
  const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
  console.log(`=== BẮT ĐẦU KIỂM TRA & DỒN ĐỒNG BỘ DỮ LIỆU (BACKFILL KAIZEN KIÊN GIANG) ===`);
  console.log(`Chế độ: ${isDryRun ? 'DRY-RUN (Thử nghiệm, KHÔNG ghi DB)' : 'THỰC THI THẬT (--execute)'}\n`);

  try {
    // 1. Fetch data from Kiên Giang Source
    console.log(`1. Đang tải danh sách sáng kiến từ Kiên Giang: ${SOURCE_URL}...`);
    const sourceRes = await fetch(SOURCE_URL, {
      headers: {
        'Cache-Control': 'no-cache',
        'x-sync-secret': SYNC_SECRET,
      }
    });

    if (!sourceRes.ok) {
      throw new Error(`Không thể kết nối Kiên Giang (HTTP ${sourceRes.status}: ${sourceRes.statusText})`);
    }

    const sourceJson = await sourceRes.json();
    const sourceProposals = sourceJson.data || sourceJson.proposals || [];
    console.log(`   -> Tìm thấy ${sourceProposals.length} sáng kiến tại Kiên Giang.`);

    // 2. Fetch current data from VP Chuỗi Hub
    console.log(`2. Đang kiểm tra dữ liệu hiện tại tại VP Chuỗi Hub...`);
    const hubRes = await fetch('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen', {
      headers: {
        'Cache-Control': 'no-cache',
      }
    });

    const hubJson = await hubRes.json();
    const hubProposals = hubJson.data || hubJson.proposals || [];
    console.log(`   -> Tìm thấy ${hubProposals.length} sáng kiến tại VP Chuỗi Hub.`);

    // 3. Compare & Identify delta
    let newItems = [];
    let updatedItems = [];
    let unchangedItems = [];

    const hubMap = new Map();
    hubProposals.forEach(p => {
      const extKey = `${p.site_code || 'thkiengiangshoes'}_${p.external_id || p.id}`;
      hubMap.set(p.id, p);
      hubMap.set(extKey, p);
    });

    sourceProposals.forEach(sp => {
      const siteCode = sp.site_code || 'thkiengiangshoes';
      const extId = sp.external_id || sp.id;
      const localId = siteCode === 'thkiengiangshoes'
        ? (String(sp.id).startsWith('tkg_') ? String(sp.id) : `tkg_${extId}`)
        : String(sp.id);

      const extKey = `${siteCode}_${extId}`;
      const existing = hubMap.get(localId) || hubMap.get(extKey);

      if (!existing) {
        newItems.push({ ...sp, localId });
      } else {
        const localTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
        const srcTime = sp.updated_at ? new Date(sp.updated_at).getTime() : 0;
        if (srcTime > localTime) {
          updatedItems.push({ ...sp, localId });
        } else {
          unchangedItems.push({ ...sp, localId });
        }
      }
    });

    // 4. Output Reconciliation Table (Dry-Run report)
    console.log(`\n=== BẢNG ĐỐI SOÁT DỮ LIỆU TRƯỚC VÀ SAU ===`);
    console.table([
      { 'Nhà máy / Nguồn': 'Kiên Giang (Nguồn gốc)', 'Tổng số sáng kiến': sourceProposals.length, 'Sẽ thêm mới': newItems.length, 'Sẽ cập nhật': updatedItems.length, 'Bỏ qua (Đã khớp)': unchangedItems.length },
      { 'Nhà máy / Nguồn': 'VP Chuỗi (Trước Backfill)', 'Tổng số sáng kiến': hubProposals.length, 'Sẽ thêm mới': '-', 'Sẽ cập nhật': '-', 'Bỏ qua (Đã khớp)': '-' },
      { 'Nhà máy / Nguồn': 'VP Chuỗi (Sau Backfill dự kiến)', 'Tổng số sáng kiến': hubProposals.length + newItems.length, 'Sẽ thêm mới': newItems.length, 'Sẽ cập nhật': updatedItems.length, 'Bỏ qua (Đã khớp)': unchangedItems.length },
    ]);

    if (newItems.length > 0) {
      console.log(`\nDanh sách sáng kiến MỚI sẽ thêm:`);
      newItems.slice(0, 10).forEach(i => {
        console.log(` - [${i.code || i.localId}] ${i.title || i.before_description?.substring(0, 40)} (${i.proposer_name || 'N/A'})`);
      });
      if (newItems.length > 10) console.log(`   ... và ${newItems.length - 10} sáng kiến khác.`);
    }

    if (isDryRun) {
      console.log(`\n[DRY-RUN HOÀN TẤT] Bạn đang chạy chế độ kiểm tra. Hãy chạy lệnh sau để thực thi thật:`);
      console.log(`node scripts/backfill_kaizen_kiengiang.js --execute`);
      return;
    }

    // 5. Execute Backfill Payload to VP Chuỗi Hub
    console.log(`\n5. Đang gửi dữ liệu Backfill sang VP Chuỗi Hub...`);
    const syncPayload = {
      site_code: 'thkiengiangshoes',
      proposals: sourceProposals,
    };

    const pushRes = await fetch(SYNC_HUB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': SYNC_SECRET,
      },
      body: JSON.stringify(syncPayload),
    });

    const pushJson = await pushRes.json();
    console.log(`\n=== KẾT QUẢ THỰC THI THẬT ===`);
    console.log(`Trạng thái HTTP: ${pushRes.status}`);
    console.log(`Thông điệp: ${pushJson.message || pushJson.error}`);
    console.log(`Chi tiết: Thêm mới = ${pushJson.created_count || 0}, Cập nhật = ${pushJson.updated_count || 0}, Bỏ qua = ${pushJson.skipped_count || 0}`);

    // 6. Final Reconciliation Verification
    console.log(`\n6. Đang đối soát lại lần cuối...`);
    const verifyRes = await fetch('https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen?stats=1');
    const verifyJson = await verifyRes.json();
    console.log(`   -> Tổng số sáng kiến tại VP Chuỗi Hub hiện tại: ${verifyJson.data?.summary?.totalCount || 'N/A'}`);
    console.log(`=== ĐỒNG BỘ MIGRATION HOÀN TẤT BẢO TOÀN DỮ LIỆU ===`);

  } catch (error) {
    console.error(`[ERROR IN BACKFILL]`, error);
  }
}

runBackfill();
