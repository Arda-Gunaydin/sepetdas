// supabase/migrations altındaki yeni migration'ları SUPABASE_DB_URL veritabanına uygular.
import { spawnSync } from "node:child_process";

const url = process.env.SUPABASE_DB_URL;
if (!url || url.includes("<") || url.includes("[YOUR-PASSWORD]")) {
  console.error("SUPABASE_DB_URL eksik: .env.local dosyasında bağlantı dizesini yazın ve [YOUR-PASSWORD] yerine veritabanı şifresini koyun.");
  process.exit(1);
}
const extra = process.argv.slice(2);
const res = spawnSync("npx", ["supabase", "db", "push", "--db-url", url, ...extra], { stdio: "inherit" });
process.exit(res.status ?? 1);
