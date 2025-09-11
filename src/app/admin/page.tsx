'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Settings, 
  FileText, 
  Package,
  Megaphone,
  DollarSign,
  Truck,
  MessageSquare,
  Star,
  Shield
} from 'lucide-react';
import Link from 'next/link';

function AdminHomePage() {
  const router = useRouter();

  // Auto-redirect to dashboard after a short delay (optional)
  // Uncomment the following lines if you want automatic redirect
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/admin/dashboard');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);
  */

  const adminSections = [
    {
      title: 'Dashboard',
      description: 'Overview of business metrics and analytics',
      icon: BarChart3,
      href: '/admin/dashboard',
      color: 'bg-blue-500',
    },
    {
      title: 'Orders',
      description: 'Manage customer orders and tracking',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'bg-green-500',
    },
    {
      title: 'Customers',
      description: 'View and manage customer accounts',
      icon: Users,
      href: '/admin/customers',
      color: 'bg-purple-500',
    },
    {
      title: 'Delivery',
      description: 'Track deliveries and logistics',
      icon: Truck,
      href: '/admin/delivery',
      color: 'bg-orange-500',
    },
    {
      title: 'Staff',
      description: 'Manage staff members and permissions',
      icon: Shield,
      href: '/admin/staff',
      color: 'bg-indigo-500',
    },
    {
      title: 'Ads & Marketing',
      description: 'Manage advertising campaigns',
      icon: Megaphone,
      href: '/admin/ads',
      color: 'bg-pink-500',
    },
    {
      title: 'Content',
      description: 'Manage website content and pages',
      icon: FileText,
      href: '/admin/content',
      color: 'bg-teal-500',
    },
    {
      title: 'Pricing',
      description: 'Manage pricing and service rates',
      icon: DollarSign,
      href: '/admin/pricing',
      color: 'bg-yellow-500',
    },
    {
      title: 'Feedback',
      description: 'View customer feedback and reviews',
      icon: Star,
      href: '/admin/feedback',
      color: 'bg-red-500',
    },
    {
      title: 'Settings',
      description: 'System settings and configuration',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Master Photocopy Admin Panel
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Welcome to the admin dashboard. Manage your business operations from here.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/admin/dashboard">
              <BarChart3 className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/config">
              <Settings className="mr-2 h-5 w-5" />
              System Config
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">1,254</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">892</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹98,543</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
                <Truck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Deliveries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href={section.href}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${section.color} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 text-current`} />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto p-4">
              <Link href="/admin/orders" className="flex flex-col items-center space-y-2">
                <Package className="h-6 w-6" />
                <span>View All Orders</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/admin/customers" className="flex flex-col items-center space-y-2">
                <Users className="h-6 w-6" />
                <span>Manage Customers</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/admin/settings" className="flex flex-col items-center space-y-2">
                <Settings className="h-6 w-6" />
                <span>System Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProtectedRoute>
      <AdminHomePage />
    </AdminProtectedRoute>
  );
}
