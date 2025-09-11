'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL, listAll, getMetadata } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Order, OrderStatus, PaymentMethod, DeliveryType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  FileText,
  Image,
  FolderOpen,
  Folder,
  UserPlus, 
  Truck, 
  AlertTriangle, 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { seedAllData } from '@/lib/sample-data';

interface OrderFilters {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  deliveryType?: DeliveryType;
  urgent?: boolean;
  dateFrom?: string;
  dateTo?: string;
  assignedAgent?: string;
}

interface OrderFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  groupName?: string;
  order: number;
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFiles, setOrderFiles] = useState<OrderFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Order statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    urgent: 0
  });

  useEffect(() => {
    if (!db) return;

    // Subscribe to orders
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setOrders(ordersData);
      calculateStats(ordersData);
      setLoading(false);
    });

    // Subscribe to agents
    const agentsQuery = query(
      collection(db, 'agents'),
      where('status', '==', 'active')
    );

    const unsubscribeAgents = onSnapshot(agentsQuery, (snapshot) => {
      const agentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgents(agentsData);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeAgents();
    };
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.phone_number?.includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(order => order.payment.method === filters.paymentMethod);
    }

    // Delivery type filter
    if (filters.deliveryType) {
      filtered = filtered.filter(order => order.delivery.type === filters.deliveryType);
    }

    // Urgent filter
    if (filters.urgent) {
      filtered = filtered.filter(order => order.urgent);
    }

    // Assigned agent filter
    if (filters.assignedAgent) {
      if (filters.assignedAgent === 'unassigned') {
        filtered = filtered.filter(order => !order.assignedAgentId);
      } else {
        filtered = filtered.filter(order => order.assignedAgentId === filters.assignedAgent);
      }
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, filters]);

  // Fetch files for selected order
  const fetchOrderFiles = async (orderId: string) => {
    if (!storage) return;
    
    setFilesLoading(true);
    try {
      const orderFolderRef = ref(storage, `orders/${orderId}/files`);
      const filesList = await listAll(orderFolderRef);
      
      const filesData: OrderFile[] = [];
      
      for (const fileRef of filesList.items) {
        try {
          const url = await getDownloadURL(fileRef);
          const metadata = await getMetadata(fileRef);
          
          // Extract file info from name/path
          const fileName = fileRef.name;
          const pathParts = fileRef.fullPath.split('/');
          const groupName = pathParts.length > 4 ? pathParts[3] : undefined;
          
          // Try to extract order number from filename (assuming format: "1_filename.pdf")
          const orderMatch = fileName.match(/^(\d+)_/);
          const order = orderMatch ? parseInt(orderMatch[1]) : 0;
          
          filesData.push({
            name: fileName,
            url,
            type: metadata.contentType || 'application/octet-stream',
            size: metadata.size || 0,
            uploadedAt: metadata.timeCreated ? new Date(metadata.timeCreated) : new Date(),
            groupName,
            order
          });
        } catch (error) {
          console.error('Error fetching file metadata:', error);
        }
      }
      
      // Sort files by order number then by name
      filesData.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
      });
      
      setOrderFiles(filesData);
    } catch (error) {
      console.error('Error fetching order files:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order files',
        variant: 'destructive'
      });
    } finally {
      setFilesLoading(false);
    }
  };

  // Download single file
  const downloadFile = async (file: OrderFile) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive'
      });
    }
  };

  // Download all files
  const downloadAllFiles = async (orderId: string) => {
    try {
      toast({
        title: 'Download Started',
        description: 'Downloading all files...',
      });
      
      for (const file of orderFiles) {
        await downloadFile(file);
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error downloading all files:', error);
      toast({
        title: 'Error',
        description: 'Failed to download all files',
        variant: 'destructive'
      });
    }
  };

  const calculateStats = (ordersData: Order[]) => {
    const stats = {
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === 'Pending').length,
      processing: ordersData.filter(o => o.status === 'Processing').length,
      shipped: ordersData.filter(o => o.status === 'Shipped').length,
      delivered: ordersData.filter(o => o.status === 'Delivered').length,
      urgent: ordersData.filter(o => o.urgent).length
    };
    setStats(stats);
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Processing': return 'default';
      case 'Shipped': return 'default';
      case 'Out for Delivery': return 'default';
      case 'Delivered': return 'default';
      case 'Not Delivered': return 'destructive';
      case 'Cancelled': return 'destructive';
      case 'Returned': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending': return 'secondary';
      case 'Refunded': return 'destructive';
      default: return 'secondary';
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      if (!db) return;
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
        timeline: [
          ...(selectedOrder?.timeline || []),
          {
            ts: new Date(),
            actor: 'Admin',
            action: `status_changed_to_${newStatus.toLowerCase().replace(' ', '_')}`,
            note: `Status updated to ${newStatus}`
          }
        ]
      });

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}.`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive"
      });
    }
  };

  const updateDeliveryType = async (orderId: string, deliveryType: 'own' | 'shiprocket') => {
    try {
      if (!db) return;
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        'delivery.type': deliveryType,
        updatedAt: new Date(),
        timeline: [
          ...(selectedOrder?.timeline || []),
          {
            ts: new Date(),
            actor: 'Admin',
            action: 'delivery_type_updated',
            note: `Delivery type changed to ${deliveryType}`
          }
        ]
      });

      toast({
        title: "Delivery Type Updated",
        description: `Delivery type changed to ${deliveryType}.`
      });
    } catch (error) {
      console.error('Error updating delivery type:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery type.",
        variant: "destructive"
      });
    }
  };

  const handleAssignAgent = async (orderId: string, agentId: string) => {
    try {
      if (!db) return;
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        assignedAgentId: agentId,
        status: 'Processing',
        updatedAt: new Date()
      });

      toast({
        title: "Agent Assigned",
        description: "Order has been assigned to the selected agent."
      });
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent.",
        variant: "destructive"
      });
    }
  };

  const handleCreateShipment = async (orderId: string) => {
    try {
      // This would call your Cloud Function to create Shiprocket shipment
      toast({
        title: "Shipment Created",
        description: "Shiprocket shipment has been created successfully."
      });
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to create shipment.",
        variant: "destructive"
      });
    }
  };

  const handleSeedData = async () => {
    try {
      await seedAllData();
      toast({
        title: "Sample Data Added",
        description: "Sample orders and agents have been added to the database."
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: "Error",
        description: "Failed to seed sample data.",
        variant: "destructive"
      });
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableOrders = filteredOrders.filter(order => 
        !order.assignedAgentId && order.delivery.type === 'own'
      );
      setSelectedOrders(new Set(availableOrders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleBulkAssignAgent = async (agentId: string) => {
    try {
      if (!db) return;
      
      const promises = Array.from(selectedOrders).map(orderId => {
        const orderRef = doc(db!, 'orders', orderId);
        return updateDoc(orderRef, {
          assignedAgentId: agentId,
          status: 'Processing',
          updatedAt: new Date()
        });
      });

      await Promise.all(promises);

      toast({
        title: "Bulk Assignment Complete",
        description: `${selectedOrders.size} orders have been assigned to the selected agent.`
      });

      setSelectedOrders(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error bulk assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent to selected orders.",
        variant: "destructive"
      });
    }
  };

  const handleMarkUrgent = async (orderId: string, urgent: boolean) => {
    try {
      if (!db) return;
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        urgent: urgent,
        updatedAt: new Date()
      });

      toast({
        title: urgent ? "Marked as Urgent" : "Removed Urgent Status",
        description: `Order has been ${urgent ? 'marked as urgent' : 'unmarked as urgent'}.`
      });
    } catch (error) {
      console.error('Error updating urgent status:', error);
      toast({
        title: "Error",
        description: "Failed to update urgent status.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    return FileText;
  };

  const getAssignedAgentName = (agentId?: string) => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent';
  };

  // Group files by group name
  const groupedFiles = orderFiles.reduce((groups, file) => {
    const groupName = file.groupName || 'Ungrouped Files';
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(file);
    return groups;
  }, {} as Record<string, OrderFile[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Manage customer orders, view uploaded files, and track deliveries
          </p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.size} selected
              </span>
              <Select onValueChange={handleBulkAssignAgent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assign to agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.filter(agent => agent.status === 'active').map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedOrders(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
          <Button onClick={handleSeedData} variant="outline">
            Add Sample Data
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as OrderStatus }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Not Delivered">Not Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={filters.paymentMethod || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, paymentMethod: value === 'all' ? undefined : value as PaymentMethod }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payments</SelectItem>
                  <SelectItem value="COD">COD</SelectItem>
                  <SelectItem value="Prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Type</label>
              <Select value={filters.deliveryType || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, deliveryType: value === 'all' ? undefined : value as DeliveryType }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All delivery types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All delivery types</SelectItem>
                  <SelectItem value="own">Own Delivery</SelectItem>
                  <SelectItem value="shiprocket">Shiprocket</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filters.urgent ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, urgent: !prev.urgent || undefined }))}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Urgent Only
            </Button>
            
            <Button
              variant={filters.assignedAgent === 'unassigned' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                assignedAgent: prev.assignedAgent === 'unassigned' ? undefined : 'unassigned' 
              }))}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Unassigned
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredOrders.filter(order => 
                          !order.assignedAgentId && order.delivery.type === 'own'
                        ).length > 0 &&
                        filteredOrders.filter(order => 
                          !order.assignedAgentId && order.delivery.type === 'own'
                        ).every(order => selectedOrders.has(order.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Type</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const canBeSelected = !order.assignedAgentId && order.delivery.type === 'own';
                  return (
                    <TableRow 
                      key={order.id} 
                      className={order.urgent ? "bg-red-50 dark:bg-red-950/20" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                          disabled={!canBeSelected}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {order.urgent && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          {order.orderId || order.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.customer.first_name} {order.customer.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer.phone_number || order.customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Not Delivered">Not Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                            <SelectItem value="Returned">Returned</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={order.delivery.type} 
                          onValueChange={(value) => updateDeliveryType(order.id, value as 'own' | 'shiprocket')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="own">Own Delivery</SelectItem>
                            <SelectItem value="shiprocket">Shiprocket</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant={getPaymentBadgeVariant(order.payment.status)}>
                            {order.payment.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {order.payment.method}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.totals?.total || order.total)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(order.createdAt?.toDate() || order.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  fetchOrderFiles(order.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details - {order.orderId || order.id}</DialogTitle>
                              </DialogHeader>
                              <OrderDetailsDialog 
                                order={order} 
                                agents={agents}
                                orderFiles={orderFiles}
                                filesLoading={filesLoading}
                                groupedFiles={groupedFiles}
                                downloadFile={downloadFile}
                                downloadAllFiles={downloadAllFiles}
                                formatFileSize={formatFileSize}
                                getFileIcon={getFileIcon}
                                formatCurrency={formatCurrency}
                              />
                            </DialogContent>
                          </Dialog>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {!order.assignedAgentId && order.delivery.type === 'own' && (
                                <>
                                  {agents.map(agent => (
                                    <DropdownMenuItem
                                      key={agent.id}
                                      onClick={() => handleAssignAgent(order.id, agent.id)}
                                    >
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Assign to {agent.first_name}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                              
                              {order.delivery.type === 'shiprocket' && !order.delivery.shiprocket_shipment_id && (
                                <DropdownMenuItem onClick={() => handleCreateShipment(order.id)}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Create Shipment
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem onClick={() => handleMarkUrgent(order.id, !order.urgent)}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {order.urgent ? 'Remove Urgent' : 'Mark Urgent'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0 || searchTerm 
                  ? "Try adjusting your filters or search term"
                  : "Orders will appear here once customers place them"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Manage customer orders and deliveries
          </p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.size} selected
              </span>
              <Select onValueChange={handleBulkAssignAgent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assign to agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.filter(agent => agent.status === 'active').map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedOrders(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
          <Button onClick={handleSeedData} variant="outline">
            Add Sample Data
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as OrderStatus }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={filters.paymentMethod || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, paymentMethod: value === 'all' ? undefined : value as PaymentMethod }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payments</SelectItem>
                  <SelectItem value="COD">COD</SelectItem>
                  <SelectItem value="Prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Type</label>
              <Select value={filters.deliveryType || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, deliveryType: value === 'all' ? undefined : value as DeliveryType }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All delivery types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All delivery types</SelectItem>
                  <SelectItem value="own">Own Delivery</SelectItem>
                  <SelectItem value="shiprocket">Shiprocket</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filters.urgent ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, urgent: !prev.urgent || undefined }))}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Urgent Only
            </Button>
            
            <Button
              variant={filters.assignedAgent === 'unassigned' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                assignedAgent: prev.assignedAgent === 'unassigned' ? undefined : 'unassigned' 
              }))}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Unassigned
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredOrders.filter(order => 
                          !order.assignedAgentId && order.delivery.type === 'own'
                        ).length > 0 &&
                        filteredOrders.filter(order => 
                          !order.assignedAgentId && order.delivery.type === 'own'
                        ).every(order => selectedOrders.has(order.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Delivery Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const canBeSelected = !order.assignedAgentId && order.delivery.type === 'own';
                  return (
                    <TableRow 
                      key={order.id} 
                      className={order.urgent ? "bg-red-50 dark:bg-red-950/20" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                          disabled={!canBeSelected}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {order.urgent && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          {order.orderId || order.id}
                        </div>
                      </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.customer.first_name} {order.customer.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer.phone_number || order.customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.delivery.type === 'own' ? 'default' : 'secondary'}>
                        {order.delivery.type === 'own' ? 'Own Delivery' : 'Shiprocket'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant={getPaymentBadgeVariant(order.payment.status)}>
                          {order.payment.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {order.payment.method}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.totals?.total || order.total)}
                    </TableCell>
                    <TableCell>
                      <span className={!order.assignedAgentId ? "text-muted-foreground" : ""}>
                        {getAssignedAgentName(order.assignedAgentId)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.createdAt?.toDate() || order.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Order Details - {order.orderId || order.id}</DialogTitle>
                            </DialogHeader>
                            <OrderDetailsDialog order={order} agents={agents} />
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {!order.assignedAgentId && order.delivery.type === 'own' && (
                              <DropdownMenuItem asChild>
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">Assign Agent</span>
                                  {agents.map(agent => (
                                    <Button
                                      key={agent.id}
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAssignAgent(order.id, agent.id)}
                                      className="justify-start"
                                    >
                                      {agent.first_name} {agent.last_name}
                                    </Button>
                                  ))}
                                </div>
                              </DropdownMenuItem>
                            )}
                            
                            {order.delivery.type === 'shiprocket' && !order.delivery.shiprocket_shipment_id && (
                              <DropdownMenuItem onClick={() => handleCreateShipment(order.id)}>
                                <Truck className="h-4 w-4 mr-2" />
                                Create Shipment
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => handleMarkUrgent(order.id, !order.urgent)}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              {order.urgent ? 'Remove Urgent' : 'Mark Urgent'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0 || searchTerm 
                  ? "Try adjusting your filters or search term"
                  : "Orders will appear here once customers place them"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Order Details Dialog Component with File Viewing
interface OrderDetailsDialogProps {
  order: Order;
  agents: any[];
  orderFiles: OrderFile[];
  filesLoading: boolean;
  groupedFiles: Record<string, OrderFile[]>;
  downloadFile: (file: OrderFile) => Promise<void>;
  downloadAllFiles: (orderId: string) => Promise<void>;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (type: string) => any;
  formatCurrency: (amount: number) => string;
}

function OrderDetailsDialog({ 
  order, 
  agents, 
  orderFiles, 
  filesLoading, 
  groupedFiles, 
  downloadFile, 
  downloadAllFiles, 
  formatFileSize, 
  getFileIcon, 
  formatCurrency 
}: OrderDetailsDialogProps) {
  const getAssignedAgentName = (agentId?: string) => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent';
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="files">Files ({orderFiles.length})</TabsTrigger>
        <TabsTrigger value="customer">Customer</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium">Order ID</label>
                <p>{order.orderId || order.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge className="ml-2">{order.status}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Urgent</label>
                <Badge variant={order.urgent ? "destructive" : "secondary"} className="ml-2">
                  {order.urgent ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Created At</label>
                <p>{new Date(order.createdAt?.toDate() || order.date).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium">Delivery Type</label>
                <Badge className="ml-2">
                  {order.delivery.type === 'own' ? 'Own Delivery' : 'Shiprocket'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Assigned Agent</label>
                <p>{getAssignedAgentName(order.assignedAgentId)}</p>
              </div>
              {order.delivery.tracking_url && (
                <div>
                  <label className="text-sm font-medium">Tracking</label>
                  <p>
                    <a 
                      href={order.delivery.tracking_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Track Package
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <p>{order.payment.method}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Status</label>
                <Badge className="ml-2">{order.payment.status}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Total Amount</label>
                <p className="font-bold text-lg">{formatCurrency(order.totals?.total || order.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="files" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Uploaded Files ({orderFiles.length})</CardTitle>
            {orderFiles.length > 0 && (
              <Button 
                onClick={() => downloadAllFiles(order.id)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">Loading files...</span>
              </div>
            ) : orderFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files uploaded for this order
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedFiles).map(([groupName, files]) => (
                  <div key={groupName} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      {groupName} ({files.length} files)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {files.map((file, index) => (
                        <div 
                          key={`${file.name}-${index}`}
                          className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Upload #{file.order}
                              </p>
                              {file.uploadedAt && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(file.uploadedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(file)}
                              className="flex-shrink-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="customer" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p>{order.customer.first_name} {order.customer.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p>{order.customer.phone_number || order.customer.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p>{order.customer.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <p>{order.customer.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="items" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity || 1}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>{formatCurrency(item.price * (item.quantity || 1))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="timeline" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.timeline?.map((event, index) => (
                <div key={index} className="flex items-start gap-3 border-l-2 border-muted pl-4 pb-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 -ml-5 border-2 border-background"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{event.action.replace('_', ' ').toUpperCase()}</p>
                      <span className="text-sm text-muted-foreground">
                        {event.ts?.toDate ? event.ts.toDate().toLocaleString() : 'Unknown time'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">By: {event.actor}</p>
                    {event.note && <p className="text-sm mt-1">{event.note}</p>}
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground">No timeline events yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default OrderManagement;
