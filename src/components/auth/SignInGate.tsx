"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { loadSessionUser, subscribeSessionChange } from "@/lib/client/user-session";
import { GoogleAccountForm } from "@/components/auth/GoogleAccountForm";

export function SignInGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof loadSessionUser>>(null);

  const refresh = useCallback(() => {
    setUser(loadSessionUser());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    return subscribeSessionChange(refresh);
  }, [refresh]);

  if (!ready) {
    return (
      <div className="flex h-screen min-h-0 flex-col items-center justify-center gap-2 bg-slate-50 text-slate-500">
        <Loader2 className="size-6 animate-spin text-emerald-600" aria-hidden />
        <span className="text-sm">One moment…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex size-11 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
              style={{
                background: "conic-gradient(from 180deg, #EA4335, #FBBC05, #34A853, #4285F4, #EA4335)",
              }}
              aria-hidden
            >
              G
            </div>
            <h1 className="mt-4 text-xl font-medium text-slate-800">Sign in</h1>
            <p className="mt-1 text-sm text-slate-600">to continue to Phuko</p>
          </div>

          <div className="mt-8">
            <GoogleAccountForm />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
            One account for Coach, Calendar, and Rules.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
