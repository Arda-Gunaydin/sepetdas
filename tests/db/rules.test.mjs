// Veritabanı kuralları ve RLS testleri.
// Çalıştırma: npm run test:db  (SUPABASE_DB_URL gerekir)
// Her test bir işlem (transaction) içinde koşar ve sonunda geri alınır; veritabanında iz bırakmaz.
// Kullanıcı taklidi: `set local role authenticated` + request.jwt.claims.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connect } from "../../scripts/db.mjs";

const client = connect();
before(() => client.connect());
after(() => client.end());

// Test numaraları +9059xxxxxxxx aralığında, her çalıştırmada rastgele bir tabandan artarak üretilir.
let phoneSeq = Math.floor(Math.random() * 90_000_000);
function nextPhone() {
  phoneSeq += 1;
  return `+9059${String(phoneSeq).padStart(8, "0")}`;
}

async function tx(fn) {
  await client.query("begin");
  try {
    await fn();
  } finally {
    await client.query("rollback");
  }
}

async function asSystem() {
  await client.query("reset role");
  await client.query("select set_config('request.jwt.claims', '', true)");
}

async function asUser(id) {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: id, role: "authenticated" }),
  ]);
}

async function createDorm(name) {
  await asSystem();
  const r = await client.query(
    "insert into public.dorms (city, name) values ('TEST', $1) returning id",
    [`TEST ${name} ${randomUUID().slice(0, 8)}`],
  );
  return r.rows[0].id;
}

async function createUser(dormId, { status = "active", phone = nextPhone() } = {}) {
  await asSystem();
  const id = randomUUID();
  await client.query(
    "insert into auth.users (id, email, aud, role) values ($1, $2, 'authenticated', 'authenticated')",
    [id, `${id}@test.local`],
  );
  await client.query(
    "insert into public.profiles (id, full_name, dorm_id, status) values ($1, 'Test Kullanıcı', $2, $3)",
    [id, dormId, status],
  );
  await client.query("insert into public.profile_private (user_id, phone) values ($1, $2)", [id, phone]);
  return { id, phone };
}

async function createListing(owner, dormId) {
  await asUser(owner.id);
  const r = await client.query(
    `insert into public.listings (owner_id, dorm_id, type, platform, restaurant, missing_amount)
     values ($1, $2, 'min_basket', 'yemeksepeti', 'Test Restoran', 50)
     returning id`,
    [owner.id, dormId],
  );
  return r.rows[0].id;
}

async function reveal(viewer, listingId) {
  await asUser(viewer.id);
  const r = await client.query("select public.reveal_phone($1) as phone", [listingId]);
  return r.rows[0].phone;
}

async function rejects(promise, pattern) {
  await assert.rejects(promise, (err) => {
    assert.match(String(err.message) + " " + String(err.code), pattern);
    return true;
  });
}

// Bir hata işlemi bozduğu için hatalı sorgular savepoint içinde koşar.
async function sp(fn) {
  await client.query("savepoint s");
  try {
    return await fn();
  } finally {
    await client.query("rollback to savepoint s");
  }
}

// ---------------------------------------------------------------------------
// CLAUDE.md §12'deki zorunlu senaryolar
// ---------------------------------------------------------------------------

test("başka yurttan kullanıcı ilanı göremiyor", () =>
  tx(async () => {
    const dormA = await createDorm("A");
    const dormB = await createDorm("B");
    const owner = await createUser(dormA);
    const sameDorm = await createUser(dormA);
    const otherDorm = await createUser(dormB);
    const listingId = await createListing(owner, dormA);

    await asUser(sameDorm.id);
    assert.equal((await client.query("select id from public.listings where id = $1", [listingId])).rowCount, 1);

    await asUser(otherDorm.id);
    assert.equal((await client.query("select id from public.listings where id = $1", [listingId])).rowCount, 0);
    // Diğer yurdun kullanıcı profilleri de görünmüyor.
    assert.equal((await client.query("select id from public.profiles where id = $1", [owner.id])).rowCount, 0);
  }));

