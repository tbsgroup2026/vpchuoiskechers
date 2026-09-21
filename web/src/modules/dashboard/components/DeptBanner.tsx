'use client';

import React from 'react';
import PeriodPicker, { PeriodSelection } from './PeriodPicker';

interface DeptBannerProps {
  deptName: string;
  deptCode: string;
  slogan?: string;
  quote?: string;
  period: PeriodSelection;
  onPeriodChange: (period: PeriodSelection) => void;
}

const DEFAULT_SLOGANS: Record<string, string> = {
  HR: 'Quản trị nguồn nhân lực – Đồng hành cùng phát triển',
  NS: 'Quản trị nguồn nhân lực – Đồng hành cùng phát triển',
  IT: 'Tiên phong công nghệ – Tối ưu hóa vận hành',
  KT: 'Chính xác - Min bạch - Hiệu quả tài chính',
  KD: 'Bứt phá doanh số – Dẫn đầu thị trường',
  VH: 'Vận hành xuất sắc – Nâng tầm dịch vụ',
};

const DEFAULT_QUOTES: Record<string, string> = {
  HR: 'Con người là tài sản quan trọng nhất của tổ chức.',
  NS: 'Con người là tài sản quan trọng nhất của tổ chức.',
  IT: 'Công nghệ tạo nên sức mạnh chuyển đổi số.',
  KT: 'Quản lý tài chính vững vàng, tương lai bền vững.',
  KD: 'Khách hàng là trung tâm của mọi sự phát triển.',
};

export default function DeptBanner({
  deptName,
  deptCode,
  slogan,
  quote,
  period,
  onPeriodChange,
}: DeptBannerProps) {
  const codeKey = deptCode ? deptCode.toUpperCase() : '';
  const displaySlogan =
    slogan || DEFAULT_SLOGANS[codeKey] || 'Đồng hành cùng phát triển và thành công';
  const displayQuote =
    quote || DEFAULT_QUOTES[codeKey] || 'Con người là tài sản quan trọng nhất của tổ chức.';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00381e] via-[#005c31] to-[#004d28] p-6 text-white shadow-md border border-[#004d28]">
      {/* Background overlay pattern & imagery effect */}
      <div 
        className="absolute inset-0 opacity-15 bg-cover bg-center mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200')`,
        }}
      />
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left column: Dept Title & Subtitle */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 backdrop-blur-sm border border-emerald-400/30">
              DASHBOARD PHÒNG BAN
            </span>
            {deptCode && (
              <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-xs font-mono font-medium text-emerald-100">
                MÃ: {deptCode}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white drop-shadow-sm">
            Phòng {deptName || 'Nhân sự'}
          </h1>
          <p className="text-sm text-emerald-100/90 font-light">
            {displaySlogan}
          </p>
        </div>

        {/* Center quote */}
        <div className="hidden xl:flex flex-col items-center justify-center text-center px-6 border-x border-emerald-400/20 max-w-xs">
          <span className="text-2xl text-emerald-300/80 leading-none select-none">❝</span>
          <p className="text-xs italic text-emerald-100/90 font-serif leading-relaxed mt-[-4px]">
            {displayQuote}
          </p>
        </div>

        {/* Right column: Period selector */}
        <div className="flex items-center justify-start lg:justify-end shrink-0">
          <PeriodPicker value={period} onChange={onPeriodChange} />
        </div>
      </div>
    </div>
  );
}
