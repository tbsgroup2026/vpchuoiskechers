import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import DevToolsShield from "@/components/DevToolsShield";
import MobileBottomNav from "@/components/MobileBottomNav";

const vietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#08221a",
};

export const metadata: Metadata = {
  title: "Văn Phòng Chuỗi SKECHERS - TBS Group",
  description:
    "Hệ thống quản trị vận hành chuỗi cung ứng và sản xuất SKECHERS - TBS Group (Gemba Walk, Cải tiến CI, Kaizen, Biểu mẫu, BI Dashboard 24/7).",
  keywords:
    "Văn Phòng Chuỗi SKECHERS - TBS Group, SKECHERS, TBS Group, Gemba Walk, CI, Kaizen, Quản trị hằng ngày, Quản lý nhà máy",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Văn Phòng Chuỗi SKECHERS - TBS Group",
    description:
      "Trung tâm điều hành và quản trị số hoá vận hành chuỗi cung ứng SKECHERS - TBS Group.",
    type: "website",
    images: ["/icon.png"],
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
      className={`${vietnamPro.variable} ${jakartaSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink pb-16 sm:pb-0">
        <DevToolsShield />
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
