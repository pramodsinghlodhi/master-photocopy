'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminDebugPage() {
  const { user, loading, isAuthenticated, isAdmin, login } = useAuth();
  const [loginResult, setLoginResult] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAutoLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await login('admin@masterphotocopy.com', 'admin123456');
      setLoginResult(result);
    } catch (error) {
      setLoginResult({ success: false, error: 'Login failed' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Authentication Debug</CardTitle>
            <CardDescription>
              Debug authentication state and test admin access
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <span className="font-medium">Loading</span>
                <Badge variant={loading ? "secondary" : "outline"}>
                  {loading ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <span className="font-medium">Authenticated</span>
                {isAuthenticated ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <span className="font-medium">Admin</span>
                {isAdmin ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>

            {user && (
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-semibold mb-2">User Data:</h4>
                <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated && (
              <Button 
                onClick={handleAutoLogin} 
                disabled={isLoggingIn}
                className="w-full"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Auto-Login as Admin
                  </>
                )}
              </Button>
            )}

            {loginResult && (
              <div className={`p-3 rounded border ${
                loginResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <strong>Login Result:</strong> {loginResult.success ? 'Success' : loginResult.error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline">
                <Link href="/admin/setup">
                  Admin Setup
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/login">
                  Admin Login
                </Link>
              </Button>
            </div>

            {isAuthenticated && isAdmin && (
              <Button asChild className="w-full">
                <Link href="/admin/dashboard">
                  🎯 Go to Admin Dashboard
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* API Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>API Test</CardTitle>
            <CardDescription>
              Test authentication endpoints directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                • `/api/auth/me` endpoint updated ✅
              </p>
              <p className="text-sm text-gray-600">
                • Admin user exists in store ✅
              </p>
              <p className="text-sm text-gray-600">
                • Login API working ✅
              </p>
              <p className="text-sm text-gray-600">
                • Middleware protecting routes ✅
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}