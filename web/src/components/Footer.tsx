"use client";

import React from "react";
import Link from "next/link";
import {
  IconMapPin,
  IconPhone,
  IconMail,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandLinkedin,
} from "@tabler/icons-react";
import { COMPANY_INFO } from "@/lib/companyData";

const CONTACTS = [
  {
    icon: IconMapPin,
    text: "Văn Phòng Chuỗi SKECHERS - TBS Group, Việt Nam",
  },
  { icon: IconPhone, text: "0296 3878 099" },
  { icon: IconMail, text: "info@tbsgroup.vn" },
];

const FOOTER_LINKS = {
  "TBS Group": [
    { label: "Giới thiệu", href: "/about" },
    { label: "Lịch sử phát triển", href: "/#timeline" },
    { label: "Tầm nhìn & Sứ mệnh", href: "https://www.tbsgroup.vn/tam-nhin-su-menh/" },
    { label: "Giá trị cốt lõi", href: "https://www.tbsgroup.vn/ve-tap-doan-tbs/gia-tri-cot-loi/" },
  ],
  "Truyền thông": [
    { label: "Tin tức & Sự kiện", href: "/news" },
    { label: "Press Center", href: "https://www.tbsgroup.vn/press-center/" },
    { label: "Phát triển bền vững", href: "https://www.tbsgroup.vn/phat-trien-ben-vung/" },
    { label: "Living Wage", href: "#" },
  ],
  "Cơ hội": [
    { label: "Tuyển dụng", href: "/careers" },
    { label: "Học bổng Khuyến học", href: "#" },
    { label: "Liên hệ HR", href: "/contact" },
    { label: "Nội bộ", href: "/login" },
  ],
  "Pháp lý": [
    { label: "Điều khoản dịch vụ", href: "#" },
    { label: "Chính sách bảo mật", href: "#" },
    { label: "ISO 9001:2015", href: "#" },
    { label: "SBTi Carbon Commitment", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-[#004d28] text-white overflow-hidden">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-[#006838] to-amber-400" />

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-10 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden">
                <img
                  src="/images/crawled/logo.png"
                  alt="TBS"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <span className="block text-white font-black text-lg tracking-wide leading-tight">
                  TBS GROUP
                </span>
                <span className="block text-accent-soft text-[9px] tracking-[0.2em] uppercase font-bold">
                  Digital Factory II
                </span>
              </div>
            </div>

            <p className="text-sm text-white/35 leading-relaxed max-w-sm">
              {COMPANY_INFO.intro}
            </p>

            <div className="space-y-2.5 pt-2">
              {CONTACTS.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-sm text-white/45"
                >
                  <c.icon size={17} className="text-accent-soft mt-0.5 shrink-0" />
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title} className="space-y-4">
                <h4 className="text-xs font-black tracking-widest uppercase text-accent-soft">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/35 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
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
            <span className="text-xs text-white/25">
              &copy; {new Date().getFullYear()} TBS Group. Tất cả quyền được bảo lưu.
            </span>
            <div className="hidden sm:flex items-center gap-4">
              <a
                href="#"
                className="text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                Điều khoản
              </a>
              <a
                href="#"
                className="text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                Bảo mật
              </a>
              <a
                href="#"
                className="text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                Cookies
              </a>
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
                className="w-10 h-10 rounded-full bg-white/5 border border-white/8 flex items-center justify-center hover:bg-accent-light/20 hover:border-accent-soft/30 transition-all duration-200"
              >
                <social.icon size={18} className="text-white/50" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
