"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useStore } from "@/lib/store";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, initialized } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !currentUser) {
      router.replace("/login");
    }
  }, [initialized, currentUser, router]);

  if (!initialized || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1D25]">
        <div className="text-[#9ca3af]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#1A1D25]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-auto animate-fade-in bg-[#1A1D25]">
          {children}
        </main>
        <footer className="px-6 py-3 border-t border-[rgba(93,112,139,0.2)] text-center">
          <span className="text-[11px] text-[#5d708b]">Home Ótica · Ópsis CRM</span>
        </footer>
      </div>
    </div>
  );
}
