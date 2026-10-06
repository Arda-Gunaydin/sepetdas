import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google girişinden dönüş: kodu oturuma çevirir, panoya yollar (profil eksikse pano /kayit'a yönlendirir).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/pano`);
    }
  }

  return NextResponse.redirect(`${origin}/?hata=giris`);
}
