'use client';

import { useState, useEffect } from 'react';
import { useOrders, OrderFilters } from '@/hooks/use-orders';
import { Order, OrderStatus, PaymentMethod, DeliveryType, OrderFile } from '@/lib/types';
import { Agent } from '@/app/api/agents/route';
import { useConfirmationAlert } from '@/hooks/use-confirmation-alert';
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
import { useToast } from '@/hooks/use-toast';
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
  CheckCircle2,
  XCircle,
  Users,
  MoreHorizontal,
  Maximize2,
  X,
  ExternalLink,
  RefreshCw,
  Loader2,
  Trash
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UploadProgress, MultiUploadProgress } from '@/components/ui/upload-progress';
import { useFileUpload } from '@/hooks/use-file-upload';

// Types
interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  urgent: number;
}

export function OrderManagement() {
  const { toast } = useToast();
  const { showConfirmation, showSuccessAlert, showErrorAlert, confirmAndExecute } = useConfirmationAlert();
  
  // Use the custom hook for orders data
  const {
    orders,
    agents,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    updateOrder,
    bulkUpdateOrders,
    deleteOrder,
    assignAgent,
    unassignAgent,
    bulkAssignAgent,
    bulkUnassignAgent,
    refetch
  } = useOrders();

  // Use the file upload hook
  const {
    uploads,
    uploadFiles,
    cancelUpload,
    cancelAllUploads,
    clearCompleted,
    isUploading: globalIsUploading,
    hasErrors: globalHasErrors,
    completedCount,
    totalCount
  } = useFileUpload({
    onUploadComplete: (id, response) => {
      showSuccessAlert({
        title: "Upload Successful",
        description: response.message || "Files uploaded successfully"
      });
    },
    onUploadError: (id, error) => {
      showErrorAlert({
        title: "Upload Failed",
        description: error
      });
    },
    onAllUploadsComplete: () => {
      // Refresh file list for the current order if dialog is open
      if (selectedOrder) {
        fetchOrderFiles(selectedOrder.id);
      }
    }
  });
  
  // Local component state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFiles, setOrderFiles] = useState<OrderFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<OrderFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Simple upload state for dialog compatibility
  const [isUploading, setIsUploading] = useState<{[orderId: string]: boolean}>({});
  const [uploadProgress, setUploadProgress] = useState<{[orderId: string]: number}>({});
  
  // Search and filter state (managed locally, applied via useOrders hook)
  const [searchTerm, setSearchTerm] = useState('');
  const [localFilters, setLocalFilters] = useState<{
    status?: OrderStatus;
    paymentMethod?: PaymentMethod;
    deliveryType?: DeliveryType;
    urgent?: boolean;
    assignedAgent?: string;
  }>({});

  // Sync local filters with main filters
  useEffect(() => {
    setFilters({
      search: searchTerm,
      status: localFilters.status,
      paymentMethod: localFilters.paymentMethod,
      deliveryType: localFilters.deliveryType,
      urgent: localFilters.urgent,
      agentId: localFilters.assignedAgent === 'unassigned' ? 'unassigned' : localFilters.assignedAgent
    });
  }, [searchTerm, localFilters, setFilters]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Calculate stats
  const stats: OrderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    urgent: orders.filter(o => o.urgent).length,
  };

  // Fetch order files from Firebase Storage
  const fetchOrderFiles = async (orderId: string) => {
    setFilesLoading(true);
    try {
      console.log('Fetching files for order:', orderId);
      const response = await fetch(`/api/orders/${orderId}/files`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('Files fetched successfully:', result);
        setOrderFiles(result.files || []);
      } else {
        // Get response text first to see what we actually received
        const responseText = await response.text();
        console.error('Error response text:', responseText);
        
        let errorResult;
        try {
          errorResult = JSON.parse(responseText);
        } catch {
          errorResult = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            details: responseText 
          };
        }
        
        console.error('Failed to fetch order files:', errorResult);
        toast({
          title: "Error",
          description: `Failed to fetch order files: ${errorResult.error || errorResult.details || 'Unknown error'}`,
          variant: "destructive",
        });
        setOrderFiles([]);
      }
    } catch (error) {
      console.error('Error fetching order files:', error);
      toast({
        title: "Error",
        description: `Network error: ${error instanceof Error ? error.message : 'Failed to fetch files'}`,
        variant: "destructive",
      });
      setOrderFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  // Download file (improved with proper URL fetching)
  const downloadFile = async (file: OrderFile) => {
    if (!selectedOrder) return;
    
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/files?fileId=${file.id}&action=download`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get file URL');
      }
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  // Preview file (improved with proper URL fetching)
  const previewFileFunc = async (file: OrderFile) => {
    if (!selectedOrder) return;
    
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/files?fileId=${file.id}&action=view`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get file URL');
      }
      
      setPreviewFile(file);
      setPreviewUrl(data.url);
    } catch (error) {
      console.error('Error loading file preview:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load file preview",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Close preview
  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl('');
  };

  // Download all files (now implemented with bulk download API)
  const downloadAllFiles = async (orderId: string) => {
    if (orderFiles.length === 0) return;
    
    try {
      toast({
        title: "Preparing Download",
        description: "Creating ZIP file with all order files...",
        variant: "default",
      });
      
      // Fetch the ZIP file from the bulk download API
      const response = await fetch(`/api/orders/${orderId}/files/bulk-download`);
      
      if (!response.ok) {
        let errorMessage = 'Failed to create download';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status} - ${response.statusText}`;
          }
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-${orderId}-files.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "All files are being downloaded as a ZIP archive",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download files",
        variant: "destructive",
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Group files by group name
  const groupedFiles = orderFiles.reduce((groups, file) => {
    const groupName = file.groupName || 'Default Group';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(file);
    return groups;
  }, {} as Record<string, OrderFile[]>);

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrder(orderId, { status });
      showSuccessAlert({
        title: "Status Updated",
        description: "Order status updated successfully"
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      showErrorAlert({
        title: "Update Failed",
        description: "Failed to update order status"
      });
    }
  };

  // Update delivery type
  const updateDeliveryType = async (orderId: string, deliveryType: 'own' | 'shiprocket') => {
    try {
      await updateOrder(orderId, { 
        delivery: { ...orders.find(o => o.id === orderId)?.delivery, type: deliveryType }
      });
      showSuccessAlert({
        title: "Delivery Updated",
        description: "Delivery type updated successfully"
      });
    } catch (error) {
      console.error('Error updating delivery type:', error);
      showErrorAlert({
        title: "Update Failed",
        description: "Failed to update delivery type"
      });
    }
  };

  // Handle order selection
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Use orders from useOrders hook instead of filteredOrders
      const selectableOrders = orders.filter(order => 
        !order.assignedAgentId && order.delivery?.type === 'own'
      );
      setSelectedOrders(new Set(selectableOrders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Bulk assign agent
  const handleBulkAssignAgent = async (agentId: string) => {
    try {
      const success = await bulkAssignAgent(Array.from(selectedOrders), agentId, 'admin');
      if (success) {
        setSelectedOrders(new Set());
        toast({
          title: "Success",
          description: `${selectedOrders.size} orders assigned successfully`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error bulk assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent to orders",
        variant: "destructive",
      });
    }
  };

  // Assign agent to order
  const handleAssignAgent = async (orderId: string, agentId: string) => {
    try {
      const success = await assignAgent(orderId, agentId, 'admin');
      if (success) {
        toast({
          title: "Success",
          description: "Agent assigned successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent",
        variant: "destructive",
      });
    }
  };

  // Unassign agent from order
  const handleUnassignAgent = async (orderId: string, reason?: string) => {
    try {
      const success = await unassignAgent(orderId, reason, 'admin');
      if (success) {
        toast({
          title: "Success",
          description: "Agent unassigned successfully",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error unassigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to unassign agent",
        variant: "destructive",
      });
    }
  };

  // Mark order as urgent
  const handleMarkUrgent = async (orderId: string, urgent: boolean) => {
    try {
      await updateOrder(orderId, { urgent });
      toast({
        title: "Success",
        description: `Order marked as ${urgent ? 'urgent' : 'normal'}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating urgent status:', error);
      toast({
        title: "Error",
        description: "Failed to update urgent status",
        variant: "destructive",
      });
    }
  };

  // Create shiprocket shipment
  const handleCreateShipment = async (orderId: string) => {
    // Implementation for Shiprocket API integration
    console.log('Creating shipment for order:', orderId);
  };

  // Get payment badge variant
  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  // Handle file upload to Firebase Storage
  const handleFileUpload = async (orderId: string, files: FileList) => {
    if (!files || files.length === 0) return;
    
    try {
      // Set local upload state for backward compatibility
      setIsUploading(prev => ({ ...prev, [orderId]: true }));
      setUploadProgress(prev => ({ ...prev, [orderId]: 0 }));
      
      // Convert FileList to File array
      const fileArray = Array.from(files);
      
      // Use the upload hook with custom form data builder
      await uploadFiles(
        fileArray,
        `/api/orders/${orderId}/files`,
        (files) => {
          const formData = new FormData();
          files.forEach(file => {
            formData.append('files', file);
          });
          formData.append('groupName', 'Admin Upload');
          return formData;
        }
      );
      
      // Update progress to complete
      setUploadProgress(prev => ({ ...prev, [orderId]: 100 }));
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [orderId]: 0 }));
      }, 1000);
      
    } catch (error: any) {
      console.error('Error uploading files:', error);
      showErrorAlert({
        title: "Upload Failed",
        description: error.message || "Failed to upload files"
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Main render starts here

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading orders...</p>
        </div>
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
            Manage customer orders, view uploaded files, and track deliveries
          </p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.size} selected
              </span>
              
              {/* Check if any selected orders can be assigned */}
              {Array.from(selectedOrders).some(orderId => {
                const order = orders.find(o => o.id === orderId);
                return order && !order.assignedAgentId && order.delivery?.type === 'own';
              }) && (
                <Select onValueChange={handleBulkAssignAgent}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Assign to agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter(agent => agent.status === 'available' || agent.status === 'busy').map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.first_name} {agent.last_name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({agent.assigned_orders_count || 0} orders)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Check if any selected orders have assigned agents */}
              {Array.from(selectedOrders).some(orderId => {
                const order = orders.find(o => o.id === orderId);
                return order && order.assignedAgentId;
              }) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const assignedOrderIds = Array.from(selectedOrders).filter(orderId => {
                      const order = orders.find(o => o.id === orderId);
                      return order && order.assignedAgentId;
                    });
                    
                    if (assignedOrderIds.length > 0) {
                      confirmAndExecute(
                        {
                          title: 'Bulk Unassign Agents',
                          message: `Are you sure you want to unassign agents from ${assignedOrderIds.length} selected orders?`,
                          confirmText: 'Yes, unassign all',
                          cancelText: 'Cancel',
                          type: 'warning'
                        },
                        async () => {
                          const success = await bulkUnassignAgent(assignedOrderIds, 'Bulk unassignment by admin');
                          if (success) {
                            setSelectedOrders(new Set());
                            toast({
                              title: "Success",
                              description: `${assignedOrderIds.length} orders unassigned successfully`,
                              variant: "default",
                            });
                          }
                        },
                        {
                          title: 'Agents Unassigned',
                          description: 'Selected orders have been successfully unassigned.'
                        },
                        {
                          title: 'Unassign Failed',
                          description: 'Failed to unassign agents from selected orders.'
                        }
                      );
                    }
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Unassign Selected
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedOrders(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
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
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
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
                setLocalFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as OrderStatus }))
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
                setLocalFilters(prev => ({ ...prev, paymentMethod: value === 'all' ? undefined : value as PaymentMethod }))
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
                setLocalFilters(prev => ({ ...prev, deliveryType: value === 'all' ? undefined : value as DeliveryType }))
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Agent</label>
              <Select value={filters.agentId || 'all'} onValueChange={(value) => 
                setLocalFilters(prev => ({ ...prev, agentId: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({agent.assigned_orders_count || 0})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filters.urgent ? "default" : "outline"}
              size="sm"
              onClick={() => setLocalFilters(prev => ({ ...prev, urgent: !prev.urgent || undefined }))}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Urgent Only
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalFilters(prev => ({ ...prev, agentId: 'unassigned' }))}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Unassigned Only
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
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        orders.filter(order => 
                          !order.assignedAgentId && order.delivery?.type === 'own'
                        ).length > 0 &&
                        orders.filter(order => 
                          !order.assignedAgentId && order.delivery?.type === 'own'
                        ).every(order => selectedOrders.has(order.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Delivery Type</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const canBeSelected = !order.assignedAgentId && order.delivery?.type === 'own';
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
                        {order.assignedAgentId ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-sm">
                                {agents.find(agent => agent.id === order.assignedAgentId)?.first_name}{' '}
                                {agents.find(agent => agent.id === order.assignedAgentId)?.last_name || 'Unknown'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {agents.find(agent => agent.id === order.assignedAgentId)?.phone || 
                                 agents.find(agent => agent.id === order.assignedAgentId)?.phone_number || 'No phone'}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Assigned
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                            {order.delivery?.type === 'own' && (
                              <Select onValueChange={(agentId) => handleAssignAgent(order.id, agentId)}>
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue placeholder="Assign..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {agents.filter(agent => agent.status === 'available' || agent.status === 'busy').map(agent => (
                                    <SelectItem key={agent.id} value={agent.id} className="text-xs">
                                      {agent.first_name} {agent.last_name}
                                      <span className="ml-2 text-muted-foreground">
                                        ({agent.assigned_orders_count || 0})
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={order.delivery?.type || 'own'} 
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
                          <Badge variant={getPaymentBadgeVariant(order.payment?.status || 'unknown')}>
                            {order.payment?.status || 'Unknown'}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {order.payment?.method || 'Unknown'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.totals?.total || order.total)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(
                          order.createdAt?.toDate ? order.createdAt.toDate() : 
                          order.createdAt || 
                          order.date
                        ).toLocaleDateString()}
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
                                previewFile={previewFileFunc}
                                formatFileSize={formatFileSize}
                                getFileIcon={getFileIcon}
                                formatCurrency={formatCurrency}
                                handleFileUpload={handleFileUpload}
                                isUploading={isUploading}
                                uploadProgress={uploadProgress}
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
                              {/* Agent Assignment Section */}
                              {!order.assignedAgentId && order.delivery?.type === 'own' && (
                                <>
                                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                    Assign to Agent
                                  </div>
                                  {agents.filter(agent => agent.status === 'available' || agent.status === 'busy').map(agent => (
                                    <DropdownMenuItem
                                      key={agent.id}
                                      onClick={() => handleAssignAgent(order.id, agent.id)}
                                      className="pl-4"
                                    >
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      {agent.first_name} {agent.last_name}
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        ({agent.assigned_orders_count || 0} orders)
                                      </span>
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              
                              {/* Unassign Agent Option */}
                              {order.assignedAgentId && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      confirmAndExecute(
                                        {
                                          title: 'Unassign Agent',
                                          message: `Are you sure you want to unassign the agent from order ${order.orderId || order.id}?`,
                                          confirmText: 'Yes, unassign',
                                          cancelText: 'Cancel',
                                          type: 'warning'
                                        },
                                        async () => {
                                          await handleUnassignAgent(order.id, 'Manual unassignment by admin');
                                        },
                                        {
                                          title: 'Agent Unassigned',
                                          description: 'Agent has been successfully unassigned from the order.'
                                        },
                                        {
                                          title: 'Unassign Failed',
                                          description: 'Failed to unassign the agent. Please try again.'
                                        }
                                      );
                                    }}
                                    className="text-orange-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Unassign Agent
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              
                              {order.delivery?.type === 'shiprocket' && !order.delivery?.shiprocket_shipment_id && (
                                <DropdownMenuItem onClick={() => handleCreateShipment(order.id)}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Create Shipment
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem onClick={() => handleMarkUrgent(order.id, !order.urgent)}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {order.urgent ? 'Remove Urgent' : 'Mark Urgent'}
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                onClick={() => {
                                  confirmAndExecute(
                                    {
                                      title: 'Delete Order',
                                      message: `Are you sure you want to delete order ${order.orderId || order.id}? This action cannot be undone.`,
                                      confirmText: 'Yes, delete it!',
                                      cancelText: 'Cancel',
                                      type: 'warning'
                                    },
                                    async () => {
                                      await deleteOrder(order.id);
                                    },
                                    {
                                      title: 'Order Deleted',
                                      description: `Order ${order.orderId || order.id} has been successfully deleted.`
                                    },
                                    {
                                      title: 'Delete Failed',
                                      description: 'Failed to delete the order. Please try again.'
                                    }
                                  );
                                }}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Order
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

          {orders.length === 0 && (
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

      {/* Enhanced File Preview Modal */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={closePreview}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  {getFileIcon(previewFile.type)}
                  <div className="flex flex-col items-start">
                    <span className="truncate max-w-[300px]">{previewFile.name}</span>
                    <span className="text-sm text-muted-foreground font-normal">
                      {formatFileSize(previewFile.size)} • {previewFile.type}
                    </span>
                  </div>
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {previewFile.type === 'application/pdf' && previewUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(previewUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(previewFile)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closePreview}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {previewLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading preview...</span>
                </div>
              ) : (
                <div className="h-full max-h-[75vh] overflow-auto border rounded-lg bg-gray-50">
                  {previewFile.type.startsWith('image/') ? (
                    <div className="p-4 flex justify-center">
                      <img 
                        src={previewUrl} 
                        alt={previewFile.name}
                        className="max-w-full h-auto shadow-lg rounded-lg"
                        style={{ maxHeight: '70vh' }}
                      />
                    </div>
                  ) : previewFile.type === 'application/pdf' ? (
                    <div className="w-full h-full min-h-[600px] bg-white">
                      <iframe
                        src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                        className="w-full h-full min-h-[600px] border-0"
                        title={previewFile.name}
                        allow="fullscreen"
                      />
                      {/* Fallback for browsers that don't support PDF viewing */}
                      <div className="hidden" id="pdf-fallback">
                        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                          <FileText className="h-16 w-16 mb-4 text-red-500" />
                          <h3 className="text-lg font-semibold mb-2">PDF Preview Not Available</h3>
                          <p className="text-muted-foreground mb-4">
                            Your browser doesn't support PDF viewing. Download the file to view it.
                          </p>
                          <Button
                            onClick={() => downloadFile(previewFile)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : previewFile.type.startsWith('text/') ? (
                    <div className="p-6">
                      <div className="bg-white border rounded-lg p-4 font-mono text-sm">
                        <iframe
                          src={previewUrl}
                          className="w-full h-96 border-0"
                          title={previewFile.name}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <FileText className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">Preview not available</p>
                      <p className="text-sm mb-2">{previewFile.type}</p>
                      <p className="text-sm mb-4 text-center max-w-md">
                        This file type cannot be previewed in the browser. Download the file to view its contents.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => downloadFile(previewFile)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download to view
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
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
  previewFile: (file: OrderFile) => Promise<void>;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (type: string) => any;
  formatCurrency: (amount: number) => string;
  handleFileUpload: (orderId: string, files: FileList) => Promise<void>;
  isUploading: {[orderId: string]: boolean};
  uploadProgress: {[orderId: string]: number};
}

function OrderDetailsDialog({ 
  order, 
  agents, 
  orderFiles, 
  filesLoading, 
  groupedFiles, 
  downloadFile, 
  downloadAllFiles,
  previewFile,
  formatFileSize, 
  getFileIcon, 
  formatCurrency,
  handleFileUpload,
  isUploading,
  uploadProgress
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
                <p>{new Date(
                  order.createdAt?.toDate ? order.createdAt.toDate() : 
                  order.createdAt || 
                  order.date
                ).toLocaleString()}</p>
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
                  {order.delivery?.type === 'own' ? 'Own Delivery' : 'Shiprocket'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Assigned Agent</label>
                <p>{getAssignedAgentName(order.assignedAgentId)}</p>
              </div>
              {order.delivery?.tracking_url && (
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
                <p>{order.payment?.method || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Status</label>
                <Badge className="ml-2">{order.payment?.status || 'Unknown'}</Badge>
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
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => previewFile(file)}
                                className="px-2"
                                title="Preview File"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(file)}
                                className="px-2"
                                title="Download File"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* File Upload Area */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Upload New Files</h4>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(order.id, e.target.files);
                        e.target.value = ''; // Reset input
                      }
                    }}
                    disabled={isUploading[order.id]}
                    className="hidden"
                    id={`file-upload-${order.id}`}
                  />
                  <label
                    htmlFor={`file-upload-${order.id}`}
                    className={`cursor-pointer ${isUploading[order.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isUploading[order.id] ? (
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      ) : (
                        <FolderOpen className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {isUploading[order.id] ? 'Uploading files...' : 'Click to upload files'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Support: Images, PDF, Word documents, Text files
                        </p>
                      </div>
                    </div>
                  </label>
                  
                  {/* Progress Bar */}
                  {isUploading[order.id] && uploadProgress[order.id] > 0 && (
                    <div className="mt-4">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[order.id]}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadProgress[order.id]}% complete
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                      <p className="font-medium">{(event.action || 'unknown_action').replace('_', ' ').toUpperCase()}</p>
                      <span className="text-sm text-muted-foreground">
                        {event.ts?.toDate ? event.ts.toDate().toLocaleString() : 'Unknown time'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">By: {event.actor || 'Unknown'}</p>
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
