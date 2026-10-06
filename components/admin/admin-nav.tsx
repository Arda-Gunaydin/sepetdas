"use client";

import { Building2, Flag, Inbox, LayoutDashboard, ListOrdered, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Counts = { reports: number; requests: number };

export function AdminNav({ counts }: { counts: Counts }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Genel bakış", Icon: LayoutDashboard, badge: 0 },
    { href: "/admin/kullanicilar", label: "Kullanıcılar", Icon: Users, badge: 0 },
    { href: "/admin/ilanlar", label: "İlanlar", Icon: ListOrdered, badge: 0 },
    { href: "/admin/yurtlar", label: "Yurtlar", Icon: Building2, badge: 0 },
    { href: "/admin/sikayetler", label: "Şikayetler", Icon: Flag, badge: counts.reports },
    { href: "/admin/talepler", label: "Talepler", Icon: Inbox, badge: counts.requests },
  ];

  return (
    <nav aria-label="Yönetici menüsü" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-2 py-3 lg:sticky lg:top-20 lg:flex-col lg:gap-1 lg:py-5">
        {items.map(({ href, label, Icon, badge }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface text-foreground hover:bg-muted lg:border-transparent lg:bg-transparent"
                }`}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="flex-1">{label}</span>
                {badge > 0 ? (
                  <span
                    className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${
                      active ? "bg-primary-foreground text-primary" : "bg-destructive text-white"
                    }`}
                    aria-label={`${badge} bekleyen`}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
