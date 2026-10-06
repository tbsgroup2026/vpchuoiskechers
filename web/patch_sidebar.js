const fs = require('fs');

const path = 'src/modules/ci/CIModule.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add scrollIntoView useEffect
const useEffectScrollStr = `
  useEffect(() => {
    const scrollSidebar = () => {
      const activeItem = document.querySelector(".sidebar-item-active");
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    const t = setTimeout(scrollSidebar, 150);
    return () => clearTimeout(t);
  }, [selectedRegion, selectedCategory, selectedWorkshop, selectedRegType]);

  return (`;
code = code.replace("  return (", useEffectScrollStr);

// 2. Change ASIDE wrapper
const asideOld = `<aside
        className={\`bg-[#0b1739] text-slate-200 flex-col flex-shrink-0 transition-all duration-300 select-none z-30 sticky top-0 h-screen overflow-y-auto \${
          isSidebarCollapsed ? "w-20 p-2.5" : "w-64 lg:w-72 p-3.5"
        } flex flex-col justify-between border-r border-slate-800 shadow-xl\`}
      >
        <div className="space-y-4">`;

const asideNew = `<aside
        className={\`bg-[#0b1739] text-slate-200 flex-col flex-shrink-0 transition-all duration-300 select-none z-30 sticky top-0 h-[100dvh] \${
          isSidebarCollapsed ? "w-20" : "w-64 lg:w-72"
        } flex justify-between border-r border-slate-800 shadow-xl\`}
      >
        {/* VÙNG ĐẦU CỐ ĐỊNH */}
        <div className={\`flex-shrink-0 flex flex-col \${isSidebarCollapsed ? "p-2.5" : "p-3.5"} space-y-4 z-10 shadow-sm shadow-[#0b1739] bg-[#0b1739]\`}>`;
code = code.replace(asideOld, asideNew);

// 3. Close Top region, open Middle region
const middleOld = `          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  LỌC NHANH`;

const middleNew = `        </div>
        
        {/* VÙNG GIỮA CUỘN */}
        <div className={\`flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth \${isSidebarCollapsed ? "px-2.5" : "px-3.5"} pb-4 sidebar-middle-scroll\`}>
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {!isSidebarCollapsed && (
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  LỌC NHANH`;
code = code.replace(middleOld, middleNew);

// 4. Close Middle region, open Bottom region
const bottomOld = `              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/90 flex items-center justify-between">`;

const bottomNew = `              )}
            </div>
          </div>
        </div>

        {/* VÙNG ĐUÔI CỐ ĐỊNH */}
        <div className={\`flex-shrink-0 pt-3 pb-3 border-t border-slate-800/90 flex items-center justify-between z-10 shadow-[0_-4px_10px_rgba(11,23,57,0.5)] bg-[#0b1739] \${isSidebarCollapsed ? "px-2.5" : "px-3.5"}\`}>`;
code = code.replace(bottomOld, bottomNew);

// 5. Inject CSS for @media(max-height:600px) into MENU buttons
code = code.replace(
  /isSidebarCollapsed \? "p\.2\.5 justify-center" : "px-3\.5 py-2"/g,
  'isSidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2 [@media(max-height:600px)]:p-2.5 [@media(max-height:600px)]:justify-center"'
);
code = code.replace(
  /isSidebarCollapsed \? "p\.2\.5 justify-center" : "px-3\.5 py-2\.5"/g,
  'isSidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2.5 [@media(max-height:600px)]:p-2.5 [@media(max-height:600px)]:justify-center"'
);

// Menu Text spans:
code = code.replace(/<span className="truncate">Về Trang Chủ<\/span>/g, '<span className="truncate [@media(max-height:600px)]:hidden">Về Trang Chủ</span>');
code = code.replace(/<span className="truncate">🏠 Về Tổng Quan<\/span>/g, '<span className="truncate [@media(max-height:600px)]:hidden">🏠 Về Tổng Quan</span>');
code = code.replace(/<span className="text-xs truncate">Thư viện<\/span>/g, '<span className="text-xs truncate [@media(max-height:600px)]:hidden">Thư viện</span>');
code = code.replace(/<span className="text-xs truncate">Dashboard<\/span>/g, '<span className="text-xs truncate [@media(max-height:600px)]:hidden">Dashboard</span>');
code = code.replace(/<span className="truncate">Cảnh báo Ban 2\.2<\/span>/g, '<span className="truncate [@media(max-height:600px)]:hidden">Cảnh báo Ban 2.2</span>');
code = code.replace(/<span className="truncate">Đăng tải nhanh<\/span>/g, '<span className="truncate [@media(max-height:600px)]:hidden">Đăng tải nhanh</span>');
// Fix Hướng dẫn sử dụng & Mở rộng menu
// Menu Title
code = code.replace(
  /<h4 className="text-\[10px\] font-black uppercase text-slate-400 tracking-wider px-2">/g,
  '<h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 [@media(max-height:600px)]:hidden">'
);


