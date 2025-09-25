'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LoginHistory from '@/components/shared/login-history';

export default function AgentLoginHistoryPage() {
  const router = useRouter();
  const [agentData, setAgentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get agent data from session storage (from agent login)
    const storedAgentData = sessionStorage.getItem('agentData');
    if (storedAgentData) {
      const data = JSON.parse(storedAgentData);
      setAgentData(data);
    } else {
      // Redirect to login if no agent data found
      router.push('/agent');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!agentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">Please log in as an agent to view login history.</p>
              <Button onClick={() => router.push('/agent')}>
                Go to Agent Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Login History</h1>
            <p className="text-muted-foreground">
              Agent: {agentData.agentId} ({agentData.name})
            </p>
          </div>
        </div>
      </div>

      {/* Agent Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Agent Information</span>
          </CardTitle>
          <CardDescription>Current agent session details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Agent ID</p>
              <p className="text-lg font-semibold">{agentData.agentId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">{agentData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg font-semibold">{agentData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">{agentData.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login History Component */}
      <LoginHistory userId={agentData.id} userType="agent" />
    </div>
  );
}