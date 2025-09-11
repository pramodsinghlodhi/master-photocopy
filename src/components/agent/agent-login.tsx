'use client';

import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, User, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AgentOTPLogin } from './agent-otp-login';

interface AgentLoginProps {
  onLoginSuccess: (user: any) => void;
}

export function AgentLogin({ onLoginSuccess }: AgentLoginProps) {
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialLogin = async () => {
    try {
      setLoading(true);

      if (!db) {
        toast({
          title: "Connection Error",
          description: "Firebase not available. Using test mode.",
          variant: "destructive"
        });
        return;
      }

      if (!agentId.trim() || !password.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter both Agent ID and Password.",
          variant: "destructive"
        });
        return;
      }

      // Query agents collection for matching credentials
      const agentsQuery = query(
        collection(db, 'agents'),
        where('credentials.agentId', '==', agentId.trim()),
        where('credentials.password', '==', password.trim())
      );

      const agentsSnapshot = await getDocs(agentsQuery);

      if (agentsSnapshot.empty) {
        toast({
          title: "Invalid Credentials",
          description: "Agent ID or Password is incorrect.",
          variant: "destructive"
        });
        return;
      }

      const agentDoc = agentsSnapshot.docs[0];
      const agentData = agentDoc.data();

      // Check if agent is active
      if (agentData.status !== 'active') {
        toast({
          title: "Account Inactive",
          description: `Your account is ${agentData.status}. Please contact support.`,
          variant: "destructive"
        });
        return;
      }

      // Create a mock user object for the agent
      const agentUser = {
        uid: agentDoc.id,
        agentId: agentData.credentials.agentId,
        displayName: `${agentData.first_name} ${agentData.last_name}`,
        phoneNumber: agentData.phone,
        email: agentData.email || null
      };

      toast({
        title: "Login Successful",
        description: `Welcome back, ${agentData.first_name}!`
      });

      onLoginSuccess(agentUser);
    } catch (error) {
      console.error('Error during credential login:', error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCredentialLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Agent Login</CardTitle>
          <p className="text-muted-foreground">
            Sign in to your delivery agent portal
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Credentials
              </TabsTrigger>
              <TabsTrigger value="otp" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                OTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentId">Agent ID</Label>
                  <Input
                    id="agentId"
                    type="text"
                    placeholder="Enter your Agent ID"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                </div>

                <Button
                  onClick={handleCredentialLogin}
                  disabled={loading || !agentId.trim() || !password.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have credentials? Contact your admin for Agent ID and Password.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="otp" className="mt-6">
              <AgentOTPLogin onLoginSuccess={onLoginSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
