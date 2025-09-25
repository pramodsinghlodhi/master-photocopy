'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AgentIDLoginProps {
  onLoginSuccess: (agentData: any) => void;
}

export function AgentIDLogin({ onLoginSuccess }: AgentIDLoginProps) {
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!agentId || !password) {
        toast({
          title: "Missing Information",
          description: "Please enter both Agent ID and Password.",
          variant: "destructive"
        });
        return;
      }

      // Call API to verify agent credentials
      const response = await fetch('/api/agents/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId.trim(),
          password: password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.agent) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.agent.first_name}!`
        });
        
        onLoginSuccess({
          uid: data.agent.agentId,
          agentId: data.agent.agentId,
          ...data.agent
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error: any) {
      console.error('Error during login:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid Agent ID or Password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAgentId('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 px-4 py-8">
      {/* Mobile Header */}
      <div className="text-center text-white mb-8 pt-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Agent Login</h1>
        <p className="text-blue-100 text-lg">
          Enter your credentials to access the agent portal
        </p>
      </div>

      {/* Login Card */}
      <div className="max-w-md mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Agent ID Field */}
              <div>
                <label htmlFor="agentId" className="block text-lg font-semibold text-gray-800 mb-3">
                  Agent ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-blue-500" />
                  </div>
                  <Input
                    id="agentId"
                    type="text"
                    placeholder="Enter your Agent ID"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-lg font-semibold text-gray-800 mb-3">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-blue-500" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading || !agentId || !password}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Reset Form Button */}
              {(agentId || password) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                  className="w-full h-12 text-base font-medium border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Clear Form
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Footer */}
      <div className="text-center text-white/80 mt-8 pb-8">
        <p className="text-sm">
          Secure delivery agent authentication
        </p>
        <p className="text-xs mt-1 opacity-75">
          Contact admin if you forgot your credentials
        </p>
      </div>
    </div>
  );
}