test("başka yurttan kullanıcı numarayı açamıyor", () =>
  tx(async () => {
    const dormA = await createDorm("A");
    const dormB = await createDorm("B");
    const owner = await createUser(dormA);
    const otherDorm = await createUser(dormB);
    const listingId = await createListing(owner, dormA);

    await rejects(sp(() => reveal(otherDorm, listingId)), /listing_not_found/);
  }));

test("askıdaki kullanıcı numara açamıyor ve ilanları göremiyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const suspended = await createUser(dorm, { status: "suspended" });
    const banned = await createUser(dorm, { status: "banned" });
    const listingId = await createListing(owner, dorm);

    await rejects(sp(() => reveal(suspended, listingId)), /account_not_active/);
    await rejects(sp(() => reveal(banned, listingId)), /account_not_active/);

    await asUser(suspended.id);
    assert.equal((await client.query("select id from public.listings where id = $1", [listingId])).rowCount, 0);
  }));

test("günlük 20 farklı ilan sınırı çalışıyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const viewer = await createUser(dorm);
    const listings = [];
    for (let i = 0; i < 11; i++) {
      const owner = await createUser(dorm);
      listings.push(await createListing(owner, dorm));
      listings.push(await createListing(owner, dorm));
    }

    for (const id of listings.slice(0, 20)) {
      assert.match(await reveal(viewer, id), /^\+905\d{9}$/);
    }
    await rejects(sp(() => reveal(viewer, listings[20])), /daily_reveal_limit/);
    // Daha önce açılmış ilan tekrar açılabilir (sayıyı artırmaz).
    assert.match(await reveal(viewer, listings[0]), /^\+905\d{9}$/);
  }));

// ---------------------------------------------------------------------------
// Diğer iş kuralları
// ---------------------------------------------------------------------------

test("numara doğru döner ve kayıt atılır; ilan sahibi kendi ilanında açamaz", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const viewer = await createUser(dorm);
    const listingId = await createListing(owner, dorm);

    assert.equal(await reveal(viewer, listingId), owner.phone);
    await rejects(sp(() => reveal(owner, listingId)), /own_listing/);

    await asSystem();
    const log = await client.query("select count(*)::int n from public.phone_reveals where listing_id = $1", [listingId]);
    assert.equal(log.rows[0].n, 1);
  }));

test("telefon numarası başka kullanıcılara hiçbir tablodan sızmıyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const viewer = await createUser(dorm);
    await createListing(owner, dorm);

    await asUser(viewer.id);
    const priv = await client.query("select * from public.profile_private");
    assert.deepEqual(priv.rows.map((r) => r.user_id), [viewer.id]);
    assert.equal((await client.query("select * from public.phone_reveals")).rowCount, 0);
  }));

test("kapanmış veya süresi dolmuş ilanda numara açılamıyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const viewer = await createUser(dorm);
    const closedId = await createListing(owner, dorm);
    const expiredId = await createListing(owner, dorm);

    await asUser(owner.id);
    await client.query("select public.close_listing($1, 'closed')", [closedId]);
    await asSystem();
    await client.query("update public.listings set expires_at = now() - interval '1 minute' where id = $1", [expiredId]);

    await rejects(sp(() => reveal(viewer, closedId)), /listing_not_active/);
    await rejects(sp(() => reveal(viewer, expiredId)), /listing_not_active/);
  }));

test("giriş yapmamış (anon) reveal_phone çağıramıyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const listingId = await createListing(owner, dorm);
    await client.query("set local role anon");
    await rejects(sp(() => client.query("select public.reveal_phone($1)", [listingId])), /permission denied|42501/);
  }));

test("en fazla 2 aktif ilan; başka yurda ilan açılamıyor; askıdaki ilan açamıyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const otherDorm = await createDorm("B");
    const owner = await createUser(dorm);
    await createListing(owner, dorm);
    await createListing(owner, dorm);
    await rejects(sp(() => createListing(owner, dorm)), /active_listing_limit/);

    const other = await createUser(dorm);
    await rejects(sp(() => createListing(other, otherDorm)), /wrong_dorm/);

    const suspended = await createUser(dorm, { status: "suspended" });
    await rejects(sp(() => createListing(suspended, dorm)), /account_not_active/);
  }));

