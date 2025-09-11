// src/app/legal/layout.tsx
'use client';

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm">
        <Button variant="ghost" size="icon" className="mr-4" onClick={() => router.back()}>
          <ArrowLeft/>
        </Button>
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Printer className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold">Masterphoto Copy</span>
        </Link>
      </header>
      <main className="flex-1 py-12 md:py-16">
        <div className="container prose lg:prose-xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
