const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/modules/ci/CIModule.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const asideOld = `<aside
        className={\`bg-[#0b1739] text-slate-200 flex-col flex-shrink-0 transition-all duration-300 select-none z-30 sticky top-0 h-[100dvh] \${
          isSidebarCollapsed ? "w-20" : "w-64 lg:w-72"
        } flex justify-between border-r border-slate-800 shadow-xl\`}
      >`;

const asideNew = `{isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={\`bg-[#0b1739] text-slate-200 flex-col flex-shrink-0 transition-transform duration-300 select-none z-50 fixed md:sticky top-0 h-[100dvh] overflow-y-auto overflow-x-hidden \${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } \${
          isSidebarCollapsed ? "w-20" : "w-64 lg:w-72"
        } flex justify-between border-r border-slate-800 shadow-xl\`}
      >`;

code = code.replace(asideOld, asideNew);

fs.writeFileSync(filePath, code);
console.log('Aside patched');
