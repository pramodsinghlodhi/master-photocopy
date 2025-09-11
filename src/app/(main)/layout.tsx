import Header from "@/components/shared/header";
import { MobileNav } from "@/components/shared/mobile-nav";
import Script from "next/script";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8 mb-16 md:mb-0">
          {children}
        </main>
        <MobileNav/>
      </div>
    </>
  )
}
