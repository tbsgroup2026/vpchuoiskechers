import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import DevToolsShield from "@/components/DevToolsShield";

const vietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Văn Phòng Chuỗi SKECHERS - TBS Group",
  description:
    "Hệ thống quản trị vận hành chuỗi cung ứng và sản xuất SKECHERS - TBS Group (Gemba Walk, Cải tiến CI, Kaizen, Biểu mẫu, BI Dashboard 24/7).",
  keywords:
    "Văn Phòng Chuỗi SKECHERS - TBS Group, SKECHERS, TBS Group, Gemba Walk, CI, Kaizen, Quản trị hằng ngày, Quản lý nhà máy",
  manifest: "/manifest.json",
  themeColor: "#08221a",
  openGraph: {
    title: "Văn Phòng Chuỗi SKECHERS - TBS Group",
    description:
      "Trung tâm điều hành và quản trị số hoá vận hành chuỗi cung ứng SKECHERS - TBS Group.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${vietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink">
        <DevToolsShield />
        {children}
      </body>
    </html>
  );
}
