// src/components/shared/mobile-nav.tsx
'use client';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, Gift, Wallet, Printer, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/order", icon: PlusCircle, label: "New Order" },
    { href: "/referrals", icon: Gift, label: "Referrals" },
    { href: "/profile", icon: User, label: "Profile" },
];

const sheetNavLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/order", label: "New Order" },
    { href: "/referrals", label: "Referrals" },
    { href: "/wallet", label: "Wallet" },
    { href: "/profile", label: "Profile" },
];

export function MobileNavContent({ isSheet = false } : {isSheet?: boolean}) {
    return (
        <div className={cn(isSheet ? 'pt-6' : '')}>
             <nav className={cn("grid gap-2 text-lg font-medium", isSheet ? "px-6" : "")}>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Printer className="h-6 w-6 text-primary" />
                  <span className="font-bold">Master PhotoCopy</span>
                </Link>
                {sheetNavLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
        </div>
    )
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t">
      <TooltipProvider>
        <div className="grid h-16 grid-cols-5 items-center">
            {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                    <Tooltip key={link.href}>
                        <TooltipTrigger asChild>
                            <Link 
                                href={link.href} 
                                className="flex flex-col items-center justify-center text-xs font-medium transition-colors duration-300 ease-in-out h-full w-full"
                                aria-label={link.label}
                            >
                                <link.icon className={cn("h-6 w-6 transition-transform duration-300 ease-in-out", isActive ? "text-primary scale-110 -translate-y-1" : "text-muted-foreground")} />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{link.label}</p>
                        </TooltipContent>
                    </Tooltip>
                )
            })}
        </div>
      </TooltipProvider>
    </nav>
  );
}
