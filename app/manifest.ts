import type { MetadataRoute } from "next";

// "Ana ekrana ekle" ile telefona kurulan uygulamanın adı, ikonu ve renkleri.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sepetdaş",
    short_name: "Sepetdaş",
    description: "Yurdunda birlikte yemek siparişi verecek arkadaş bul.",
    lang: "tr",
    start_url: "/pano",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff7ed",
    theme_color: "#c2410c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
