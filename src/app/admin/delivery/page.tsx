'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Agent, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Phone,
  Mail,
  Car,
  MapPin,
  Package,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Key,
  Copy,
  Upload,
  FileText,
  Camera,
  FileCheck,
  LogIn,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useConfirmationAlert } from '@/hooks/use-confirmation-alert';

export default function DeliveryManagementPage() {
  const { showConfirmation, showSuccessAlert, showErrorAlert } = useConfirmationAlert();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentOrders, setAgentOrders] = useState<Order[]>([]);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    agentId: '',
    password: ''
  });
  const [onboardingForm, setOnboardingForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    idProofFile: null as File | null,
    addressProofFile: null as File | null,
    vehicleProofFile: null as File | null,
    notes: ''
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedAgentForPassword, setSelectedAgentForPassword] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Agent statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0
  });

  useEffect(() => {
    if (!db) {
      setLoading(false);
      console.warn('Firebase not connected - using emulator mode');
      return;
    }

    // Subscribe to agents
    const agentsQuery = query(collection(db, 'agents'));
    const unsubscribe = onSnapshot(agentsQuery, 
      (snapshot) => {
        const agentsData = snapshot.docs.map(doc => ({
          agentId: doc.id,
          ...doc.data()
        })) as Agent[];
        
        setAgents(agentsData);
        calculateStats(agentsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching agents:', error);
        setLoading(false);
        toast({
          title: "Connection Error",
          description: "Failed to load agents. Make sure Firebase emulators are running.",
          variant: "destructive"
        });
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Apply search filter
    let filtered = agents;

    if (searchTerm) {
      filtered = filtered.filter(agent => 
        agent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone.includes(searchTerm) ||
        agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAgents(filtered);
  }, [agents, searchTerm]);

  useEffect(() => {
    // Load orders for selected agent
    if (!selectedAgent || !db) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('assignedAgentId', '==', selectedAgent.agentId)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setAgentOrders(ordersData);
    });

    return () => unsubscribe();
  }, [selectedAgent]);

  const calculateStats = (agentsData: Agent[]) => {
    const stats = {
      total: agentsData.length,
      active: agentsData.filter(a => a.status === 'active').length,
      pending: agentsData.filter(a => a.status === 'pending').length,
      suspended: agentsData.filter(a => a.status === 'suspended').length
    };
    setStats(stats);
  };

  const generateCredentials = () => {
    const agentId = `AG${Date.now().toString().slice(-6)}`;
    const password = Math.random().toString(36).slice(-8);
    
    setNewAgentForm(prev => ({
      ...prev,
      agentId,
      password
    }));
  };

  const createAgentAccount = async () => {
    try {
      if (!db) return;

      if (!newAgentForm.firstName || !newAgentForm.lastName || !newAgentForm.phone) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      const agentData = {
        agentId: newAgentForm.agentId,
        first_name: newAgentForm.firstName,
        last_name: newAgentForm.lastName,
        phone: newAgentForm.phone,
        email: newAgentForm.email || '',
        status: 'active',
        vehicle: {
          type: newAgentForm.vehicleType,
          number: newAgentForm.vehicleNumber
        },
        credentials: {
          agentId: newAgentForm.agentId,
          password: newAgentForm.password,
          createdAt: new Date(),
          createdBy: 'admin'
        },
        onboarding: {
          completed: true,
          approvedAt: new Date(),
          approvedBy: 'admin'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'agents'), agentData);

      toast({
        title: "Agent Created",
        description: `Agent account created successfully with ID: ${newAgentForm.agentId}`
      });

      // Reset form
      setNewAgentForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        agentId: '',
        password: ''
      });
      setCredentialDialogOpen(false);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: "Failed to create agent account.",
        variant: "destructive"
      });
    }
  };

  const submitOnboardingApplication = async () => {
    try {
      if (!db) return;

      if (!onboardingForm.firstName || !onboardingForm.lastName || !onboardingForm.phone) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      if (!onboardingForm.idProofFile || !onboardingForm.addressProofFile) {
        toast({
          title: "Error",
          description: "Please upload ID Proof and Address Proof documents.",
          variant: "destructive"
        });
        return;
      }

      // In a real app, you would upload files to Firebase Storage
      // For now, we'll simulate file URLs
      const simulateFileUpload = (file: File) => {
        return `https://storage.example.com/agents/${Date.now()}_${file.name}`;
      };

      const agentData = {
        first_name: onboardingForm.firstName,
        last_name: onboardingForm.lastName,
        phone: onboardingForm.phone,
        email: onboardingForm.email || '',
        status: 'pending',
        vehicle: {
          type: onboardingForm.vehicleType,
          number: onboardingForm.vehicleNumber
        },
        onboarding: {
          idProofUrl: simulateFileUpload(onboardingForm.idProofFile),
          addressProofUrl: simulateFileUpload(onboardingForm.addressProofFile),
          vehicleProofUrl: onboardingForm.vehicleProofFile ? simulateFileUpload(onboardingForm.vehicleProofFile) : null,
          notes: onboardingForm.notes,
          completed: false,
          submittedAt: new Date(),
          submittedBy: 'admin'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'agents'), agentData);

      toast({
        title: "Application Submitted",
        description: `Onboarding application for ${onboardingForm.firstName} ${onboardingForm.lastName} has been submitted for review.`
      });

      // Reset form
      setOnboardingForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        idProofFile: null,
        addressProofFile: null,
        vehicleProofFile: null,
        notes: ''
      });
      setOnboardingDialogOpen(false);
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to submit onboarding application.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`
    });
  };

  const updateAgentStatus = async (agentId: string, status: 'active' | 'suspended') => {
    try {
      if (!db) return;
      
      const agentRef = doc(db, 'agents', agentId);
      await updateDoc(agentRef, {
        status,
        updatedAt: new Date()
      });

      toast({
        title: "Agent Status Updated",
        description: `Agent has been ${status === 'active' ? 'approved' : 'suspended'}.`
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
      toast({
        title: "Error",
        description: "Failed to update agent status.",
        variant: "destructive"
      });
    }
  };

  const changeAgentPassword = async () => {
    try {
      if (!db || !selectedAgentForPassword || !newPassword.trim()) return;

      const agentRef = doc(db, 'agents', selectedAgentForPassword.agentId);
      await updateDoc(agentRef, {
        'credentials.password': newPassword.trim(),
        'credentials.updatedAt': new Date(),
        'credentials.updatedBy': 'admin',
        updatedAt: new Date()
      });

      toast({
        title: "Password Updated",
        description: `Password changed successfully for ${selectedAgentForPassword.first_name} ${selectedAgentForPassword.last_name}`
      });

      setPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedAgentForPassword(null);
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change agent password.",
        variant: "destructive"
      });
    }
  };

  const deleteAgent = async (agentId: string, agentName: string) => {
    try {
      if (!db) return;

      const confirmed = await showConfirmation({
        title: 'Delete Agent',
        message: `Are you sure you want to delete agent ${agentName}? This action cannot be undone.`,
        confirmText: 'Yes, delete',
        cancelText: 'Cancel',
        type: 'warning'
      });

      if (!confirmed) {
        return;
      }

      // In a real app, you might want to soft delete instead of hard delete
      // For now, we'll update status to 'deleted'
      const agentRef = doc(db, 'agents', agentId);
      await updateDoc(agentRef, {
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: 'admin',
        updatedAt: new Date()
      });

      showSuccessAlert({
        title: "Agent Deleted",
        description: `Agent ${agentName} has been deleted successfully.`
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
      showErrorAlert({
        title: "Error",
        description: "Failed to delete agent."
      });
    }
  };

  const loginAsAgent = (agent: Agent) => {
    // Store agent info in sessionStorage for admin impersonation
    sessionStorage.setItem('adminImpersonation', JSON.stringify({
      agentId: agent.agentId,
      agentName: `${agent.first_name} ${agent.last_name}`,
      timestamp: new Date().toISOString()
    }));

    // Open agent portal in new tab
    window.open('/agent?admin=true', '_blank');

    toast({
      title: "Logged in as Agent",
      description: `You are now logged in as ${agent.first_name} ${agent.last_name} in a new tab.`
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'suspended': return <UserX className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Management</h1>
          <p className="text-muted-foreground">
            Manage delivery agents and track their performance
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={onboardingDialogOpen} onOpenChange={setOnboardingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setOnboardingDialogOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Agent Onboarding
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agent Onboarding Application</DialogTitle>
              </DialogHeader>
              <OnboardingDialog
                form={onboardingForm}
                setForm={setOnboardingForm}
                onSubmit={submitOnboardingApplication}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCredentialDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Agent Account</DialogTitle>
              </DialogHeader>
              <CreateAgentDialog
                form={newAgentForm}
                setForm={setNewAgentForm}
                onGenerateCredentials={generateCredentials}
                onCreateAgent={createAgentAccount}
                onCopyToClipboard={copyToClipboard}
              />
            </DialogContent>
          </Dialog>

          {/* Password Change Dialog */}
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Change Agent Password</DialogTitle>
                <DialogDescription>
                  {selectedAgentForPassword && 
                    `Change password for ${selectedAgentForPassword.first_name} ${selectedAgentForPassword.last_name} (ID: ${selectedAgentForPassword.agentId})`
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPasswordDialogOpen(false);
                    setNewPassword('');
                    setSelectedAgentForPassword(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={changeAgentPassword}
                  disabled={!newPassword.trim() || newPassword.length < 6}
                >
                  Change Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.suspended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Agents ({filteredAgents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.agentId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {agent.first_name} {agent.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {agent.agentId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {agent.phone}
                        </div>
                        {agent.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {agent.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            {agent.vehicle.type.charAt(0).toUpperCase() + agent.vehicle.type.slice(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {agent.vehicle.number}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(agent.status)} className="gap-1">
                        {getStatusIcon(agent.status)}
                        {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {agent.createdAt?.toDate ? agent.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAgent(agent)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>
                                Agent Details - {agent.first_name} {agent.last_name}
                              </DialogTitle>
                            </DialogHeader>
                            <AgentDetailsDialog 
                              agent={agent} 
                              orders={agentOrders}
                              onUpdateStatus={updateAgentStatus}
                            />
                          </DialogContent>
                        </Dialog>

                        {/* Password Change Button */}
                        {agent.status !== 'deleted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAgentForPassword(agent);
                              setPasswordDialogOpen(true);
                            }}
                            title="Change Password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Login as Agent Button */}
                        {agent.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loginAsAgent(agent)}
                            title="Login as Agent"
                          >
                            <LogIn className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Status Management */}
                        {agent.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateAgentStatus(agent.agentId, 'active')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}

                        {agent.status === 'active' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateAgentStatus(agent.agentId, 'suspended')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}

                        {agent.status === 'suspended' && (
                          <Button
                            size="sm"
                            onClick={() => updateAgentStatus(agent.agentId, 'active')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Reactivate
                          </Button>
                        )}

                        {/* Delete Button */}
                        {agent.status !== 'deleted' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAgent(agent.agentId, `${agent.first_name} ${agent.last_name}`)}
                            title="Delete Agent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No agents found</p>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search term"
                  : "Agents will appear here once they register"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AgentDetailsDialog({ 
  agent, 
  orders, 
  onUpdateStatus 
}: { 
  agent: Agent; 
  orders: Order[];
  onUpdateStatus: (agentId: string, status: 'active' | 'suspended') => void;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const activeOrders = orders.filter(o => ['Processing', 'Shipped', 'Out for Delivery'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'Delivered');

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p>{agent.first_name} {agent.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p>{agent.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p>{agent.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge variant={agent.status === 'active' ? 'default' : agent.status === 'pending' ? 'secondary' : 'destructive'} className="ml-2">
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium">Vehicle Type</label>
                <p>{agent.vehicle.type.charAt(0).toUpperCase() + agent.vehicle.type.slice(1)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Vehicle Number</label>
                <p>{agent.vehicle.number}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Joined</label>
                <p>{agent.createdAt?.toDate ? agent.createdAt.toDate().toLocaleDateString() : 'Unknown'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          {agent.status === 'pending' && (
            <Button onClick={() => onUpdateStatus(agent.agentId, 'active')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Agent
            </Button>
          )}
          {agent.status === 'active' && (
            <Button variant="destructive" onClick={() => onUpdateStatus(agent.agentId, 'suspended')}>
              <XCircle className="h-4 w-4 mr-2" />
              Suspend Agent
            </Button>
          )}
          {agent.status === 'suspended' && (
            <Button onClick={() => onUpdateStatus(agent.agentId, 'active')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Reactivate Agent
            </Button>
          )}
        </div>
      </TabsContent>

      <TabsContent value="orders" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeOrders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{completedOrders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orders.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p>No orders assigned to this agent yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 10).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderId || order.id}
                      </TableCell>
                      <TableCell>
                        {order.customer.first_name} {order.customer.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge>{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(order.totals?.total || order.total)}
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt?.toDate() || order.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">ID Proof</h3>
                {agent.onboarding.idProofUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Uploaded</span>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={agent.onboarding.idProofUrl} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">Not uploaded</span>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Address Proof</h3>
                {agent.onboarding.addressProofUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Uploaded</span>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={agent.onboarding.addressProofUrl} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">Not uploaded</span>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Vehicle Proof</h3>
                {agent.onboarding.vehicleProofUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Uploaded</span>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={agent.onboarding.vehicleProofUrl} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Optional - Not uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">
                {completedOrders.length} of {orders.length} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(completedOrders.reduce((sum, order) => sum + (order.totals?.total || order.total), 0) * 0.1)}
              </p>
              <p className="text-xs text-muted-foreground">10% of delivered orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">4.5</p>
              <p className="text-xs text-muted-foreground">Based on customer feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">On-Time Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">95%</p>
              <p className="text-xs text-muted-foreground">Delivered on time</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function CreateAgentDialog({
  form,
  setForm,
  onGenerateCredentials,
  onCreateAgent,
  onCopyToClipboard
}: {
  form: any;
  setForm: (updater: (prev: any) => any) => void;
  onGenerateCredentials: () => void;
  onCreateAgent: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder="Enter first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Enter phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicleType">Vehicle Type</Label>
          <select
            id="vehicleType"
            value={form.vehicleType}
            onChange={(e) => setForm(prev => ({ ...prev, vehicleType: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="bike">Bike</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicleNumber">Vehicle Number</Label>
          <Input
            id="vehicleNumber"
            value={form.vehicleNumber}
            onChange={(e) => setForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
            placeholder="Enter vehicle number"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Login Credentials</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateCredentials}
          >
            <Key className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID</Label>
            <div className="flex gap-2">
              <Input
                id="agentId"
                value={form.agentId}
                readOnly
                placeholder="Click Generate to create ID"
                className="bg-muted"
              />
              {form.agentId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyToClipboard(form.agentId, 'Agent ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                value={form.password}
                readOnly
                placeholder="Click Generate to create password"
                className="bg-muted"
              />
              {form.password && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyToClipboard(form.password, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {form.agentId && form.password && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Share these credentials with the agent securely. They will use these to log in to the agent portal.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          onClick={onCreateAgent}
          disabled={!form.firstName || !form.lastName || !form.phone || !form.agentId || !form.password}
        >
          Create Agent Account
        </Button>
      </div>
    </div>
  );
}

function OnboardingDialog({
  form,
  setForm,
  onSubmit
}: {
  form: any;
  setForm: (updater: (prev: any) => any) => void;
  onSubmit: () => void;
}) {
  const handleFileChange = (field: string, file: File | null) => {
    setForm(prev => ({ ...prev, [field]: file }));
  };

  const getFilePreview = (file: File | null) => {
    if (!file) return null;
    return {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type
    };
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="onb-firstName">First Name *</Label>
            <Input
              id="onb-firstName"
              value={form.firstName}
              onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-lastName">Last Name *</Label>
            <Input
              id="onb-lastName"
              value={form.lastName}
              onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="onb-phone">Phone Number *</Label>
          <Input
            id="onb-phone"
            value={form.phone}
            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="onb-email">Email (Optional)</Label>
          <Input
            id="onb-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
          />
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Vehicle Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="onb-vehicleType">Vehicle Type</Label>
            <select
              id="onb-vehicleType"
              value={form.vehicleType}
              onChange={(e) => setForm(prev => ({ ...prev, vehicleType: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="bike">Bike</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-vehicleNumber">Vehicle Number</Label>
            <Input
              id="onb-vehicleNumber"
              value={form.vehicleNumber}
              onChange={(e) => setForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              placeholder="Enter vehicle number"
            />
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Document Upload</h3>
        
        {/* ID Proof */}
        <div className="space-y-2">
          <Label htmlFor="idProof">ID Proof * (Aadhar Card, PAN Card, Driving License)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-center">
                <Input
                  id="idProof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('idProofFile', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Label 
                  htmlFor="idProof" 
                  className="cursor-pointer text-blue-600 hover:text-blue-500"
                >
                  Click to upload ID Proof
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, PDF up to 10MB
                </p>
              </div>
            </div>
            {form.idProofFile && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{getFilePreview(form.idProofFile)?.name}</p>
                  <p className="text-xs text-gray-500">{getFilePreview(form.idProofFile)?.size}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileChange('idProofFile', null)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Address Proof */}
        <div className="space-y-2">
          <Label htmlFor="addressProof">Address Proof * (Utility Bill, Bank Statement, Rent Agreement)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-center">
                <Input
                  id="addressProof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('addressProofFile', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Label 
                  htmlFor="addressProof" 
                  className="cursor-pointer text-blue-600 hover:text-blue-500"
                >
                  Click to upload Address Proof
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, PDF up to 10MB
                </p>
              </div>
            </div>
            {form.addressProofFile && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{getFilePreview(form.addressProofFile)?.name}</p>
                  <p className="text-xs text-gray-500">{getFilePreview(form.addressProofFile)?.size}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileChange('addressProofFile', null)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Proof */}
        <div className="space-y-2">
          <Label htmlFor="vehicleProof">Vehicle Proof (Registration Certificate, Insurance)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-center">
                <Input
                  id="vehicleProof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('vehicleProofFile', e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Label 
                  htmlFor="vehicleProof" 
                  className="cursor-pointer text-blue-600 hover:text-blue-500"
                >
                  Click to upload Vehicle Proof
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, PDF up to 10MB (Optional)
                </p>
              </div>
            </div>
            {form.vehicleProofFile && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{getFilePreview(form.vehicleProofFile)?.name}</p>
                  <p className="text-xs text-gray-500">{getFilePreview(form.vehicleProofFile)?.size}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFileChange('vehicleProofFile', null)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="onb-notes">Additional Notes (Optional)</Label>
        <Textarea
          id="onb-notes"
          value={form.notes}
          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional information about the agent..."
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          onClick={onSubmit}
          disabled={!form.firstName || !form.lastName || !form.phone || !form.idProofFile || !form.addressProofFile}
          className="w-full"
        >
          <FileText className="h-4 w-4 mr-2" />
          Submit Onboarding Application
        </Button>
      </div>
      
      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
        <p className="font-medium mb-1">Note:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>All uploaded documents will be reviewed by admin</li>
          <li>Agent status will be set to "Pending" until verification is complete</li>
          <li>ID Proof and Address Proof are mandatory for onboarding</li>
          <li>Vehicle Proof is optional but recommended</li>
        </ul>
      </div>
    </div>
  );
}
