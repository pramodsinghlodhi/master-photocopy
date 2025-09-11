
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  Users,
  Tag,
  Gift,
  Megaphone,
  FileEdit,
  FileText,
  Truck,
  Wallet,
  MessageSquare,
  LifeBuoy,
  UserCog,
  Settings,
  BarChart2,
} from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

// --- Role-Based Access Control (RBAC) ---
type Role = 'Admin' | 'Manager' | 'Support';

const navItemsByRole: Record<Role, string[]> = {
  Admin: ['/admin/dashboard', '/admin/orders', '/admin/delivery', '/admin/customers', '/admin/pricing', '/admin/coupons', '/admin/ads', '/admin/content', '/admin/invoicing', '/admin/tracking', '/admin/wallet', '/admin/feedback', '/admin/support', '/admin/settings'],
  Manager: ['/admin/dashboard', '/admin/orders', '/admin/delivery', '/admin/customers', '/admin/invoicing', '/admin/tracking'],
  Support: ['/admin/dashboard', '/admin/orders', '/admin/customers', '/admin/feedback', '/admin/support'],
};

const allNavItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { href: '/admin/delivery', icon: Truck, label: 'Delivery' },
    { href: '/admin/customers', icon: Users, label: 'Customers' },
    { href: '/admin/pricing', icon: Tag, label: 'Pricing' },
    { href: '/admin/coupons', icon: Gift, label: 'Coupons' },
    { href: '/admin/ads', icon: Megaphone, label: 'Ads' },
    { href: '/admin/content', icon: FileEdit, label: 'Content' },
    { href: '/admin/invoicing', icon: FileText, label: 'Invoicing' },
    { href: '/admin/tracking', icon: BarChart2, label: 'Tracking' },
    { href: '/admin/wallet', icon: Wallet, label: 'Wallet' },
    { href: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
    { href: '/admin/support', icon: LifeBuoy, label: 'Support' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminNavMenu() {
    const pathname = usePathname();
    
    // In a real app, you would get the user's role from their session.
    // For now, we'll simulate a 'Manager' role to demonstrate functionality.
    const userRole: Role = 'Admin'; 
    const allowedRoutes = new Set(navItemsByRole[userRole]);
    const visibleNavItems = allNavItems.filter(item => allowedRoutes.has(item.href));

    return (
        <SidebarMenu>
            {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.label}
                    >
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
