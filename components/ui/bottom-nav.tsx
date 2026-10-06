"use client";

import { LayoutList, ListChecks, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/pano", label: "Pano", Icon: LayoutList },
  { href: "/ilan/yeni", label: "İlan aç", Icon: Plus },
  { href: "/ilanlarim", label: "İlanlarım", Icon: ListChecks },
  { href: "/profil", label: "Profil", Icon: UserRound },
];

function matches(href: string, path: string) {
  return path === href || (href !== "/ilan/yeni" && path.startsWith(`${href}/`));
}

export function BottomNav() {
  const pathname = usePathname();
  // Tıklanan sekme, sayfa yüklenirken de hemen seçili görünsün. Adres değişince normal hesaplamaya döner.
  const [clicked, setClicked] = useState<{ href: string; from: string } | null>(null);
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    // Adres değişti (geçiş bitti ya da geri tuşu): iyimser seçimi bırak.
    setPrevPath(pathname);
    setClicked(null);
  }
  const optimistic = clicked && clicked.from === pathname ? clicked.href : null;
  return (
    <nav
      aria-label="Ana menü"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map(({ href, label, Icon }) => {
          const active = optimistic ? optimistic === href : matches(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (!matches(href, pathname)) setClicked({ href, from: pathname });
                }}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors duration-150 ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {href === "/ilan/yeni" ? (
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="size-5" aria-hidden />
                  </span>
                ) : (
                  <Icon className="size-6" aria-hidden strokeWidth={active ? 2.5 : 2} />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
