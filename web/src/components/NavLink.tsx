"use client";

import React from "react";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
}

export default function NavLink({
  href,
  children,
  className = "",
  activeClassName = "",
  exact = false,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const hrefStr = typeof href === "object" ? href.pathname || "" : href;

  const isActive = exact
    ? pathname === hrefStr
    : pathname === hrefStr || (hrefStr !== "/" && pathname?.startsWith(hrefStr));

  const combinedClassName = `${className} ${isActive ? activeClassName : ""}`.trim();

  return (
    <Link href={href} className={combinedClassName} {...props}>
      {children}
    </Link>
  );
}
