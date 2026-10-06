// Geliştirme scriptleri için ortak Postgres bağlantısı (SUPABASE_DB_URL, .env.local).
import pg from "pg";

export function connect() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url || url.includes("<") || url.includes("[YOUR-PASSWORD]")) {
    console.error("SUPABASE_DB_URL eksik: .env.local dosyasında bağlantı dizesini yazın ve [YOUR-PASSWORD] yerine veritabanı şifresini koyun.");
    process.exit(1);
  }
  return new pg.Client({ connectionString: url, ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : { rejectUnauthorized: false } });
}
