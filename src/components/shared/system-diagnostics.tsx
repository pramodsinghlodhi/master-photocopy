'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Database, Wifi, Shield } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

interface SystemTest {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function SystemDiagnostics() {
  const [user] = useAuthState(auth!);
  const [tests, setTests] = useState<SystemTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const initialTests: SystemTest[] = [
    {
      name: 'Firebase Configuration',
      status: 'pending',
      message: 'Checking Firebase configuration...',
    },
    {
      name: 'Authentication System',
      status: 'pending',
      message: 'Testing authentication connection...',
    },
    {
      name: 'Firestore Database',
      status: 'pending',
      message: 'Testing Firestore connection...',
    },
    {
      name: 'User Authentication',
      status: 'pending',
      message: 'Checking user authentication status...',
    },
    {
      name: 'Admin Privileges',
      status: 'pending',
      message: 'Verifying admin access...',
    },
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    const testResults: SystemTest[] = [...initialTests];
    setTests(testResults);

    // Test 1: Firebase Configuration
    if (isFirebaseConfigured) {
      testResults[0] = {
        ...testResults[0],
        status: 'success',
        message: 'Firebase is properly configured',
        details: `Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
      };
    } else {
      testResults[0] = {
        ...testResults[0],
        status: 'error',
        message: 'Firebase configuration is missing or invalid',
        details: 'Check your .env.local file for missing variables',
      };
    }
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Authentication System
    try {
      if (auth) {
        testResults[1] = {
          ...testResults[1],
          status: 'success',
          message: 'Authentication system is working',
          details: 'Firebase Auth is initialized',
        };
      } else {
        testResults[1] = {
          ...testResults[1],
          status: 'error',
          message: 'Authentication system failed to initialize',
        };
      }
    } catch (error) {
      testResults[1] = {
        ...testResults[1],
        status: 'error',
        message: 'Authentication system error',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Firestore Database
    try {
      if (db) {
        // Try to read from a test collection
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        
        testResults[2] = {
          ...testResults[2],
          status: 'success',
          message: 'Firestore database is accessible',
          details: 'Successfully connected to Firestore',
        };
      } else {
        testResults[2] = {
          ...testResults[2],
          status: 'error',
          message: 'Firestore database not initialized',
        };
      }
    } catch (error) {
      testResults[2] = {
        ...testResults[2],
        status: 'warning',
        message: 'Firestore connection issue',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: User Authentication
    if (user) {
      testResults[3] = {
        ...testResults[3],
        status: 'success',
        message: 'User is authenticated',
        details: `Logged in as: ${user.email}`,
      };
    } else {
      testResults[3] = {
        ...testResults[3],
        status: 'warning',
        message: 'No user is currently authenticated',
        details: 'Login to test admin features',
      };
    }
    setTests([...testResults]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Admin Privileges (only if user is logged in)
    if (user && db) {
      try {
        const userDoc = await getDocs(collection(db, 'users'));
        const userData = userDoc.docs.find(doc => doc.id === user.uid);
        
        if (userData && userData.data().role === 'admin') {
          testResults[4] = {
            ...testResults[4],
            status: 'success',
            message: 'User has admin privileges',
            details: 'Admin access confirmed',
          };
        } else {
          testResults[4] = {
            ...testResults[4],
            status: 'warning',
            message: 'User does not have admin privileges',
            details: 'Contact administrator for admin access',
          };
        }
      } catch (error) {
        testResults[4] = {
          ...testResults[4],
          status: 'error',
          message: 'Unable to verify admin privileges',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    } else {
      testResults[4] = {
        ...testResults[4],
        status: 'warning',
        message: 'Cannot verify admin privileges',
        details: 'User must be authenticated to check admin status',
      };
    }
    setTests([...testResults]);
    setIsRunning(false);
  };

  const getStatusIcon = (status: SystemTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: SystemTest['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'pending':
        return <Badge variant="outline">Testing...</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Diagnostics</h2>
        <p className="text-gray-600">Testing system components and connections</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            System Health Check
          </CardTitle>
          <CardDescription>
            Comprehensive testing of all system components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.map((test, index) => (
            <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{test.name}</h4>
                    {getStatusBadge(test.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{test.message}</p>
                  {test.details && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {test.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? 'Running Tests...' : 'Run Diagnostics Again'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Environment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-6 w-6" />
            Environment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Firebase Project:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured'}
            </div>
            <div>
              <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
            </div>
            <div>
              <strong>Use Emulator:</strong> {process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR || 'false'}
            </div>
            <div>
              <strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'}
            </div>
            <div>
              <strong>Firebase Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not configured'}
            </div>
            <div>
              <strong>Storage Bucket:</strong> {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'Not configured'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <a href="/login">Login</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/dashboard">Admin Dashboard</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/config">Configuration</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/install">Installation</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