// 6. Add sidebar-item-active class to active filters
// REGION
code = code.replace(/selectedRegion === "Văn phòng Chuỗi" \? "bg-emerald-900\/80 text-emerald-200 font-black" : "text-slate-400 hover:bg-slate-800\/60 hover:text-slate-200 font-medium"/g,
  'selectedRegion === "Văn phòng Chuỗi" ? "bg-emerald-900/80 text-emerald-200 font-black sidebar-item-active" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium"');
code = code.replace(/selectedRegion === "Nhà Máy Miền Đông" \? "bg-emerald-900\/80 text-emerald-200 font-black" : "text-slate-400 hover:bg-slate-800\/60 hover:text-slate-200 font-medium"/g,
  'selectedRegion === "Nhà Máy Miền Đông" ? "bg-emerald-900/80 text-emerald-200 font-black sidebar-item-active" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium"');
code = code.replace(/selectedRegion === "THKG" \? "bg-emerald-900\/80 text-emerald-200 font-black" : "text-slate-300 hover:bg-slate-800\/60 hover:text-white font-bold"/g,
  'selectedRegion === "THKG" ? "bg-emerald-900/80 text-emerald-200 font-black sidebar-item-active" : "text-slate-300 hover:bg-slate-800/60 hover:text-white font-bold"');

code = code.replace(/selectedRegion === item \? "bg-emerald-900\/80 text-emerald-200 font-black"/g,
  'selectedRegion === item ? "bg-emerald-900/80 text-emerald-200 font-black sidebar-item-active"');

// WORKSHOP
code = code.replace(/selectedWorkshop === "ALL"\n                            \? "text-emerald-400 bg-emerald-950\/40"/g,
  'selectedWorkshop === "ALL"\n                            ? "text-emerald-400 bg-emerald-950/40"');
code = code.replace(/selectedWorkshop === stg\.key\n                                \? "bg-emerald-900\/80 text-emerald-200 font-black"/g,
  'selectedWorkshop === stg.key\n                                ? "bg-emerald-900/80 text-emerald-200 font-black sidebar-item-active"');

// CATEGORY
code = code.replace(/selectedCategory === c\.id \? "bg-\[#006838\] text-white font-extrabold" : "text-slate-300 hover:bg-slate-800\/80 hover:text-white"/g,
  'selectedCategory === c.id ? "bg-[#006838] text-white font-extrabold sidebar-item-active" : "text-slate-300 hover:bg-slate-800/80 hover:text-white"');

// REGTYPE
code = code.replace(/selectedRegType === "THI_DUA"\n                        \? "bg-amber-500\/20 text-amber-300 font-extrabold border border-amber-500\/30"\n                        : "text-slate-300 hover:bg-slate-800\/80 hover:text-white"/g,
  'selectedRegType === "THI_DUA"\n                        ? "bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30 sidebar-item-active"\n                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"');
code = code.replace(/selectedRegType === "CHO_PHE_DUYET"\n                        \? "bg-rose-500\/20 text-rose-300 font-extrabold"\n                        : "text-slate-300 hover:bg-slate-800\/80 hover:text-white"/g,
  'selectedRegType === "CHO_PHE_DUYET"\n                        ? "bg-rose-500/20 text-rose-300 font-extrabold sidebar-item-active"\n                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"');
code = code.replace(/selectedRegType === "DA_DANH_GIA"\n                        \? "bg-emerald-500\/20 text-emerald-300 font-extrabold"\n                        : "text-slate-300 hover:bg-slate-800\/80 hover:text-white"/g,
  'selectedRegType === "DA_DANH_GIA"\n                        ? "bg-emerald-500/20 text-emerald-300 font-extrabold sidebar-item-active"\n                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"');
code = code.replace(/selectedRegType === "LUU_TRU"\n                        \? "bg-slate-800 text-white font-extrabold"\n                        : "text-slate-400 hover:bg-slate-800\/80 hover:text-white"/g,
  'selectedRegType === "LUU_TRU"\n                        ? "bg-slate-800 text-white font-extrabold sidebar-item-active"\n                        : "text-slate-400 hover:bg-slate-800/80 hover:text-white"');


fs.writeFileSync(path, code);
console.log('Patched CIModule.tsx successfully!');
