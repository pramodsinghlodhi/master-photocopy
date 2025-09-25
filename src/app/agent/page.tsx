'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Agent } from '@/lib/types';
import { AgentIDLogin } from '@/components/agent/agent-id-login';
import { AgentOnboarding } from '@/components/agent/agent-onboarding';
import { AgentDashboard } from '@/components/agent/agent-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function AgentPortalPage() {
  const [user, setUser] = useState<any>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminImpersonation, setAdminImpersonation] = useState<any>(null);

  useEffect(() => {
    // Check for admin impersonation first
    const adminImpersonationData = sessionStorage.getItem('adminImpersonation');
    if (adminImpersonationData) {
      const impData = JSON.parse(adminImpersonationData);
      setAdminImpersonation(impData);
      
      // Create a mock agent from the impersonation data
      const impersonatedAgent: Agent = {
        agentId: impData.agentId,
        userRef: impData.agentId,
        uid: impData.agentId,
        first_name: impData.agentName.split(' ')[0] || 'Agent',
        last_name: impData.agentName.split(' ').slice(1).join(' ') || '',
        phone: "+91-9999999999",
        email: "admin.impersonation@example.com",
        status: "active",
        vehicle: {
          type: "bike",
          number: "ADMIN-IMP-001"
        },
        onboarding: {
          completed: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setUser({ uid: impData.agentId });
      setAgent(impersonatedAgent);
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    // Check if agent is already logged in (stored in sessionStorage)
    const storedAgent = sessionStorage.getItem('agentSession');
    if (storedAgent) {
      try {
        const agentData = JSON.parse(storedAgent);
        setUser({ uid: agentData.agentId });
        setAgent(agentData);
        setLoading(false);
        setAuthChecked(true);
        return;
      } catch (error) {
        console.error('Error parsing stored agent session:', error);
        sessionStorage.removeItem('agentSession');
      }
    }

    setLoading(false);
    setAuthChecked(true);
  }, []);

  const handleLoginSuccess = (agentData: any) => {
    // Store agent session in sessionStorage
    sessionStorage.setItem('agentSession', JSON.stringify(agentData));
    // Also store agent data for login history access
    sessionStorage.setItem('agentData', JSON.stringify(agentData));
    setUser({ uid: agentData.agentId });
    setAgent(agentData);
  };

  const handleOnboardingComplete = (newAgent: Agent) => {
    setAgent(newAgent);
  };

  const handleLogout = async () => {
    try {
      // Clear admin impersonation if active
      if (adminImpersonation) {
        sessionStorage.removeItem('adminImpersonation');
        window.close(); // Close the impersonation tab
        return;
      }

      // Clear agent session
      sessionStorage.removeItem('agentSession');
      
      // Clear Firebase auth if exists (for backward compatibility)
      if (auth) {
        await signOut(auth);
      }
      
      setUser(null);
      setAgent(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        {/* Main login component */}
        <div className="p-4">
          <AgentIDLogin onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // Logged in but no agent profile
  if (!agent) {
    return <AgentOnboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  // Agent profile exists but pending approval
  if (agent.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle>Application Under Review</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Thank you for completing your application! Our team is currently reviewing your documents and profile.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Profile completed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Documents uploaded</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Verification in progress</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You will be notified once your application is approved. This usually takes 1-2 business days.
            </p>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Agent profile suspended
  if (agent.status === 'suspended') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Account Suspended</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your agent account has been suspended. Please contact support for more information.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLogout} className="flex-1">
                Logout
              </Button>
              <Button asChild className="flex-1">
                <a href="/support">Contact Support</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active agent - show dashboard
  return (
    <div>
      {adminImpersonation && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm">
                <strong>Admin Impersonation Active:</strong> You are logged in as {adminImpersonation.agentName} for administrative purposes.
                <button 
                  onClick={handleLogout}
                  className="underline ml-2 hover:text-blue-800"
                >
                  Exit Impersonation
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
      <AgentDashboard agent={agent} onLogout={handleLogout} />
    </div>
  );
}
