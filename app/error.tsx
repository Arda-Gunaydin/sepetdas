"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <TriangleAlert className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-extrabold">Bir şeyler ters gitti</h1>
      <p className="text-muted-foreground">Lütfen tekrar dene. Sorun devam ederse biraz sonra yeniden gir.</p>
      <Button onClick={reset}>Tekrar dene</Button>
    </main>
  );
}
