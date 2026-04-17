/**
 * Client-only: browser session for signed-in user (import from `"use client"` modules only).
 * Password is never stored—only email and display name are persisted locally.
 */

export const SESSION_STORAGE_KEY = "phuko_session_v1";
const LEGACY_SESSION_KEY = "phuko_mock_google_v1";

export const SESSION_CHANGED_EVENT = "phuko-session-changed";

export type SessionUser = {
  email: string;
  displayName: string;
  signedAt: string;
};

function migrateLegacyIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SESSION_STORAGE_KEY)) return;
  const leg = localStorage.getItem(LEGACY_SESSION_KEY);
  if (!leg) return;
  try {
    const o = JSON.parse(leg) as { email?: string; name?: string; signedAt?: string };
    if (typeof o.email !== "string" || typeof o.name !== "string") return;
    const local = o.email.split("@")[0] ?? "User";
    const displayName = local.charAt(0).toUpperCase() + local.slice(1);
    const row: SessionUser = {
      email: o.email,
      displayName,
      signedAt: typeof o.signedAt === "string" ? o.signedAt : new Date().toISOString(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(row));
  } catch {
    /* ignore */
  }
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

export function loadSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  migrateLegacyIfNeeded();
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as SessionUser;
    if (typeof o?.email === "string" && typeof o?.displayName === "string") return o;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveSessionUser(user: SessionUser | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
}

export function subscribeSessionChange(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener(SESSION_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(SESSION_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
