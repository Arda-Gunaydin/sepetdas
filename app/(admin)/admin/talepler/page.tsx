import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, PageTitle } from "@/components/ui/card";
import { inputClasses } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { resolvePhoneClaim, reviewDormRequest } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/admin";
import { formatPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Talepler" };

export default async function AdminRequestsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [dormRequests, claims] = await Promise.all([
    supabase.from("dorm_requests").select("id, user_id, city, dorm_name, created_at").eq("status", "pending").order("created_at").limit(200),
    supabase.from("phone_claims").select("id, user_id, phone, note, created_at").eq("status", "open").order("created_at").limit(200),
  ]);

  // Talep sahiplerinin adları (profil tamamlanmamış olabilir; talepler auth.users'a bağlı).
  const requesterIds = [...new Set([...(dormRequests.data ?? []), ...(claims.data ?? [])].map((r) => r.user_id))];
  const { data: requesters } = requesterIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", requesterIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameOf = (userId: string) => requesters?.find((p) => p.id === userId)?.full_name ?? "Profil tamamlanmamış";

  return (
    <>
      <PageTitle title="Talepler" />

      <section aria-labelledby="yurt-talepleri" className="flex flex-col gap-3">
        <h2 id="yurt-talepleri" className="flex items-center gap-2 text-lg font-bold">
          Yurt ekleme talepleri <Badge tone={dormRequests.data?.length ? "primary" : "neutral"}>{dormRequests.data?.length ?? 0}</Badge>
        </h2>
        <p className="text-sm text-muted-foreground">
          Onaylamadan önce yurdun resmi adını GSB / KYGM kaynaklarından doğrula; gerekirse adı düzelt. Onaylanan yurt hemen listede görünür.
        </p>
        {dormRequests.data?.length ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {dormRequests.data.map((r) => (
              <li key={r.id}>
                <Card className="text-sm">
                  <form action={reviewDormRequest} className="flex flex-col gap-2">
                    <input type="hidden" name="request_id" value={r.id} />
                    <p className="text-muted-foreground">
                      {nameOf(r.user_id)} · {formatDateTime(r.created_at)}
                    </p>
                    <label className="flex flex-col gap-1">
                      <span className="font-semibold">İl</span>
                      <input name="city" defaultValue={r.city} className={inputClasses} maxLength={40} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-semibold">Yurt adı</span>
                      <input name="name" defaultValue={r.dorm_name} className={inputClasses} maxLength={150} />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <SubmitButton size="sm" variant="success" name="decision" value="approve">
                        Onayla
                      </SubmitButton>
                      <SubmitButton size="sm" variant="secondary" name="decision" value="reject">
                        Reddet
                      </SubmitButton>
                    </div>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Bekleyen talep yok.</p>
        )}
      </section>

      <section aria-labelledby="numara-talepleri" className="flex flex-col gap-3">
        <h2 id="numara-talepleri" className="flex items-center gap-2 text-lg font-bold">
          Numara sahipliği talepleri <Badge tone={claims.data?.length ? "primary" : "neutral"}>{claims.data?.length ?? 0}</Badge>
        </h2>
        {claims.data?.length ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {claims.data.map((c) => (
              <li key={c.id}>
                <Card className="flex flex-col gap-2 text-sm">
                  <p>
                    <strong>{nameOf(c.user_id)}</strong> şu numaranın kendisine ait olduğunu söylüyor:{" "}
                    <strong className="tabular-nums">{formatPhone(c.phone)}</strong>
                  </p>
                  <p className="text-muted-foreground">{formatDateTime(c.created_at)}</p>
                  {c.note ? <p className="rounded-lg bg-muted p-2 break-words">{c.note}</p> : null}
                  <form action={resolvePhoneClaim}>
                    <input type="hidden" name="claim_id" value={c.id} />
                    <SubmitButton size="sm" variant="secondary">
                      Çözüldü
                    </SubmitButton>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Bekleyen talep yok.</p>
        )}
      </section>
    </>
  );
}
