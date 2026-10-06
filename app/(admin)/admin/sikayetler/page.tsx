import type { Metadata } from "next";
import Link from "next/link";
import { StatusButtons } from "@/components/admin/status-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, PageTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { resolveReport } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { PROFILE_STATUS_LABELS, REPORT_REASON_LABELS } from "@/lib/labels";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Şikayetler" };

type ReportRow = {
  id: number;
  reason: Enums<"report_reason">;
  note: string | null;
  status: Enums<"report_status">;
  created_at: string;
  listing_id: string | null;
  reported_user_id: string;
  listing: { restaurant: string } | null;
  reporter: { id: string; full_name: string } | null;
  reported: { id: string; full_name: string; status: Enums<"profile_status"> } | null;
};

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/sikayetler">) {
  await requireAdmin();
  const { durum } = await searchParams;
  const showResolved = durum === "cozulen";

  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(
      "id, reason, note, status, created_at, listing_id, reported_user_id, listing:listings(restaurant), reporter:profiles!reports_reporter_id_fkey(id, full_name), reported:profiles!reports_reported_user_id_fkey(id, full_name, status)",
    )
    .eq("status", showResolved ? "resolved" : "open")
    .order("created_at", { ascending: false })
    .limit(200);
  const reports = (data ?? []) as unknown as ReportRow[];

  return (
    <>
      <PageTitle
        title="Şikayetler"
        description="Aynı kişiye 3 farklı kullanıcıdan 'yanlış numara' / 'numara onun değil' şikayeti gelince hesap otomatik askıya alınır."
      />
      <nav aria-label="Şikayet durumu" className="flex gap-2">
        {[
          { key: "", label: "Açık" },
          { key: "cozulen", label: "Çözülen" },
        ].map((t) => {
          const active = (t.key === "cozulen") === showResolved;
          return (
            <Link
              key={t.key}
              href={t.key ? `/admin/sikayetler?durum=${t.key}` : "/admin/sikayetler"}
              aria-current={active ? "true" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-input/40 bg-surface hover:bg-muted"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {reports.length === 0 ? (
        <p className="text-muted-foreground">{showResolved ? "Çözülmüş şikayet yok." : "Açık şikayet yok."}</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {reports.map((r) => (
            <li key={r.id}>
              <Card className="flex h-full flex-col gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="danger">{REPORT_REASON_LABELS[r.reason]}</Badge>
                  <span className="text-muted-foreground">{formatDateTime(r.created_at)}</span>
                </div>
                <p>
                  {r.reporter ? (
                    <Link href={`/admin/kullanicilar/${r.reporter.id}`} className="font-semibold text-accent underline-offset-2 hover:underline">
                      {r.reporter.full_name}
                    </Link>
                  ) : (
                    "—"
                  )}{" "}
                  →{" "}
                  {r.reported ? (
                    <>
                      <Link href={`/admin/kullanicilar/${r.reported.id}`} className="font-semibold text-accent underline-offset-2 hover:underline">
                        {r.reported.full_name}
                      </Link>{" "}
                      <span className="text-muted-foreground">({PROFILE_STATUS_LABELS[r.reported.status]})</span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                {r.listing && r.listing_id ? (
                  <p>
                    İlan:{" "}
                    <Link href={`/ilan/${r.listing_id}`} className="font-semibold text-accent underline-offset-2 hover:underline">
                      {r.listing.restaurant}
                    </Link>
                  </p>
                ) : null}
                {r.note ? <p className="rounded-lg bg-muted p-2 break-words">{r.note}</p> : null}
                {!showResolved ? (
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <form action={resolveReport}>
                      <input type="hidden" name="report_id" value={r.id} />
                      <SubmitButton size="sm" variant="secondary">
                        Çözüldü
                      </SubmitButton>
                    </form>
                    {r.reported ? <StatusButtons userId={r.reported_user_id} current={r.reported.status} /> : null}
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
