"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Bell, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopBar } from "@/components/layout/TopBar";
import { loadSessionUser, saveSessionUser, subscribeSessionChange } from "@/lib/client/user-session";
import { GoogleAccountForm } from "@/components/auth/GoogleAccountForm";

export type ToolRow = { name: string; description: string };

type SessionUser = ReturnType<typeof loadSessionUser>;

type PreviewNotification = {
  id: string;
  app: string;
  title: string;
  body: string;
  at: string;
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generatePreviewNotifications(): PreviewNotification[] {
  const apps = ["Calendar", "Messages", "Slack", "Mail", "Fitness", "Maps"];
  const titles = [
    "Standup in 10 min",
    "Running late?",
    "New mention in #product",
    "Your focus block",
    "Rain expected",
    "Weekly summary",
  ];
  const bodies = [
    "Conference room B / Zoom",
    "Reply with ETA",
    "@you on the launch thread",
    "Deep work · 2h",
    "Bring an umbrella after 4pm",
    "See what changed on your calendar",
  ];
  const n = 4 + Math.floor(Math.random() * 4);
  const now = Date.now();
  const out: PreviewNotification[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `n-${now}-${i}`,
      app: randomPick(apps),
      title: randomPick(titles),
      body: randomPick(bodies),
      at: new Date(now - i * 7 * 60_000 - Math.floor(Math.random() * 20) * 60_000).toISOString(),
    });
  }
  return out;
}

export function ToolsPageClient({ tools }: { tools: ToolRow[] }) {
  const dialogTitleId = useId();
  const [sessionUser, setSessionUser] = useState<SessionUser>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [notifications, setNotifications] = useState<PreviewNotification[]>([]);
  const [notifHint, setNotifHint] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setSessionUser(loadSessionUser());
    sync();
    return subscribeSessionChange(sync);
  }, []);

  useEffect(() => {
    if (!loginOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLoginOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loginOpen]);

  const signOut = useCallback(() => {
    saveSessionUser(null);
  }, []);

  const pullNotifications = useCallback(() => {
    setNotifHint(
      "Showing a preview list. Full device notification access depends on your browser and OS; connect a push provider later for live items."
    );
    setNotifications(generatePreviewNotifications());
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setNotifHint("Notifications are not available in this environment.");
      return;
    }
    const p = await Notification.requestPermission();
    if (p === "granted") {
      new Notification("Phuko", {
        body: "You will see alerts here when something needs your attention.",
      });
      setNotifHint("Notifications are on. You will also see the preview list below when you refresh it.");
    } else {
      setNotifHint(`Notifications: ${p}. You can still use the preview list below.`);
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Tools" subtitle="What the assistant can call on your behalf" />
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="border-emerald-100 bg-emerald-50/40">
            <CardHeader className="py-4">
              <CardTitle className="text-base text-emerald-950">Account & device</CardTitle>
              <CardDescription className="text-sm text-emerald-900/85">
                Google sign-in and notification preview. Use another account or add a second device from here anytime.
              </CardDescription>
            </CardHeader>
            <div className="space-y-4 border-t border-emerald-100/90 px-6 pb-6 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                {sessionUser ? (
                  <>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                      <div className="font-medium text-slate-900">{sessionUser.displayName}</div>
                      <div className="text-xs text-slate-500">{sessionUser.email}</div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        Signed in · {new Date(sessionUser.signedAt).toLocaleString()}
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={signOut} className="gap-1">
                      <LogOut className="size-3.5" />
                      Sign out
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setLoginOpen(true)}>
                      Use a different account
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="secondary" onClick={() => setLoginOpen(true)}>
                    Sign in with Google
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={pullNotifications}>
                  <Bell className="size-3.5" />
                  Read notifications
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={requestNotificationPermission}>
                  Turn on browser notifications
                </Button>
              </div>

              {notifHint ? <p className="text-xs leading-relaxed text-emerald-900/80">{notifHint}</p> : null}

              {notifications.length > 0 ? (
                <ul className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-slate-800">{n.title}</span>
                        <span className="shrink-0 font-mono text-[10px] text-slate-400">
                          {new Date(n.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-emerald-800">{n.app}</span> · {n.body}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Card>

          <p className="text-sm text-slate-500">
            Ask in the chat in plain language—you never need to type tool names. Below is only a reference.
          </p>
          <div className="grid gap-3">
            {tools.map((t) => (
              <Card key={t.name} className="border-slate-200">
                <CardHeader className="py-3">
                  <CardTitle className="font-mono text-sm text-emerald-800">{t.name}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-slate-600">{t.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {loginOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLoginOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
              onClick={() => setLoginOpen(false)}
            >
              <X className="size-4" />
            </button>
            <h2 id={dialogTitleId} className="pr-8 text-lg font-semibold text-slate-900">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-slate-500">to continue to Phuko</p>
            <div className="mt-6">
              <GoogleAccountForm onSuccess={() => setLoginOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
