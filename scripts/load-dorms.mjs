// supabase/seed/dorms.csv → dorms tablosu. Var olan kayıtlara dokunmaz, yenileri ekler.
// --replace: CSV'de olmayan yurtları kaldırır (profil/ilan bağlı olanları silmez, pasifleştirir).
//   DİKKAT: yönetici onayıyla eklenmiş yurtlar CSV'de yoksa onlar da kaldırılır.
import { readFile } from "node:fs/promises";
import { connect } from "./db.mjs";

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells);
  }
  return rows;
}

const [header, ...rows] = parseCsv(await readFile(new URL("../supabase/seed/dorms.csv", import.meta.url), "utf8"));
if (header.join(",") !== "city,name") {
  console.error("dorms.csv başlığı 'city,name' olmalı.");
  process.exit(1);
}

const client = connect();
await client.connect();
try {
  const cities = rows.map((r) => r[0].trim());
  const names = rows.map((r) => r[1].trim());
  await client.query("begin");
  await client.query(
    `insert into public.dorms (city, name)
     select * from unnest($1::text[], $2::text[])
     on conflict (city, name) do update set is_active = true`,
    [cities, names],
  );
  if (process.argv.includes("--replace")) {
    const missing = `(city, name) not in (select * from unnest($1::text[], $2::text[]))`;
    const referenced = `(id in (select dorm_id from public.profiles) or id in (select dorm_id from public.listings))`;
    const del = await client.query(`delete from public.dorms where ${missing} and not ${referenced}`, [cities, names]);
    const off = await client.query(
      `update public.dorms set is_active = false where ${missing} and ${referenced} and is_active returning city, name`,
      [cities, names],
    );
    console.log(`Listede olmayan ${del.rowCount} yurt silindi, ${off.rowCount} yurt pasifleştirildi (profil/ilan bağlı).`);
    for (const r of off.rows) console.log(`  pasif: ${r.city} — ${r.name}`);
  }
  await client.query("commit");
  const total = await client.query("select count(*)::int as n, count(*) filter (where is_active)::int as active from public.dorms");
  console.log(`${rows.length} satır işlendi. Toplam: ${total.rows[0].n} (aktif: ${total.rows[0].active})`);
} finally {
  await client.end();
}
