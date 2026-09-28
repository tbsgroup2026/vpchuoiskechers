import { useState, useEffect } from "react";

/**
 * Auto-Save & Draft Management Utility
 * Saves form drafts to localStorage with debounce and handles beforeunload dirty warnings.
 */

export interface DraftMetadata {
  formKey: string;
  updatedAt: string;
  data: any;
}

export function saveFormDraft(formKey: string, data: any): void {
  if (typeof window === "undefined") return;
  try {
    const draft: DraftMetadata = {
      formKey,
      updatedAt: new Date().toISOString(),
      data,
    };
    localStorage.setItem(`tbs_draft_${formKey}`, JSON.stringify(draft));
  } catch (e) {
    console.warn("Failed to save draft to localStorage:", e);
  }
}

export function loadFormDraft<T = any>(formKey: string): DraftMetadata | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`tbs_draft_${formKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as DraftMetadata;
  } catch (e) {
    return null;
  }
}

export function clearFormDraft(formKey: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`tbs_draft_${formKey}`);
  } catch (e) {}
}

/**
 * React Hook helper for auto-saving form drafts
 */
export function useAutoSave<T>(formKey: string, data: T, enabled = true, intervalMs = 5000) {
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasDraft(Boolean(loadFormDraft(formKey)));
    }
  }, [formKey]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const timer = setInterval(() => {
      saveFormDraft(formKey, data);
      setHasDraft(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [formKey, data, enabled, intervalMs]);

  const draft = loadFormDraft<T>(formKey)?.data ?? null;

  return {
    draft,
    hasDraft,
    clearDraft: () => {
      clearFormDraft(formKey);
      setHasDraft(false);
    },
  };
}

/**
 * React Hook helper for beforeunload dirty state warning
 */
export function useDirtyFormWarning(isDirty: boolean) {
  if (typeof window !== "undefined") {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Dữ liệu form chưa được lưu. Bạn có chắc chắn muốn rời đi?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }
}
