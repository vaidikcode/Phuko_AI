import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SignInGate } from "@/components/auth/SignInGate";
import { SetupGate } from "@/components/auth/SetupGate";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phuko — Schedule OS",
  description: "Schedule repair, rules, and calendar leverage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <QueryProvider>
          <SignInGate>
            <SetupGate>
              <div className="flex h-screen min-h-0">
                <Sidebar />
                <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50">{children}</main>
              </div>
            </SetupGate>
          </SignInGate>
        </QueryProvider>
      </body>
    </html>
  );
}
