'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { EnhancedAgentProfile } from '@/components/agent/enhanced-agent-profile';
import { OrdersDashboard } from '@/components/agent/orders-dashboard';
import { AttendanceCard } from '@/components/agent/attendance-card';
import { 
  Package, 
  User,
  Clock,
  LogOut,
  Settings,
  Bell,
  Home
} from 'lucide-react';

interface AgentDashboardProps {
  agent: Agent;
  onLogout: () => void;
}

export function AgentDashboard({ agent, onLogout }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {agent.first_name.charAt(0)}{agent.last_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Welcome back, {agent.first_name}!
                </h1>
                <p className="text-sm text-gray-500">Agent ID: {agent.agentId}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* Notifications */}}
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Today's Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrdersDashboard agentId={agent.agentId} />
                </CardContent>
              </Card>

              {/* Attendance Card */}
              <div className="space-y-6">
                <AttendanceCard agentId={agent.agentId} agent={agent} />
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrdersDashboard agentId={agent.agentId} />
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceCard agentId={agent.agentId} agent={agent} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Detailed attendance history coming soon
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <EnhancedAgentProfile agent={agent} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}