// Kullanım: npm run db:make-admin -- ornek@example.com
// Kullanıcının önce giriş yapıp profilini tamamlamış olması gerekir.
import { connect } from "./db.mjs";

const email = process.argv[2];
if (!email) {
  console.error("Kullanım: npm run db:make-admin -- <email>");
  process.exit(1);
}

const client = connect();
await client.connect();
try {
  const res = await client.query(
    `update public.profiles p set is_admin = true
       from auth.users u
      where u.id = p.id and lower(u.email) = lower($1)
      returning p.full_name`,
    [email],
  );
  if (res.rowCount === 0) {
    console.error("Bu e-postayla profili tamamlanmış kullanıcı bulunamadı.");
    process.exit(1);
  }
  console.log(`${res.rows[0].full_name} artık yönetici.`);
} finally {
  await client.end();
}
