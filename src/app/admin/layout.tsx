

'use client';

import Link from 'next/link';
import { Printer } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/shared/user-nav';
import { Button } from '@/components/ui/button';
import { AdminNavMenu } from '@/components/shared/admin-nav-menu';
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtectedRoute fallbackMessage="Access to the admin panel requires administrator privileges. Please login with an admin account to continue.">
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link href="/">
                <Printer className="h-5 w-5 text-primary" />
                <span className="sr-only">Masterphoto</span>
              </Link>
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <AdminNavMenu />
          </SidebarContent>
          <SidebarFooter>
              <UserNav/>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
           <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <SidebarTrigger className="sm:hidden" />
              <div className="relative ml-auto flex-1 md:grow-0">
                  {/* Search can go here */}
              </div>
              <div className="hidden sm:block">
                  <UserNav />
              </div>
          </header>
          <main className="p-4 sm:px-6 sm:py-0">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AdminProtectedRoute>
  );
}
