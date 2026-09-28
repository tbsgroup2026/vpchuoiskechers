"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function GuestRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;

    const GUEST_ALLOWED_TARGET = "/work/kaizen/van-phong-chuoi";

    try {
      const token = localStorage.getItem("tbs_jwt_token");
      if (token) {
        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.success && data.user) {
              const isGuest =
                data.user.roleCode === "JUDGE_GUEST" ||
                Boolean(data.user.isGuest) ||
                data.user.roles?.includes("judge_guest") ||
                data.user.empCode?.startsWith("GUEST_") ||
                (typeof data.user.username === "string" && data.user.username.toUpperCase().startsWith("BGK"));

              if (isGuest) {
                // Guest judge attempting to access anything other than the designated judging page or login/api -> Redirect directly!
                const isAllowedRoute =
                  pathname === "/login" ||
                  pathname === GUEST_ALLOWED_TARGET ||
                  pathname === "/work/kaizen/judge" ||
                  pathname.startsWith("/api/");

                if (!isAllowedRoute) {
                  router.replace(GUEST_ALLOWED_TARGET);
                }
              }
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, [pathname, router]);

  return null;
}
