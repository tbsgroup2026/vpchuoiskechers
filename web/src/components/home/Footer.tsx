"use client";

import React from "react";
import Link from "next/link";
import {
  IconMapPin, IconPhone, IconMail, IconBrandFacebook,
  IconBrandYoutube, IconBrandLinkedin, IconBuildingFactory
} from "@tabler/icons-react";

const FOOTER_LINKS = {
  "Về TBS Group": [
    { label: "Lịch sử phát triển", href: "#timeline" },
    { label: "Lĩnh vực hoạt động", href: "#business" },
    { label: "Tầm nhìn & Sứ mệnh", href: "https://www.tbsgroup.vn/tam-nhin-su-menh/" },
    { label: "Giá trị cốt lõi", href: "https://www.tbsgroup.vn/ve-tap-doan-tbs/gia-tri-cot-loi/" },
  ],
  "Truyền Thông": [
    { label: "Tin tức & Sự kiện", href: "#news" },
    { label: "Press Center", href: "https://www.tbsgroup.vn/press-center/" },
    { label: "Phát triển bền vững", href: "https://www.tbsgroup.vn/phat-trien-ben-vung/" },
    { label: "Nội bộ", href: "#" },
  ],
  "Cơ Hội": [
    { label: "Tuyển dụng", href: "/careers" },
    { label: "Học bổng Khuyến học", href: "#" },
    { label: "Living Wage", href: "#" },
    { label: "Liên hệ HR", href: "#contact" },
  ],
  "Pháp Lý": [
    { label: "Điều khoản dịch vụ", href: "#" },
    { label: "Chính sách bảo mật", href: "#" },
    { label: "ISO 9001:2015", href: "#" },
    { label: "SBTi Carbon Commitment", href: "#" },
  ],
};

const CONTACTS = [
  { icon: IconMapPin, text: "Văn Phòng Chuỗi SKECHERS - TBS Group, Việt Nam" },
  { icon: IconPhone, text: "0296 3878 099" },
  { icon: IconMail, text: "contact@tbsgroup.vn" },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative bg-[#061a14] text-white overflow-hidden">
      {/* Top gradient line */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400" />

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-20">
        {/* Top row: Logo + Description */}
        <div className="grid lg:grid-cols-12 gap-10 mb-14">
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                <img src="/images/crawled/logo.png" alt="TBS" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <span className="block text-white font-black text-lg tracking-wide leading-tight">TBS GROUP</span>
                <span className="block text-emerald-400 text-[9px] tracking-[0.2em] uppercase font-bold">Digital Factory II</span>
              </div>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-md">
              Văn Phòng Chuỗi SKECHERS thuộc hệ thống TBS Group - tập đoàn đa ngành hàng đầu Việt Nam.
              Không ngừng đổi mới sáng tạo, số hóa sản xuất toàn diện để phát triển bền vững và
              hội nhập toàn cầu.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 pt-2">
              {CONTACTS.map((c, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-white/50">
                  <c.icon size={17} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title} className="space-y-4">
                <h4 className="text-xs font-black tracking-widest uppercase text-emerald-400">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/40 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} TBS Group. All rights reserved.
            </span>
            <div className="hidden sm:flex items-center gap-4">
              <a href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">Điều khoản</a>
              <a href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">Bảo mật</a>
              <a href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">Cookies</a>
            </div>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {[
              { icon: IconBrandFacebook, href: "#", label: "Facebook" },
              { icon: IconBrandYoutube, href: "#", label: "YouTube" },
              { icon: IconBrandLinkedin, href: "#", label: "LinkedIn" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-400/20 hover:border-emerald-400/40 transition-all"
              >
                <social.icon size={18} className="text-white/60" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