async function setExpiry(listingId, sqlInterval) {
  await asSystem();
  await client.query(`update public.listings set expires_at = now() + interval '${sqlInterval}' where id = $1`, [listingId]);
}

test("ilan 15 dakika yaşar; istemci süreyi değiştiremez", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const listingId = await createListing(owner, dorm);
    await asUser(owner.id);
    const r = await client.query(
      "select extract(epoch from expires_at - created_at)::int as diff from public.listings where id = $1",
      [listingId],
    );
    assert.equal(r.rows[0].diff, 15 * 60);
    await rejects(
      sp(() => client.query("update public.listings set expires_at = now() + interval '5 hours' where id = $1", [listingId])),
      /permission denied|42501/,
    );
  }));

test("+15 dk sadece son 2 dakikada, sadece ilan sahibi uzatabilir", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const other = await createUser(dorm);
    const listingId = await createListing(owner, dorm);

    await asUser(owner.id);
    await rejects(sp(() => client.query("select public.extend_listing($1)", [listingId])), /extend_too_early/);

    await setExpiry(listingId, "90 seconds");
    await asUser(other.id);
    await rejects(sp(() => client.query("select public.extend_listing($1)", [listingId])), /listing_not_found/);

    await asUser(owner.id);
    await client.query("select public.extend_listing($1)", [listingId]);
    const r = await client.query("select extract(epoch from expires_at - now())::int as left from public.listings where id = $1", [listingId]);
    assert.ok(r.rows[0].left > 16 * 60 && r.rows[0].left <= 17 * 60, `kalan: ${r.rows[0].left}`);
    // Uzatmadan hemen sonra tekrar basılamaz.
    await rejects(sp(() => client.query("select public.extend_listing($1)", [listingId])), /extend_too_early/);

    await setExpiry(listingId, "-1 minute");
    await asUser(owner.id);
    await rejects(sp(() => client.query("select public.extend_listing($1)", [listingId])), /listing_not_found|listing_not_active/);
  }));

test("süresi dolan / kapanan ilanı sahibi dahil kimse göremiyor; yönetici hepsini görüyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const viewer = await createUser(dorm);
    const admin = await createUser(dorm);
    await asSystem();
    await client.query("update public.profiles set is_admin = true where id = $1", [admin.id]);

    const expiredId = await createListing(owner, dorm);
    const matchedId = await createListing(owner, dorm);
    await setExpiry(expiredId, "-1 second");
    await asUser(owner.id);
    await client.query("select public.close_listing($1, 'matched')", [matchedId]);

    for (const user of [owner, viewer]) {
      await asUser(user.id);
      const r = await client.query("select id from public.listings where id = any($1)", [[expiredId, matchedId]]);
      assert.equal(r.rowCount, 0);
    }

    await asUser(admin.id);
    const r = await client.query("select id from public.listings where id = any($1)", [[expiredId, matchedId]]);
    assert.equal(r.rowCount, 2);
    // Yönetici numara açma kayıtlarını okuyabilir, kullanıcı okuyamaz.
    await client.query("select count(*) from public.phone_reveals");
    await asUser(viewer.id);
    assert.equal((await client.query("select * from public.phone_reveals")).rowCount, 0);
  }));

test("ilan sahibi ilanı gizleyemez, kapanan ilanı yeniden açamaz; başkası düzenleyemez", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const other = await createUser(dorm);
    const listingId = await createListing(owner, dorm);

    await asUser(owner.id);
    await rejects(sp(() => client.query("select public.close_listing($1, 'hidden')", [listingId])), /invalid_status/);
    await rejects(sp(() => client.query("update public.listings set status = 'hidden' where id = $1", [listingId])), /permission denied|42501/);
    await client.query("select public.close_listing($1, 'matched')", [listingId]);
    await rejects(sp(() => client.query("select public.close_listing($1, 'closed')", [listingId])), /listing_not_active/);

    const second = await createListing(owner, dorm);
    await asUser(other.id);
    const upd = await client.query("update public.listings set restaurant = 'Hack' where id = $1", [second]);
    assert.equal(upd.rowCount, 0);
  }));

