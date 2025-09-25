'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin, Phone, Mail, Car, Calendar, Clock, BarChart3 } from 'lucide-react';
import { Agent } from '@/lib/types';
import { AgentStatus, AgentAttendanceRecord } from '@/types/order-management';
import LoginHistory from '@/components/shared/login-history';
import { AttendanceCard } from '@/components/agent/attendance-card';
import { OrdersDashboard } from '@/components/agent/orders-dashboard';
import { formatTime, formatDate, safeToDate } from '@/lib/utils';

interface EnhancedAgentProfileProps {
  agent: Agent;
}

export function EnhancedAgentProfile({ agent }: EnhancedAgentProfileProps) {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
  }, [agent.agentId]);

  const fetchAgentData = async () => {
    try {
      const [statusResponse, attendanceResponse] = await Promise.all([
        fetch(`/api/admin/agent-status?action=agent-status&agentId=${agent.agentId}`),
        fetch(`/api/agent/attendance?action=attendance-summary&agentId=${agent.agentId}`)
      ]);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setAgentStatus(statusData.status);
      }

      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setAttendanceSummary(attendanceData.summary);
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Agent Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {agent.first_name.charAt(0)}{agent.last_name.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {agent.first_name} {agent.last_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span>Agent ID: {agent.agentId}</span>
                  {getStatusBadge(agent.status)}
                </CardDescription>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Joined: {formatDate(safeToDate(agent.createdAt))}</div>
              <div>Updated: {formatDate(safeToDate(agent.updatedAt))}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{agent.phone}</span>
            </div>
            {agent.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{agent.email}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Car className="w-4 h-4 text-gray-500" />
              <span>{agent.vehicle.type} - {agent.vehicle.number}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {agentStatus?.currentWorkload || 0}/{agentStatus?.workloadCapacity || 5}
                  </div>
                  <div className="text-sm text-gray-600">Current Load</div>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {attendanceSummary?.workingDays || 0}
                  </div>
                  <div className="text-sm text-gray-600">Days This Week</div>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {attendanceSummary?.avgHoursPerDay?.toFixed(1) || '0.0'}h
                  </div>
                  <div className="text-sm text-gray-600">Avg Hours/Day</div>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {attendanceSummary?.attendanceRate || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Attendance Rate</div>
                </div>
                <User className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="login-history">Login History</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceCard agentId={agent.agentId} agent={agent} />
            
            <Card>
              <CardHeader>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>Current status and workload information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentStatus ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      {getStatusBadge(agentStatus.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Workload:</span>
                      <span>{agentStatus.currentWorkload} / {agentStatus.workloadCapacity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Updated:</span>
                      <span>{formatTime(safeToDate(agentStatus.lastUpdated))}</span>
                    </div>
                    {agentStatus.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Location tracked</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500">No status information available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <OrdersDashboard agentId={agent.agentId} />
        </TabsContent>

        <TabsContent value="attendance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceCard agentId={agent.agentId} agent={agent} />
            
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
                <CardDescription>Attendance summary for the past 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceSummary ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Working Days:</span>
                      <span>{attendanceSummary.workingDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Hours:</span>
                      <span>{attendanceSummary.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Hours/Day:</span>
                      <span>{attendanceSummary.avgHoursPerDay}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attendance Rate:</span>
                      <span>{attendanceSummary.attendanceRate}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Loading attendance summary...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="login-history">
          <LoginHistory 
            userType="agent" 
            userId={agent.agentId}
          />
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Agent profile details and documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {agent.first_name} {agent.last_name}</div>
                    <div><strong>Phone:</strong> {agent.phone}</div>
                    {agent.email && <div><strong>Email:</strong> {agent.email}</div>}
                    <div><strong>Status:</strong> {agent.status}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Vehicle Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {agent.vehicle.type}</div>
                    <div><strong>Number:</strong> {agent.vehicle.number}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Onboarding Status</h4>
                <div className="flex items-center gap-2">
                  <Badge variant={agent.onboarding.completed ? "default" : "destructive"}>
                    {agent.onboarding.completed ? "Completed" : "Incomplete"}
                  </Badge>
                </div>
                {!agent.onboarding.completed && (
                  <div className="mt-2 text-sm text-gray-600">
                    Missing documents may need to be uploaded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}