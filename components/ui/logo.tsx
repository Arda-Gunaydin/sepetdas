import { ShoppingBasket } from "lucide-react";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className="inline-flex items-center gap-2 font-extrabold tracking-tight text-foreground">
      <span
        className={`flex items-center justify-center rounded-xl bg-primary text-primary-foreground ${lg ? "size-11" : "size-9"}`}
      >
        <ShoppingBasket className={lg ? "size-6" : "size-5"} aria-hidden />
      </span>
      <span className={lg ? "text-2xl" : "text-xl"}>Sepetdaş</span>
    </span>
  );
}
