'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import { Order, Agent, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { AgentAttendance } from './agent-attendance';
import { CODReports } from './cod-reports';
import { 
  Package, 
  MapPin, 
  Phone, 
  Camera, 
  CheckCircle, 
  Clock,
  Truck,
  AlertTriangle,
  Upload,
  Eye,
  Navigation,
  MessageCircle,
  XCircle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AgentDashboardProps {
  agent: Agent;
  onLogout: () => void;
}

export function AgentDashboard({ agent, onLogout }: AgentDashboardProps) {
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [customerOTP, setCustomerOTP] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !agent?.agentId) return;

    // Subscribe to assigned orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('assignedAgentId', '==', agent.agentId),
      where('status', 'in', ['Processing', 'Shipped', 'Out for Delivery'])
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setAssignedOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [agent?.agentId]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    try {
      setUpdatingStatus(orderId);
      
      if (!db) return;

      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = {
        status,
        updatedAt: new Date(),
        timeline: [...(selectedOrder?.timeline || []), {
          ts: new Date(),
          actor: `${agent.first_name} ${agent.last_name}`,
          action: 'status_update',
          note: note || `Status updated to ${status}`
        }]
      };

      // If marking as delivered and OTP is provided, validate it
      if (status === 'Delivered' && customerOTP) {
        // Here you would call a Cloud Function to validate the OTP
        // For now, we'll just include it in the update
        updateData.deliveryOTP = customerOTP;
      }

      await updateDoc(orderRef, updateData);

      toast({
        title: "Status Updated",
        description: `Order has been marked as ${status}.`
      });

      setSelectedOrder(null);
      setCustomerOTP('');
      setDeliveryNote('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const uploadProofOfDelivery = async () => {
    if (!proofFile || !selectedOrder) return null;

    try {
      // In a real app, you would upload to Firebase Storage
      // For now, we'll simulate the upload
      const fakeUrl = `https://example.com/proof/${Date.now()}_${proofFile.name}`;
      
      toast({
        title: "Proof Uploaded",
        description: "Delivery proof has been uploaded successfully."
      });

      return fakeUrl;
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload delivery proof.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;

    try {
      // Upload proof if provided
      let proofUrl = null;
      if (proofFile) {
        proofUrl = await uploadProofOfDelivery();
      }

      // For own delivery, require OTP
      if (selectedOrder.delivery.type === 'own' && !customerOTP) {
        toast({
          title: "OTP Required",
          description: "Please enter the customer's delivery OTP.",
          variant: "destructive"
        });
        return;
      }

      const note = `Delivered by ${agent.first_name} ${agent.last_name}${deliveryNote ? `. Note: ${deliveryNote}` : ''}${proofUrl ? `. Proof: ${proofUrl}` : ''}`;
      
      await updateOrderStatus(selectedOrder.id, 'Delivered', note);
      setProofFile(null);
    } catch (error) {
      console.error('Error marking as delivered:', error);
    }
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'Processing': return 'secondary';
      case 'Shipped': return 'default';
      case 'Out for Delivery': return 'default';
      case 'Delivered': return 'default';
      case 'Not Delivered': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    // Try to open in Google Maps app first, fallback to web
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  };

  const callCustomer = (phoneNumber: string) => {
    // Remove any non-digit characters except +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="bg-blue-600 dark:bg-blue-800 text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  {agent.first_name} {agent.last_name}
                </h1>
                <p className="text-sm text-blue-100 dark:text-blue-200">Delivery Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm"
                onClick={onLogout}
                className="text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="reports">COD Reports</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>          <TabsContent value="orders" className="space-y-4 mt-4">
            {/* Orders Content */}
            {renderOrdersContent()}
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4 mt-4">
            <AgentAttendance agent={agent} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 mt-4">
            {renderReportsContent()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  function renderOrdersContent() {
    return (
      <>
        {/* Statistics Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{assignedOrders.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {assignedOrders.filter(o => o.status === 'Processing').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out for Delivery</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {assignedOrders.filter(o => o.status === 'Out for Delivery').length}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Urgent</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {assignedOrders.filter(o => o.urgent).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List - Mobile Optimized */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Orders ({assignedOrders.length})
            </h2>
          </div>

          {assignedOrders.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-8 text-center">
                <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Orders Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Orders will appear here when assigned to you
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignedOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`bg-white dark:bg-gray-800 shadow-sm border-l-4 ${
                    order.urgent 
                      ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' 
                      : order.status === 'Out for Delivery'
                      ? 'border-l-green-500'
                      : order.status === 'Not Delivered'
                      ? 'border-l-red-500'
                      : 'border-l-blue-500'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {order.orderId || order.id}
                        </span>
                        {order.urgent && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge 
                          variant={getStatusBadgeVariant(order.status)}
                          className={
                            order.status === 'Processing' ? 'bg-orange-100 text-orange-800' :
                            order.status === 'Out for Delivery' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(order.totals?.total || order.total)}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {order.customer.first_name} {order.customer.last_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.payment.method} • {order.payment.status}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => callCustomer(order.customer.phone_number || order.customer.phone || '')}
                            className="h-8 w-8 p-0 border-green-200 hover:bg-green-50 dark:border-green-600 dark:hover:bg-green-900"
                          >
                            <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openMaps(order.customer.address || 'Address not available')}
                            className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50 dark:border-blue-600 dark:hover:bg-blue-900"
                          >
                            <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {order.customer.address || 'Address not provided'}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Items:</p>
                      {order.items.map((item, index) => (
                        <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          {item.quantity || 1}x {item.name} - {formatCurrency(item.price)}
                        </p>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Order Details - {order.orderId || order.id}</DialogTitle>
                          </DialogHeader>
                          <OrderDetailsDialog 
                            order={order} 
                            onUpdateStatus={updateOrderStatus}
                            isUpdating={updatingStatus === order.id}
                          />
                        </DialogContent>
                      </Dialog>

                      {order.status === 'Processing' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'Out for Delivery', 'Order picked up for delivery')}
                          disabled={updatingStatus === order.id}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          {updatingStatus === order.id ? 'Updating...' : 'Pick Up'}
                        </Button>
                      )}

                      {order.status === 'Out for Delivery' && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Deliver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Mark as Delivered</DialogTitle>
                              </DialogHeader>
                              <DeliveryConfirmationDialog
                                order={order}
                                onConfirm={handleMarkDelivered}
                                customerOTP={customerOTP}
                                setCustomerOTP={setCustomerOTP}
                                deliveryNote={deliveryNote}
                                setDeliveryNote={setDeliveryNote}
                                proofFile={proofFile}
                                setProofFile={setProofFile}
                                isUpdating={updatingStatus === order.id}
                              />
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'Not Delivered', 'Customer not available or other issue')}
                            disabled={updatingStatus === order.id}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Not Delivered
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  function renderReportsContent() {
    return <CODReports agent={agent} />;
  }
}

function OrderDetailsDialog({ 
  order, 
  onUpdateStatus, 
  isUpdating 
}: { 
  order: Order; 
  onUpdateStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  isUpdating: boolean;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
                <p>{order.customer.address || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge className="ml-2">{order.status}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Payment</label>
                <p>{order.payment.method} - {order.payment.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Total</label>
                <p className="font-bold text-lg">{formatCurrency(order.totals?.total || order.total)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Urgent</label>
                <Badge variant={order.urgent ? "destructive" : "secondary"} className="ml-2">
                  {order.urgent ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="items" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity || 1}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
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

function DeliveryConfirmationDialog({
  order,
  onConfirm,
  customerOTP,
  setCustomerOTP,
  deliveryNote,
  setDeliveryNote,
  proofFile,
  setProofFile,
  isUpdating
}: {
  order: Order;
  onConfirm: () => void;
  customerOTP: string;
  setCustomerOTP: (value: string) => void;
  deliveryNote: string;
  setDeliveryNote: (value: string) => void;
  proofFile: File | null;
  setProofFile: (file: File | null) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Please ensure the customer has received their order before marking as delivered.
        </p>
      </div>

      {order.delivery.type === 'own' && (
        <div className="space-y-2">
          <Label htmlFor="customerOTP">Customer Delivery OTP *</Label>
          <Input
            id="customerOTP"
            type="text"
            placeholder="Enter 6-digit OTP from customer"
            value={customerOTP}
            onChange={(e) => setCustomerOTP(e.target.value)}
            maxLength={6}
            className="text-center text-lg tracking-widest"
          />
          <p className="text-xs text-muted-foreground">
            The customer should have received this OTP when the order was marked as "Out for Delivery"
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="deliveryNote">Delivery Note (Optional)</Label>
        <Textarea
          id="deliveryNote"
          placeholder="Add any notes about the delivery..."
          value={deliveryNote}
          onChange={(e) => setDeliveryNote(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="proofFile">Proof of Delivery (Optional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="proofFile"
            type="file"
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="flex-1"
          />
          {proofFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProofFile(null)}
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a photo as proof of delivery (customer signature, delivered package, etc.)
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={onConfirm}
          disabled={
            isUpdating || 
            (order.delivery.type === 'own' && customerOTP.length !== 6)
          }
          className="flex-1"
        >
          {isUpdating ? 'Confirming...' : 'Confirm Delivery'}
        </Button>
      </div>
    </div>
  );
}
