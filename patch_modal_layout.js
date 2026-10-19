const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/modules/ci/KaizenDetailModal.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const oldModalContainer = `<div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[98vw] sm:max-w-[95vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] h-[92vh] max-h-[92vh] flex flex-row overflow-hidden text-left animate-in zoom-in-95 duration-200">`;

const newModalContainer = `<div className={\`fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200 \${isPublicView ? 'bg-slate-50 p-0' : 'bg-slate-950/70 backdrop-blur-md p-2 sm:p-4 md:p-6'}\`}>
      <div className={\`bg-white flex flex-row overflow-hidden text-left animate-in zoom-in-95 duration-200 \${isPublicView ? 'w-full h-full rounded-none border-0' : 'rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[98vw] sm:max-w-[95vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] h-[92vh] max-h-[92vh]'}\`}>`;

code = code.replace(oldModalContainer, newModalContainer);

// Hide close button if public mode
const oldCloseBtn = `<button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-colors shadow-2xs absolute top-4 right-4 sm:top-5 sm:right-5 z-20 focus:outline-none"
            >
              <IconX size={20} stroke={2.5} />
            </button>`;

const newCloseBtn = `<button
              type="button"
              onClick={isPublicView ? () => window.location.href = "/" : onClose}
              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-colors shadow-2xs absolute top-4 right-4 sm:top-5 sm:right-5 z-20 focus:outline-none"
              title={isPublicView ? "Về trang chủ" : "Đóng"}
            >
              <IconX size={20} stroke={2.5} />
            </button>`;

code = code.replace(oldCloseBtn, newCloseBtn);

fs.writeFileSync(filePath, code);
console.log('KaizenDetailModal fullscreen layout patched successfully.');
