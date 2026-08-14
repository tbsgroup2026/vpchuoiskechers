"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconShieldCheck, IconTrendingUp, IconUsers, IconBuildingFactory } from "@tabler/icons-react";

const STATS = [
  { value: 30, suffix: "+", label: "Năm Kinh Nghiệm", icon: IconTrendingUp },
  { value: 50000, suffix: "+", label: "Nhân Sự Toàn Cầu", icon: IconUsers },
  { value: 21, suffix: "M+", label: "Đôi Giày / Năm", icon: IconBuildingFactory },
  { value: 6, suffix: "", label: "Lĩnh Vực Kinh Doanh", icon: IconShieldCheck },
];

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-tbs-dark">
      {/* Parallax background layers */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/tbs-gate.jpg')" }}
        />
        <div className="absolute inset-0 bg-[#08221a]/90 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-tbs-dark via-transparent to-transparent" />
      </div>

      {/* Animated glow orbs */}
      <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-amber-400/8 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 pt-32 pb-20">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-emerald-400 text-[10px] tracking-[0.2em] uppercase font-bold">
              Hệ Thống Vận Hành Trực Tuyến
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] text-white">
            Chuyển đổi số{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                sản xuất
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-emerald-500/20 -skew-x-3 rounded" />
            </span>
            <br />
            toàn diện tại TBS
          </h1>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-white/60 leading-relaxed max-w-[70ch] mx-auto">
            Nền tảng TBS II số hóa toàn bộ hệ thống quản trị nhà máy — từ giám sát máy móc,
            quản lý sự cố, SLA, đến tuyển dụng và truyền thông nội bộ. Thay thế giấy tờ
            truyền thống, tăng cường bảo mật, tối ưu vận hành 24/7.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-400 text-tbs-dark font-bold px-8 py-4 rounded-full text-sm tracking-wider uppercase shadow-xl shadow-emerald-400/20 hover:shadow-emerald-400/40 hover:scale-[1.03] active:scale-95 transition-all duration-300"
            >
              Truy Cập Hệ Thống
              <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#business"
              className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur border border-white/20 hover:bg-white/15 hover:border-white/30 text-white font-semibold px-8 py-4 rounded-full text-sm tracking-wider uppercase transition-all duration-300"
            >
              Khám Phá Lĩnh Vực
            </a>
          </div>
        </div>

        {/* Stats Counter Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 border-t border-white/5 pt-14">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 mb-3 group-hover:bg-emerald-400/20 transition-colors">
                <stat.icon size={22} className="text-emerald-400" />
              </div>
              <strong className="block text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </strong>
              <span className="block text-[11px] uppercase tracking-widest text-white/40 mt-2 font-semibold">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
