const fs = require('fs');
const path = require('path');

const ciPath = path.join(__dirname, 'web/src/modules/ci/CIModule.tsx');
let ciCode = fs.readFileSync(ciPath, 'utf8');

// 1. Add isPublicMode state
ciCode = ciCode.replace(/const \[isDetailModalOpen, setIsDetailModalOpen\] = useState\(false\);/, `const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPublicMode, setIsPublicMode] = useState(false);`);

// 2. Update the permalink useEffect
const permalinkEffectOld = `  // Handle direct access via URL (e.g. /work/kaizen/CI-2026-001)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    if (path.match(/^\\/work\\/kaizen\\/[a-zA-Z0-9_-]+$/) && path !== "/work/kaizen/register" && proposals.length > 0) {
      const code = path.split("/").pop();
      if (code && !isDetailModalOpen) {
        const found = proposals.find(p => p.code === code);
        if (found) {
          setActiveProposal(found);
          setIsDetailModalOpen(true);
              if (typeof window !== "undefined" && window.history.pushState) {
                const c = typeof found !== "undefined" ? found?.code : (typeof prop !== "undefined" ? prop?.code : (typeof p !== "undefined" ? p?.code : ""));
                if (c) window.history.pushState(null, "", "/work/kaizen/" + c);
              }
        } else {
          showToast("⚠️ Không tìm thấy sáng kiến này hoặc sáng kiến đã bị xóa.");
          window.history.replaceState(null, "", "/work/kaizen");
        }
      }
    }
  }, [proposals]);`;

const permalinkEffectNew = `  // Handle direct access via URL (e.g. /work/kaizen/CI-2026-001)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    if (path.match(/^\\/work\\/kaizen\\/[a-zA-Z0-9_-]+$/) && path !== "/work/kaizen/register" && !isDetailModalOpen) {
      const code = path.split("/").pop();
      if (!code) return;
      
      const user = getCurrentUser();
      if (!user) {
         fetch(\`/api/public/kaizen/\${code}\`)
           .then(r => r.json())
           .then(data => {
              if (data.success && data.data) {
                 setIsPublicMode(true);
                 setActiveProposal(data.data as any);
                 setIsDetailModalOpen(true);
                 if (window.history.pushState) window.history.pushState(null, "", "/work/kaizen/" + data.data.code);
              } else {
                 showToast("⚠️ Không tìm thấy sáng kiến này.");
                 window.history.replaceState(null, "", "/work/kaizen");
              }
           });
      } else {
         if (proposals.length > 0) {
            const found = proposals.find(p => p.code === code);
            if (found) {
               setIsPublicMode(false);
               setActiveProposal(found);
               setIsDetailModalOpen(true);
               if (window.history.pushState) window.history.pushState(null, "", "/work/kaizen/" + found.code);
            } else {
               showToast("⚠️ Không tìm thấy sáng kiến này hoặc sáng kiến đã bị xóa.");
               window.history.replaceState(null, "", "/work/kaizen");
            }
         }
      }
    }
  }, [proposals, isDetailModalOpen]);`;

ciCode = ciCode.replace(permalinkEffectOld, permalinkEffectNew);

// 3. Update KaizenDetailModal props in CIModule.tsx
ciCode = ciCode.replace(/<KaizenDetailModal\s*proposal=\{activeProposal\}\s*isOpen=\{isDetailModalOpen\}\s*initialTab=\{detailModalInitialTab\}\s*onClose=\{/m, `<KaizenDetailModal
          proposal={activeProposal}
          isOpen={isDetailModalOpen}
          initialTab={detailModalInitialTab}
          isPublicView={isPublicMode}
          onClose={`);

fs.writeFileSync(ciPath, ciCode);
console.log('CIModule.tsx patched successfully.');

// --- Patch KaizenDetailModal.tsx ---
const modalPath = path.join(__dirname, 'web/src/modules/ci/KaizenDetailModal.tsx');
let modalCode = fs.readFileSync(modalPath, 'utf8');

modalCode = modalCode.replace(/onSaveSuccess\?: \(updatedPayload: any\) => void;\n\}/, `onSaveSuccess?: (updatedPayload: any) => void;
  isPublicView?: boolean;
}`);

modalCode = modalCode.replace(/  onSaveSuccess,\n\}: KaizenDetailModalProps\) \{/, `  onSaveSuccess,
  isPublicView = false,
}: KaizenDetailModalProps) {`);

// Hide MSNV and other info if isPublicView
modalCode = modalCode.replace(/const canEditOrDelete = useMemo\(\(\) => \{/g, `const canEditOrDelete = useMemo(() => {
    if (isPublicView) return false;`);

// Hide tabs
modalCode = modalCode.replace(/const canSeeAwardTab = isApprovedStep3 && isAssignedJudge;/g, `const canSeeAwardTab = !isPublicView && isApprovedStep3 && isAssignedJudge;`);

modalCode = modalCode.replace(/\{canSeeExpertTab && \(/g, `{canSeeExpertTab && !isPublicView && (`);
modalCode = modalCode.replace(/\{canSeeAwardTab && \(/g, `{canSeeAwardTab && !isPublicView && (`);
modalCode = modalCode.replace(/\{activeTab === "expert_review" && canSeeExpertTab && \(/g, `{activeTab === "expert_review" && canSeeExpertTab && !isPublicView && (`);
modalCode = modalCode.replace(/\{activeTab === "star_review" && canSeeAwardTab && \(/g, `{activeTab === "star_review" && canSeeAwardTab && !isPublicView && (`);

// Hide MSNV in header
modalCode = modalCode.replace(/MSNV: <span className="font-mono text-slate-700 font-bold">\{proposal\.proposer_emp_code\}<\/span> \&bull; /g, `{!isPublicView && <>MSNV: <span className="font-mono text-slate-700 font-bold">{proposal.proposer_emp_code}</span> &bull; </>}`);

// Hide MSNV box
modalCode = modalCode.replace(/<span className="text-\[10px\] font-semibold uppercase tracking-wider text-slate-500 block">MSNV<\/span>\n\s*<span className="text-xs font-mono font-bold text-slate-900 block truncate">\n\s*\{proposal\.proposer_emp_code \|\| "---"\}\n\s*<\/span>/g, `{isPublicView ? <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">PHIẾU</span> : <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">MSNV</span>}
                <span className="text-xs font-mono font-bold text-slate-900 block truncate">
                  {isPublicView ? "Đã xác thực" : (proposal.proposer_emp_code || "---")}
                </span>`);

// Add login banner for public view
const headerBannerOld = `{/* TÊN NGƯỜI ĐĂNG KÝ VÀ TRẠNG THÁI (TRÊN CÙNG BÊN TRÁI) */}`;
const headerBannerNew = `{isPublicView && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-800 text-xs font-semibold">
                  <IconInfoCircle size={16} />
                  <span>Đây là chế độ xem công khai. Đăng nhập để xem điểm số, nhận xét chuyên gia và thao tác.</span>
                </div>
                <button type="button" onClick={() => window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
                  Đăng nhập
                </button>
              </div>
            )}
            {/* TÊN NGƯỜI ĐĂNG KÝ VÀ TRẠNG THÁI (TRÊN CÙNG BÊN TRÁI) */}`;

modalCode = modalCode.replace(headerBannerOld, headerBannerNew);

fs.writeFileSync(modalPath, modalCode);
console.log('KaizenDetailModal.tsx patched successfully.');
