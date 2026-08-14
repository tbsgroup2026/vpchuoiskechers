"use client";

import { useEffect, useState } from "react";
import type { DirectoryType } from "./directories";

export interface DirectoryOption {
  id: number;
  name: string;
  [key: string]: unknown;
}

/** Lấy danh sách option cho 1 combobox danh mục (vd. "zones", "factories"...) */
export function useDirectory(type: DirectoryType) {
  const [options, setOptions] = useState<DirectoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/directories/${type}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setOptions(data.items || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { options, loading };
}
