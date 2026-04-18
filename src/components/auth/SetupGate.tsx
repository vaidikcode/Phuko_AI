"use client";

import { useEffect, useState } from "react";
import { RulesSetup } from "@/components/onboarding/RulesSetup";

const SETUP_KEY = "phuko_setup_v1";

export function SetupGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    setSetupDone(localStorage.getItem(SETUP_KEY) === "done");
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!setupDone) {
    return (
      <RulesSetup
        onComplete={() => {
          localStorage.setItem(SETUP_KEY, "done");
          setSetupDone(true);
        }}
      />
    );
  }

  return <>{children}</>;
}
