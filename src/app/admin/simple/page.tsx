'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, ShoppingCart, Settings, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SimpleAdminDashboard() {
  const { user, loading, isAuthenticated, isAdmin, login, logout } = useAuth();

  const handleTestLogin = async () => {
    await login('admin@masterphotocopy.com', 'admin123456');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Auth Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
                <CardDescription>Master Photocopy Administration</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isAuthenticated ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm">
                    {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <Shield className="h-5 w-5 text-blue-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    {isAdmin ? 'Admin' : 'No Admin Access'}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role || 'user'}
                    </Badge>
                  </div>
                  <Button onClick={logout} variant="outline" size="sm">
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Not logged in</p>
                    <p className="text-sm text-gray-600">Please authenticate to access admin features</p>
                  </div>
                  <Button onClick={handleTestLogin} size="sm">
                    Test Login
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Features - only show if admin */}
        {isAuthenticated && isAdmin ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <span className="text-2xl">₹</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹98,543.50</div>
                  <p className="text-xs text-muted-foreground">+12.5% this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,254</div>
                  <p className="text-xs text-muted-foreground">+8.2% this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">182</div>
                  <p className="text-xs text-muted-foreground">+21.3% this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
                  <span className="text-2xl">📢</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Currently running campaigns</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/orders" className="flex flex-col items-center gap-2">
                      <ShoppingCart className="h-6 w-6" />
                      <span>Orders</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/customers" className="flex flex-col items-center gap-2">
                      <Users className="h-6 w-6" />
                      <span>Customers</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/settings" className="flex flex-col items-center gap-2">
                      <Settings className="h-6 w-6" />
                      <span>Settings</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin" className="flex flex-col items-center gap-2">
                      <Shield className="h-6 w-6" />
                      <span>Admin Home</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  <h2 className="text-2xl font-bold text-green-800 mb-2">
                    🎉 Admin Dashboard Working!
                  </h2>
                  <p className="text-gray-600">
                    JWT authentication system is functioning correctly. 
                    You have successfully accessed the admin dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Authentication Required */
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
                <p className="text-gray-600 mb-4">
                  Please log in with admin credentials to access the dashboard.
                </p>
                <div className="space-y-2">
                  <Button asChild>
                    <Link href="/admin/login">
                      Go to Admin Login
                    </Link>
                  </Button>
                  <br />
                  <Button asChild variant="outline">
                    <Link href="/admin/setup">
                      Setup Admin User
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}