import { Info } from "lucide-react";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-sm text-muted-foreground ${className}`}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>Site yalnızca eşleştirir; sipariş ve ödeme kullanıcılar arasındadır.</span>
    </p>
  );
}
