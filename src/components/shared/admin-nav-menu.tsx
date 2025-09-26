
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
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

// --- Role-Based Access Control (RBAC) ---
type Role = 'Admin' | 'Manager' | 'Support';

const navItemsByRole: Record<Role, string[]> = {
  Admin: ['/admin/dashboard', '/admin/orders', '/admin/delivery', '/admin/customers', '/admin/pricing', '/admin/coupons', '/admin/ads', '/admin/content', '/admin/invoicing', '/admin/tracking', '/admin/wallet', '/admin/feedback', '/admin/support', '/admin/settings'],
  Manager: ['/admin/dashboard', '/admin/orders', '/admin/delivery', '/admin/customers', '/admin/invoicing', '/admin/tracking'],
  Support: ['/admin/dashboard', '/admin/orders', '/admin/customers', '/admin/feedback', '/admin/support'],
};

const allNavItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard', badgeKey: null },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', badgeKey: 'orders.pending' },
    { href: '/admin/delivery', icon: Truck, label: 'Delivery', badgeKey: 'agents.pending' },
    { href: '/admin/customers', icon: Users, label: 'Customers', badgeKey: 'customers.newToday' },
    { href: '/admin/pricing', icon: Tag, label: 'Pricing', badgeKey: null },
    { href: '/admin/coupons', icon: Gift, label: 'Coupons', badgeKey: null },
    { href: '/admin/ads', icon: Megaphone, label: 'Ads', badgeKey: 'ads.active' },
    { href: '/admin/content', icon: FileEdit, label: 'Content', badgeKey: null },
    { href: '/admin/invoicing', icon: FileText, label: 'Invoicing', badgeKey: null },
    { href: '/admin/tracking', icon: BarChart2, label: 'Tracking', badgeKey: null },
    { href: '/admin/wallet', icon: Wallet, label: 'Wallet', badgeKey: null },
    { href: '/admin/feedback', icon: MessageSquare, label: 'Feedback', badgeKey: 'feedback.unread' },
    { href: '/admin/support', icon: LifeBuoy, label: 'Support', badgeKey: 'support.openTickets' },
    { href: '/admin/settings', icon: Settings, label: 'Settings', badgeKey: null },
];

// Helper function to get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): number => {
  return path.split('.').reduce((current, key) => current?.[key], obj) || 0;
};

export function AdminNavMenu() {
    const pathname = usePathname();
    const { stats, loading } = useDashboardStats();
    
    // In a real app, you would get the user's role from their session.
    // For now, we'll simulate a 'Manager' role to demonstrate functionality.
    const userRole: Role = 'Admin'; 
    const allowedRoutes = new Set(navItemsByRole[userRole]);
    const visibleNavItems = allNavItems.filter(item => allowedRoutes.has(item.href));

    return (
        <SidebarMenu>
            {visibleNavItems.map((item) => {
                const badgeCount = item.badgeKey && stats ? getNestedValue(stats, item.badgeKey) : 0;
                const showBadge = !loading && badgeCount > 0;

                return (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            tooltip={item.label}
                        >
                            <Link href={item.href} className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <item.icon />
                                    <span>{item.label}</span>
                                </div>
                                {showBadge && (
                                    <Badge 
                                        variant="secondary" 
                                        className="ml-auto text-xs min-w-5 h-5 flex items-center justify-center"
                                    >
                                        {badgeCount > 99 ? '99+' : badgeCount}
                                    </Badge>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}
