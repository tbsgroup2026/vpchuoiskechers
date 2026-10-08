"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";

interface LinkItem {
  id: string;
  category?: string; // e.g. KE_HOACH_CONG_VIEC
  label: string;
  url: string;
  icon?: string;
  color?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || "Lỗi khi tải danh sách link");
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Lỗi từ server khi tải link");
  }
  return json.data;
};

export function useLinks(dept: string = "finance") {
  const [fallbackData, setFallbackData] = useState<any>(null);
  
  // Try to load from localStorage initially
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`tbs_links_${dept}`);
      if (cached) {
        try {
          setFallbackData(JSON.parse(cached));
        } catch (e) {}
      }
    }
  }, [dept]);

  const { data, error, isLoading, mutate } = useSWR(`/api/links?dept=${dept}`, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    fallbackData,
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(`tbs_links_${dept}`, JSON.stringify(data));
      }
    }
  });

  return {
    data: data || fallbackData,
    isLoading: isLoading && !fallbackData, // Only show true loading if we don't even have fallback
    error,
    refresh: mutate
  };
}
