import Image from "next/image";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const lg = size === "lg";
  const px = lg ? 44 : 36;
  return (
    <span className="inline-flex items-center gap-2 font-extrabold tracking-tight text-foreground">
      <Image src="/logo.png" alt="" width={px} height={px} loading="eager" />
      <span className={lg ? "text-2xl" : "text-xl"}>Sepetdaş</span>
    </span>
  );
}
