import Link from "next/link";
import { Printer } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
        <div className="mb-8 flex items-center text-2xl font-bold text-primary">
            <Link href="/" className="flex items-center gap-2">
                <Printer className="h-8 w-8" />
                <span>Masterphoto Copy</span>
            </Link>
        </div>
      {children}
    </div>
  )
}
