"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface StatusCounts {
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  implemented: number;
  total: number;
  [key: string]: number;
}

interface StatusCountsContextType {
  counts: StatusCounts;
  loading: boolean;
  refetchStatusCounts: () => Promise<void>;
}

const defaultCounts: StatusCounts = {
  submitted: 0,
  underReview: 0,
  approved: 0,
  rejected: 0,
  implemented: 0,
  total: 0,
};

const StatusCountsContext = createContext<StatusCountsContextType>({
  counts: defaultCounts,
  loading: false,
  refetchStatusCounts: async () => {},
});

export function StatusCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<StatusCounts>(defaultCounts);
  const [loading, setLoading] = useState(false);

  const refetchStatusCounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ci-kaizen/status-counts");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.counts) {
          setCounts(json.counts);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch status counts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchStatusCounts();
  }, [refetchStatusCounts]);

  return (
    <StatusCountsContext.Provider value={{ counts, loading, refetchStatusCounts }}>
      {children}
    </StatusCountsContext.Provider>
  );
}

export function useStatusCounts() {
  return useContext(StatusCountsContext);
}
