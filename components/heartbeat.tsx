"use client";

import { useEffect } from "react";
import { touchLastSeen } from "@/lib/actions/activity";

/** Sekme görünürken dakikada bir "buradayım" sinyali gönderir (yönetici panelindeki çevrim içi durumu). */
export function Heartbeat({ seconds = 60 }: { seconds?: number }) {
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState === "visible") void touchLastSeen().catch(() => {});
    };
    beat();
    const id = setInterval(beat, seconds * 1000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [seconds]);
  return null;
}