test("3 farklı kişiden yanlış numara şikayeti → hesap askıya, ilanlar gizli", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const owner = await createUser(dorm);
    const listingId = await createListing(owner, dorm);
    const reporters = [await createUser(dorm), await createUser(dorm), await createUser(dorm)];

    async function report(user, reason) {
      await asUser(user.id);
      await client.query(
        "insert into public.reports (reporter_id, listing_id, reported_user_id, reason) values ($1, $2, $3, $4)",
        [user.id, listingId, user.id /* trigger ilan sahibiyle değiştirir */, reason],
      );
    }

    await report(reporters[0], "wrong_number");
    await report(reporters[1], "not_their_number");
    await asSystem();
    assert.equal((await client.query("select status from public.profiles where id = $1", [owner.id])).rows[0].status, "active");

    // Aynı kişi ikinci kez şikayet edemez.
    await rejects(sp(() => report(reporters[0], "spam")), /duplicate key|23505/);

    await report(reporters[2], "wrong_number");
    await asSystem();
    assert.equal((await client.query("select status from public.profiles where id = $1", [owner.id])).rows[0].status, "suspended");
    assert.equal((await client.query("select status from public.listings where id = $1", [listingId])).rows[0].status, "hidden");

    // Kullanıcılar şikayetleri okuyamaz.
    await asUser(reporters[0].id);
    assert.equal((await client.query("select * from public.reports")).rowCount, 0);
  }));

test("numara benzersiz; 30 günde bir değiştirilebilir", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const existing = await createUser(dorm);

    await asSystem();
    const newId = randomUUID();
    await client.query(
      "insert into auth.users (id, email, aud, role) values ($1, $2, 'authenticated', 'authenticated')",
      [newId, `${newId}@test.local`],
    );
    await asUser(newId);
    await rejects(
      sp(() => client.query("select public.complete_profile('Yeni Kişi', $1, null, $2, true)", [dorm, existing.phone])),
      /profile_private_phone_key|23505/,
    );
    await rejects(
      sp(() => client.query("select public.complete_profile('Yeni Kişi', $1, null, $2, false)", [dorm, nextPhone()])),
      /consent_required/,
    );
    await client.query("select public.complete_profile('Yeni Kişi', $1, '', $2, true)", [dorm, nextPhone()]);

    await client.query("update public.profile_private set phone = $1 where user_id = $2", [nextPhone(), newId]);
    await rejects(
      sp(() => client.query("update public.profile_private set phone = $1 where user_id = $2", [nextPhone(), newId])),
      /phone_change_too_soon/,
    );
    await rejects(
      sp(() => client.query("update public.profile_private set phone_verified = true where user_id = $1", [newId])),
      /permission denied|42501/,
    );
  }));

test("yurt değişince açık ilanlar kapanıyor", () =>
  tx(async () => {
    const dormA = await createDorm("A");
    const dormB = await createDorm("B");
    const owner = await createUser(dormA);
    const listingId = await createListing(owner, dormA);

    await asUser(owner.id);
    await client.query("update public.profiles set dorm_id = $1 where id = $2", [dormB, owner.id]);
    await asSystem();
    const r = await client.query("select status from public.listings where id = $1", [listingId]);
    assert.equal(r.rows[0].status, "closed");
  }));

test("kullanıcı kendi status / is_admin alanını değiştiremiyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const user = await createUser(dorm, { status: "suspended" });
    await asUser(user.id);
    await rejects(sp(() => client.query("update public.profiles set is_admin = true where id = $1", [user.id])), /permission denied|42501/);
    await rejects(sp(() => client.query("update public.profiles set status = 'active' where id = $1", [user.id])), /permission denied|42501/);
    await rejects(sp(() => client.query("select public.admin_set_user_status($1, 'active')", [user.id])), /not_admin/);
  }));

