'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  MapPin,
  Phone,
  Car,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Agent } from '@/lib/types';
import { AgentStatus, AgentWorkload } from '@/types/order-management';
import { formatTime, formatDate, safeToDate } from '@/lib/utils';

interface AdminAgentManagementProps {
  onImpersonate?: (agentId: string, agentName: string) => void;
}

export function AdminAgentManagement({ onImpersonate }: AdminAgentManagementProps) {
  const [agentsWithStatus, setAgentsWithStatus] = useState<{agent: Agent, status: AgentStatus | null}[]>([]);
  const [workloads, setWorkloads] = useState<AgentWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [statusAction, setStatusAction] = useState<'activate' | 'suspend' | 'capacity' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAgentsData();
  }, []);

  const fetchAgentsData = async () => {
    try {
      const response = await fetch('/api/admin/agent-status?action=all-agent-status');
      if (response.ok) {
        const data = await response.json();
        setAgentsWithStatus(data.agentsWithStatus);
        
        // Get workloads
        const workloadResponse = await fetch('/api/admin/order-management?action=available-agents');
        if (workloadResponse.ok) {
          const workloadData = await workloadResponse.json();
          setWorkloads(workloadData.workloads);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agents data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAction = async (action: string, agentId: string, data: any = {}) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/agent-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          agentId,
          updatedBy: 'admin', // In real app, get from session
          ...data
        })
      });

      if (response.ok) {
        fetchAgentsData();
        setStatusAction(null);
        setSelectedAgent(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update agent status');
      }
    } catch (error) {
      console.error('Failed to update agent status:', error);
      alert('Failed to update agent status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getWorkloadColor = (current: number, capacity: number) => {
    const ratio = current / capacity;
    if (ratio >= 0.9) return 'text-red-600';
    if (ratio >= 0.7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredAgents = agentsWithStatus.filter(({ agent, status }) => {
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesSearch = !searchTerm || 
      `${agent.first_name} ${agent.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.agentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phone.includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  const summary = {
    total: agentsWithStatus.length,
    active: agentsWithStatus.filter(({ agent }) => agent.status === 'active').length,
    inactive: agentsWithStatus.filter(({ agent }) => agent.status === 'pending').length,
    suspended: agentsWithStatus.filter(({ agent }) => agent.status === 'suspended').length,
    checkedIn: agentsWithStatus.filter(({ status }) => status?.checkedIn).length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading agents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-gray-600">Total Agents</div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.active}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{summary.inactive}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.suspended}</div>
                <div className="text-sm text-gray-600">Suspended</div>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{summary.checkedIn}</div>
                <div className="text-sm text-gray-600">Checked In</div>
              </div>
              <MapPin className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Agent Management
          </CardTitle>
          <CardDescription>
            Manage agent status, workload, and attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search agents by name, ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAgentsData}
              variant="outline"
            >
              Refresh
            </Button>
          </div>

          {/* Agents List */}
          <div className="space-y-4">
            {filteredAgents.map(({ agent, status }) => {
              const workload = workloads.find(w => w.agentId === agent.agentId);
              
              return (
                <div
                  key={agent.agentId}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {agent.first_name.charAt(0)}{agent.last_name.charAt(0)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {agent.first_name} {agent.last_name}
                          </span>
                          {getStatusBadge(agent.status)}
                          {status?.checkedIn && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              Checked In
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>ID: {agent.agentId}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {agent.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Car className="w-4 h-4" />
                            {agent.vehicle.type} - {agent.vehicle.number}
                          </div>
                          {workload && (
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4" />
                              <span className={getWorkloadColor(workload.currentOrders, workload.capacity)}>
                                {workload.currentOrders}/{workload.capacity}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {status?.lastUpdated && (
                          <div className="text-xs text-gray-500">
                            Last updated: {formatTime(safeToDate(status.lastUpdated))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onImpersonate && agent.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onImpersonate(agent.agentId, `${agent.first_name} ${agent.last_name}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Impersonate
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAgent(agent)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              Manage {agent.first_name} {agent.last_name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            {agent.status === 'pending' && (
                              <Button
                                onClick={() => handleStatusAction('activate', agent.agentId)}
                                disabled={actionLoading}
                                className="w-full"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate Agent
                              </Button>
                            )}
                            
                            {agent.status === 'active' && (
                              <Button
                                onClick={() => {
                                  const reason = prompt('Reason for suspension:');
                                  if (reason) {
                                    handleStatusAction('suspend', agent.agentId, { reason });
                                  }
                                }}
                                disabled={actionLoading}
                                variant="destructive"
                                className="w-full"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Suspend Agent
                              </Button>
                            )}
                            
                            {agent.status === 'suspended' && (
                              <Button
                                onClick={() => handleStatusAction('activate', agent.agentId)}
                                disabled={actionLoading}
                                className="w-full"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Reactivate Agent
                              </Button>
                            )}
                            
                            {status && (
                              <div className="space-y-2">
                                <Label>Update Workload Capacity</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    defaultValue={status.workloadCapacity || 5}
                                    id={`capacity-${agent.agentId}`}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const input = document.getElementById(`capacity-${agent.agentId}`) as HTMLInputElement;
                                      const capacity = parseInt(input.value);
                                      if (capacity >= 1 && capacity <= 20) {
                                        handleStatusAction('update-capacity', agent.agentId, { workloadCapacity: capacity });
                                      }
                                    }}
                                    disabled={actionLoading}
                                  >
                                    Update
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredAgents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No agents found matching the current filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}