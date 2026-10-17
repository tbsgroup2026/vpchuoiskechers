const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/modules/ci/CIModule.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add state for mobile sidebar
const stateOld = 'const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);';
const stateNew = 'const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);\n  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);';
if (!code.includes('isMobileSidebarOpen')) {
  code = code.replace(stateOld, stateNew);
}

// 2. Modify <aside> for mobile drawer
const asideOld = `      {/* SIDEBAR */}
      <aside
        className={\`bg-[#0b1739] text-slate-200 flex-col flex-shrink-0 transition-all duration-300 select-none z-30 sticky top-0 h-[100dvh] \${
          isSidebarCollapsed ? "w-20" : "w-64 lg:w-72"
        } flex justify-between border-r border-slate-800 shadow-xl\`}
      >`;

const asideNew = `      {/* MOBILE OVERLAY */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={\`bg-[#0b1739] text-slate-200 flex-col flex-shrink-0 transition-transform duration-300 select-none z-50 fixed md:sticky top-0 h-[100dvh] overflow-y-auto overflow-x-hidden \${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } \${
          isSidebarCollapsed ? "w-20" : "w-64 lg:w-72"
        } flex justify-between border-r border-slate-800 shadow-xl\`}
      >`;
if (code.includes('sticky top-0 h-[100dvh]')) {
  code = code.replace(asideOld, asideNew);
}

// 3. Close mobile sidebar when clicking menu items
code = code.replace(/onClick=\{\(\) => \{ closeAllModals\(\); setActiveTab\("LIBRARY"\); \}\}/g, 'onClick={() => { closeAllModals(); setActiveTab("LIBRARY"); setIsMobileSidebarOpen(false); }}');
code = code.replace(/onClick=\{\(\) => \{ closeAllModals\(\); setActiveTab\("DASHBOARD"\); \}\}/g, 'onClick={() => { closeAllModals(); setActiveTab("DASHBOARD"); setIsMobileSidebarOpen(false); }}');
code = code.replace(/onClick=\{\(\) => \{ closeAllModals\(\); setActiveTab\("EARLY_WARNING"\); \}\}/g, 'onClick={() => { closeAllModals(); setActiveTab("EARLY_WARNING"); setIsMobileSidebarOpen(false); }}');

// 4. Update Header in Library Tab
const libraryHeaderOld = `              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-black text-[#006838] tracking-tight flex items-center gap-2">
                    <span>📚 Thư Viện Cải Tiến</span>`;
const libraryHeaderNew = `              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <button 
                    type="button" 
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-200 focus:outline-none shrink-0"
                  >
                    <IconMenu2 size={22} />
                  </button>
                  <h2 className="text-[clamp(1.1rem,4vw,1.5rem)] font-black text-[#006838] tracking-tight flex items-center gap-2 flex-wrap min-w-0">
                    <span className="break-words">📚 Thư Viện Cải Tiến</span>`;
code = code.replace(libraryHeaderOld, libraryHeaderNew);

// 5. Update Header in Dashboard Tab? It's inside KaizenDashboard.tsx, we might need to patch it separately if needed, but KaizenDashboard has its own header. Wait, the user specifically mentioned "Thư Viện Cải Tiến" and "Tổng Quan (7 Đơn Vị)" badge.

// Fix "Tổng Quan (7 Đơn Vị)" badge text-wrap
const badgeOld = `<span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-xl border border-blue-200 text-xs font-black shadow-2xs">`;
const badgeNew = `<span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-xl border border-blue-200 text-[10px] sm:text-xs font-black shadow-2xs whitespace-nowrap">`;
code = code.replace(badgeOld, badgeNew);

// Ensure the buttons wrap correctly
const buttonsRowOld = `<div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { closeAllModals(); setActiveTab("EARLY_WARNING"); }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <IconShieldCheck size={15} />
                  <span>🚨 Cảnh Báo Ban 2.2</span>`;

const buttonsRowNew = `<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => { closeAllModals(); setActiveTab("EARLY_WARNING"); }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs grow sm:grow-0 justify-center min-h-[44px]"
                >
                  <IconShieldCheck size={16} />
                  <span className="whitespace-nowrap">🚨 Cảnh Báo 2.2</span>`;
code = code.replace(buttonsRowOld, buttonsRowNew);

const dashboardBtnOld = `<button
                  onClick={() => { closeAllModals(); setActiveTab("DASHBOARD"); }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
                >
                  <IconChartBar size={15} />
                  <span>Dashboard</span>
                </button>`;
const dashboardBtnNew = `<button
                  onClick={() => { closeAllModals(); setActiveTab("DASHBOARD"); }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs min-h-[44px] grow sm:grow-0 justify-center"
                >
                  <IconChartBar size={16} />
                  <span>Dashboard</span>
                </button>`;
code = code.replace(dashboardBtnOld, dashboardBtnNew);

const qrBtnOld = `<button
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md border border-amber-300"
                >
                  <IconQrcode size={16} />
                  <span>Quét QR</span>
                </button>`;
const qrBtnNew = `<button
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md border border-amber-300 min-h-[44px] grow sm:grow-0 justify-center"
                >
                  <IconQrcode size={18} />
                  <span>Quét QR</span>
                </button>`;
code = code.replace(qrBtnOld, qrBtnNew);


fs.writeFileSync(filePath, code);
console.log('Mobile layout patched successfully');
