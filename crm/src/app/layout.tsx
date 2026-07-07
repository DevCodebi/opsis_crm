import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Home Ótica · Ópsis CRM",
  description: "Sistema de gestão e vendas para ótica, por Ópsis CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={plusJakarta.variable}>
      <body className="min-h-screen bg-[#1A1D25] text-[#EAEAEA] font-sans antialiased">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
