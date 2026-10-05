import type { SourceType } from "@/lib/types";
import type { DemoGuide } from "./sample";

// The visitor's free demo study guide, remembered in this browser so they can come
// back to it, and so it can be saved to their account once they sign up.
export type StoredDemo = {
  id: string; // server id, used to claim it after sign-up
  title: string;
  sourceType: SourceType;
  guide: DemoGuide;
};

const KEY = "estudia-demo-v1";

// Storage can be unavailable (private mode, blocked site data); the demo still works without it.
export function loadDemo(): StoredDemo | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredDemo) : null;
  } catch {
    return null;
  }
}

export function saveDemo(demo: StoredDemo) {
  try {
    localStorage.setItem(KEY, JSON.stringify(demo));
  } catch {
    // ignore
  }
}

export function clearDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
