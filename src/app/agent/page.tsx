'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Agent } from '@/lib/types';
import { AgentOTPLogin } from '@/components/agent/agent-otp-login';
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
  const [testMode, setTestMode] = useState(false);
  const [adminImpersonation, setAdminImpersonation] = useState<any>(null);

  // Test/bypass mode - create a mock agent
  const mockAgent: Agent = {
    agentId: "test-agent-1",
    userRef: "test-agent-1",
    uid: "test-agent-1",
    first_name: "Test",
    last_name: "Agent",
    phone: "+91-9999999999",
    email: "test.agent@example.com",
    status: "active",
    vehicle: {
      type: "bike",
      number: "DL-12-TEST-1234"
    },
    onboarding: {
      idProofUrl: "https://example.com/test-id.jpg",
      addressProofUrl: "https://example.com/test-address.jpg",
      vehicleProofUrl: "https://example.com/test-vehicle.jpg",
      completed: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

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

    // Check for test mode in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.get('test') === 'true';
    
    if (isTestMode) {
      setTestMode(true);
      setUser({ uid: 'test-agent-1' });
      setAgent(mockAgent);
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    if (!auth) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && db) {
        // Check if agent profile exists
        const agentDoc = await getDoc(doc(db, 'agents', firebaseUser.uid));
        if (agentDoc.exists()) {
          const agentData = agentDoc.data() as Agent;
          setAgent({ ...agentData, agentId: firebaseUser.uid });
        }
      }
      
      setLoading(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (firebaseUser: any) => {
    setUser(firebaseUser);
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
        {/* Mobile-friendly test mode banner */}
        <div className="p-4">
          <Card className="max-w-sm mx-auto mb-6 border-2 border-dashed border-yellow-300 bg-yellow-50">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                🧪 <span>Test Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={() => window.location.href = '/agent?test=true'} 
                className="w-full mb-3 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-medium"
                size="lg"
              >
                🚀 Try Agent Dashboard
              </Button>
              <p className="text-xs text-yellow-700 text-center leading-relaxed">
                Skip login and test the delivery agent interface with sample orders
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main login component */}
        <div className="px-4">
          <AgentOTPLogin onLoginSuccess={handleLoginSuccess} />
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
      {testMode && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm">
                <strong>Test Mode Active:</strong> You are using a mock agent account for testing purposes.
                <a href="/agent" className="underline ml-2">Exit Test Mode</a>
              </p>
            </div>
          </div>
        </div>
      )}
      <AgentDashboard agent={agent} onLogout={handleLogout} />
    </div>
  );
}
