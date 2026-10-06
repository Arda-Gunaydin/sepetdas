import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "error";

const tones: Record<Tone, { box: string; Icon: typeof Info }> = {
  info: { box: "bg-accent-soft text-accent-soft-foreground", Icon: Info },
  success: { box: "bg-success-soft text-success-soft-foreground", Icon: CircleCheck },
  warning: { box: "bg-warning-soft text-warning-soft-foreground", Icon: TriangleAlert },
  error: { box: "bg-destructive-soft text-destructive-soft-foreground", Icon: CircleAlert },
};

export function Notice({ tone = "info", title, children }: { tone?: Tone; title?: ReactNode; children?: ReactNode }) {
  const { box, Icon } = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-xl p-3 text-sm ${box}`}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}