test("yönetici askıdaki hesabı yeniden açabiliyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const admin = await createUser(dorm);
    await asSystem();
    await client.query("update public.profiles set is_admin = true where id = $1", [admin.id]);
    const user = await createUser(dorm, { status: "suspended" });

    await asUser(admin.id);
    await client.query("select public.admin_set_user_status($1, 'active')", [user.id]);
    await asSystem();
    assert.equal((await client.query("select status from public.profiles where id = $1", [user.id])).rows[0].status, "active");
  }));

test("yurt talebi onaylanınca yurt ekleniyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const admin = await createUser(dorm);
    const user = await createUser(dorm);
    await asSystem();
    await client.query("update public.profiles set is_admin = true where id = $1", [admin.id]);

    await asUser(user.id);
    const name = `TEST Talep ${randomUUID().slice(0, 8)}`;
    const req = await client.query(
      "insert into public.dorm_requests (user_id, city, dorm_name) values ($1, 'TEST', $2) returning id",
      [user.id, name],
    );
    await asUser(admin.id);
    await client.query("select public.admin_review_dorm_request($1, true)", [req.rows[0].id]);
    await asUser(user.id);
    assert.equal((await client.query("select id from public.dorms where name = $1", [name])).rowCount, 1);
  }));

test("hesap silinince profil, telefon, ilanlar ve kayıtlar tamamen siliniyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const user = await createUser(dorm);
    const other = await createUser(dorm);
    const listingId = await createListing(user, dorm);
    const otherListing = await createListing(other, dorm);
    await reveal(user, otherListing);
    await reveal(other, listingId);

    await asUser(user.id);
    await client.query("select public.touch_last_seen()");
    await client.query("select public.delete_my_account()");

    await asSystem();
    for (const [sql, args] of [
      ["select 1 from auth.users where id = $1", [user.id]],
      ["select 1 from public.profiles where id = $1", [user.id]],
      ["select 1 from public.profile_private where user_id = $1", [user.id]],
      ["select 1 from public.listings where owner_id = $1", [user.id]],
      ["select 1 from public.phone_reveals where viewer_id = $1 or listing_id = $2", [user.id, listingId]],
      ["select 1 from public.user_activity where user_id = $1", [user.id]],
    ]) {
      assert.equal((await client.query(sql, args)).rowCount, 0, sql);
    }
  }));

test("yurt istatistiklerini sadece yönetici görebiliyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const admin = await createUser(dorm);
    const user = await createUser(dorm);
    await createListing(user, dorm);
    await asSystem();
    await client.query("update public.profiles set is_admin = true where id = $1", [admin.id]);

    await asUser(user.id);
    await rejects(sp(() => client.query("select * from public.admin_dorm_stats(10)")), /not_admin/);

    await asUser(admin.id);
    const r = await client.query("select * from public.admin_dorm_stats(100) where dorm_id = $1", [dorm]);
    assert.equal(Number(r.rows[0].user_count), 2);
    assert.equal(Number(r.rows[0].active_listing_count), 1);
  }));

test("kullanıcının e-postasını sadece yönetici görebiliyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const admin = await createUser(dorm);
    const user = await createUser(dorm);
    await asSystem();
    await client.query("update public.profiles set is_admin = true where id = $1", [admin.id]);

    await asUser(user.id);
    await rejects(sp(() => client.query("select public.admin_user_email($1)", [admin.id])), /not_admin/);
    await rejects(sp(() => client.query("select email from auth.users where id = $1", [admin.id])), /permission denied|42501/);

    await asUser(admin.id);
    const r = await client.query("select public.admin_user_email($1) as email", [user.id]);
    assert.equal(r.rows[0].email, `${user.id}@test.local`);
  }));

