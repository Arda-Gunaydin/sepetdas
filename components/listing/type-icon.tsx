import { Bike, ShoppingBasket, Users } from "lucide-react";
import type { Enums } from "@/lib/supabase/database.types";

const icons = { min_basket: ShoppingBasket, shared_menu: Users, delivery_fee: Bike } as const;

export function ListingTypeIcon({ type, className = "size-5" }: { type: Enums<"listing_type">; className?: string }) {
  const Icon = icons[type];
  return <Icon className={className} aria-hidden />;
}
