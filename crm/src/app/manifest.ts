import type { MetadataRoute } from "next";

// Convenção de arquivo do Next.js App Router: gera /manifest.webmanifest e já
// injeta o <link rel="manifest"> automaticamente, sem precisar mexer no
// layout.tsx. Cobre a seção 3.2 do guia de marca (ícones PWA/Android) e deixa
// o app instalável — pré-requisito de "boa prática" para quando a fase PWA
// (ver ESTRATEGIA-SAAS.md) avançar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Home Ótica · Ópsis CRM",
    short_name: "Home Ótica",
    description: "Sistema de gestão e vendas para ótica, por Ópsis CRM",
    start_url: "/",
    display: "standalone",
    background_color: "#1A1D25",
    theme_color: "#1A1D25",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