test("son görülme kaydediliyor; sadece yönetici okuyabiliyor, kimse doğrudan yazamıyor", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const admin = await createUser(dorm);
    const user = await createUser(dorm);
    await asSystem();
    await client.query("update public.profiles set is_admin = true where id = $1", [admin.id]);

    await asUser(user.id);
    await client.query("select public.touch_last_seen()");
    // Kullanıcı kendisininki dahil hiçbir son görülme kaydını okuyamaz, doğrudan yazamaz.
    assert.equal((await client.query("select 1 from public.user_activity")).rowCount, 0);
    await rejects(sp(() => client.query("insert into public.user_activity (user_id) values ($1)", [user.id])), /permission denied|42501/);
    await rejects(sp(() => client.query("update public.user_activity set last_seen_at = now()")), /permission denied|42501/);

    await asUser(admin.id);
    const r = await client.query("select last_seen_at from public.user_activity where user_id = $1", [user.id]);
    assert.equal(r.rowCount, 1);

    // Dakikada en fazla bir yazma: eski kayıt güncellenir, yeni kayıt güncellenmez.
    await asSystem();
    await client.query("update public.user_activity set last_seen_at = now() - interval '10 minutes' where user_id = $1", [user.id]);
    await asUser(user.id);
    await client.query("select public.touch_last_seen()");
    await asSystem();
    const fresh = await client.query("select last_seen_at > now() - interval '1 minute' as ok from public.user_activity where user_id = $1", [user.id]);
    assert.equal(fresh.rows[0].ok, true);
    await client.query("update public.user_activity set last_seen_at = now() - interval '10 seconds' where user_id = $1", [user.id]);
    await asUser(user.id);
    await client.query("select public.touch_last_seen()");
    await asSystem();
    const throttled = await client.query("select last_seen_at < now() - interval '5 seconds' as ok from public.user_activity where user_id = $1", [user.id]);
    assert.equal(throttled.rows[0].ok, true);

    await asUser(null);
    await rejects(sp(() => client.query("select public.touch_last_seen()")), /not_authenticated/);
  }));

test("yönetici yurt ekler / düzenler / pasifleştirir / siler; kullanıcı yapamaz", () =>
  tx(async () => {
    const dorm = await createDorm("A");
    const admin = await createUser(dorm);
    const user = await createUser(dorm);
    await asSystem();
    await client.query("update public.profiles set is_admin = true where id = $1", [admin.id]);
    const name = `TEST Yeni ${randomUUID().slice(0, 8)}`;

    await asUser(user.id);
    await rejects(sp(() => client.query("select public.admin_save_dorm(null, 'TEST', $1)", [name])), /not_admin/);
    await rejects(sp(() => client.query("insert into public.dorms (city, name) values ('TEST', $1)", [name])), /permission denied|42501/);

    await asUser(admin.id);
    const created = await client.query("select public.admin_save_dorm(null, 'TEST', $1) as id", [name]);
    const newId = created.rows[0].id;
    await rejects(sp(() => client.query("select public.admin_save_dorm(null, 'TEST', $1)", [name])), /dorm_exists/);
    await client.query("select public.admin_save_dorm($1, 'TEST', $2)", [newId, `${name} 2`]);

    // Kullanıcısı olan yurt silinemez, pasifleştirilir; o yurttaki kullanıcı yurdunu görmeye devam eder.
    await rejects(sp(() => client.query("select public.admin_delete_dorm($1)", [dorm])), /dorm_in_use/);
    await client.query("select public.admin_set_dorm_active($1, false)", [dorm]);
    await asUser(user.id);
    assert.equal((await client.query("select id from public.dorms where id = $1", [dorm])).rowCount, 1);
    // Pasif yurt başkalarının seçim listesinde görünmez.
    const outsider = await createUser(await createDorm("B"));
    await asUser(outsider.id);
    assert.equal((await client.query("select id from public.dorms where id = $1", [dorm])).rowCount, 0);

    await asUser(admin.id);
    await client.query("select public.admin_delete_dorm($1)", [newId]);
    assert.equal((await client.query("select id from public.dorms where id = $1", [newId])).rowCount, 0);
  }));
