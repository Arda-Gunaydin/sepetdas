import { SubmitButton } from "@/components/ui/submit-button";
import { setUserStatus } from "@/lib/actions/admin";

export function StatusButtons({ userId, current }: { userId: string; current: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["active", "suspended", "banned"] as const)
        .filter((s) => s !== current)
        .map((s) => (
          <form key={s} action={setUserStatus}>
            <input type="hidden" name="user_id" value={userId} />
            <input type="hidden" name="status" value={s} />
            <SubmitButton size="sm" variant={s === "active" ? "success" : s === "banned" ? "danger" : "secondary"}>
              {s === "active" ? "Hesabı aç" : s === "suspended" ? "Askıya al" : "Engelle"}
            </SubmitButton>
          </form>
        ))}
    </div>
  );
}
