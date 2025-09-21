'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminSetupStatus {
  success: boolean;
  message: string;
  user?: any;
  credentials?: {
    email: string;
    password: string;
  };
}

export function AdminSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AdminSetupStatus | null>(null);
  const { toast } = useToast();

  const setupAdmin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setStatus(data);

      if (data.success) {
        toast({
          title: "Admin Setup Complete",
          description: "Admin user has been created successfully.",
        });
      } else {
        toast({
          title: "Setup Failed",
          description: data.error || "Failed to create admin user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Admin setup error:', error);
      toast({
        title: "Setup Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Credentials copied to clipboard",
    });
  };

  // Auto-setup on component mount
  useEffect(() => {
    setupAdmin();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl">Admin System Setup</CardTitle>
        <CardDescription>
          Initializing admin user and permissions for Master Photocopy
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Setting up admin user...</span>
          </div>
        )}

        {status && !isLoading && (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 p-4 rounded-lg border ${
              status.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              {status.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                status.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {status.message}
              </span>
              {status.success && (
                <Badge variant="secondary" className="ml-auto">
                  Ready
                </Badge>
              )}
            </div>

            {status.success && status.credentials && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                    🔐 Admin Login Credentials
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
                        <p className="font-mono text-sm">{status.credentials.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCredentials(status.credentials!.email)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Password:</span>
                        <p className="font-mono text-sm">{status.credentials.password}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCredentials(status.credentials!.password)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Important:</strong> Save these credentials securely. You can now access the admin dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href="/admin/login">
                      Go to Admin Login
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <a href="/admin/dashboard">
                      Admin Dashboard
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {status.user && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Admin User Details:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>ID:</strong> {status.user.id}</p>
                  <p><strong>Email:</strong> {status.user.email}</p>
                  <p><strong>Name:</strong> {status.user.name}</p>
                  <p><strong>Role:</strong> <Badge variant="destructive">{status.user.role}</Badge></p>
                </div>
              </div>
            )}

            {!status.success && (
              <Button onClick={setupAdmin} disabled={isLoading} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Retry Admin Setup
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}