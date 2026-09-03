import type { Metadata, Viewport } from "next";
import "./globals.css";
import DevToolsShield from "@/components/DevToolsShield";
import MobileBottomNav from "@/components/MobileBottomNav";
import NotificationInitializer from "@/components/NotificationInitializer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#08221a",
  viewportFit: "cover",
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
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SKECHERS TBS Group",
  },
  openGraph: {
    title: "Văn Phòng Chuỗi SKECHERS - TBS Group",
    description:
      "Trung tâm điều hành và quản trị số hoá vận hành chuỗi cung ứng SKECHERS - TBS Group.",
    type: "website",
    images: ["/icon.png"],
  },
};

import { PerformanceProvider } from "@/components/PerformanceProvider";
import PerfDebugOverlay from "@/components/PerfDebugOverlay";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className="h-full antialiased font-sans"
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="stylesheet" href="/compiled-tailwind.css" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="shortcut icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.addEventListener('error', function(e) {
                  var target = e.target;
                  if (target && (target.tagName === 'LINK' || target.tagName === 'SCRIPT')) {
                    var url = target.src || target.href || '';
                    if (url.indexOf('/_next/static/') !== -1) {
                      console.warn('Detected 404 missing chunk or CSS, clearing cache & reloading...', url);
                      if (!sessionStorage.getItem('tbs_chunk_auto_reloaded')) {
                        sessionStorage.setItem('tbs_chunk_auto_reloaded', '1');
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.getRegistrations().then(function(regs) {
                            for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                            window.location.reload(true);
                          });
                        } else {
                          window.location.reload(true);
                        }
                      }
                    }
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink pb-16 sm:pb-0">
        <PerformanceProvider>
          <DevToolsShield />
          <NotificationInitializer />
          {children}
          <MobileBottomNav />
          <PerfDebugOverlay />
        </PerformanceProvider>
      </body>
    </html>
  );
}
