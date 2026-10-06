"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAllowedModules } from "@/lib/rbac";

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
          .then((res) => {
            if (res.status === 401) {
              document.cookie = "tbs_token=; path=/; max-age=0";
              sessionStorage.removeItem("tbs_current_user");
              localStorage.removeItem("tbs_current_user");
              window.location.href = "/login?expired=1";
              return null;
            }
            return res.json();
          })
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
                  pathname === "/work/kaizen" ||
                  pathname === "/work/kaizen/judge" ||
                  pathname.startsWith("/api/");

                if (!isAllowedRoute) {
                  router.replace(GUEST_ALLOWED_TARGET);
                }
                return;
              }

              // Normal User RBAC check
              const allowedModules = getAllowedModules(data.user);
              if (allowedModules !== "ALL") {
                const routeToModuleMap: Record<string, string> = {
                  "/work/overview": "overview",
                  "/work/tasks": "tasks",
                  "/work/projects": "projects",
                  "/work/gemba": "gemba",
                  "/work/finance": "finance",
                  "/work/hr": "hr",
                  "/work/rd": "rd",
                  "/work/ci": "ci",
                  "/work/kaizen": "ci",
                  "/work/qc": "qc",
                  "/work/logistics": "logistics",
                  "/work/production": "production",
                  "/work/production-output": "production-output",
                };

                let targetModule = "";
                for (const route in routeToModuleMap) {
                  if (pathname.startsWith(route)) {
                    targetModule = routeToModuleMap[route];
                    break;
                  }
                }

                if (targetModule && !allowedModules.includes(targetModule)) {
                  alert("Bạn không có quyền truy cập chức năng này.");
                  router.replace("/work");
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
