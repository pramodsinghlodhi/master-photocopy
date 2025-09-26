import Link from 'next/link'
import {
  Printer,
  LayoutDashboard,
  PlusCircle,
  Gift,
  Wallet,
  Menu,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserNav } from './user-nav'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../ui/sheet'
import { MobileNavContent } from './mobile-nav'
import { ThemeToggle } from './theme-toggle'
import { Notifications } from './notifications'

export default function Header() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Printer className="h-6 w-6 text-primary" />
          <span className="font-bold">Master PhotoCopy</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/order"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Order</span>
        </Link>
        <Link
          href="/referrals"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Gift className="h-4 w-4" />
          <span>Referrals</span>
        </Link>
        <Link
          href="/wallet"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Wallet className="h-4 w-4" />
          <span>Wallet</span>
        </Link>
         <Link
          href="/profile"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
      </nav>
      
      <Sheet>
        <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5"/>
                <span className="sr-only">Toggle navigation menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <MobileNavContent isSheet={true}/>
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center justify-end md:w-auto md:ml-auto gap-2 lg:gap-4">
        <ThemeToggle />
        <Notifications />
        <UserNav />
      </div>
    </header>
  )
}
