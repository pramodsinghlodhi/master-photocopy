'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, MapPin, Phone, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { OrderWithDetails } from '@/types/order-management';
import { formatDistance, formatCurrency } from '@/lib/utils';

interface OrdersDashboardProps {
  agentId: string;
}

export function OrdersDashboard({ agentId }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  useEffect(() => {
    fetchAgentOrders();
  }, [agentId]);

  const fetchAgentOrders = async () => {
    try {
      const response = await fetch(`/api/admin/order-management?action=orders-with-details&agentId=${agentId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/order-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-assignment-status',
          orderId,
          agentId,
          status,
          notes
        })
      });

      if (response.ok) {
        fetchAgentOrders();
        setSelectedOrder(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
    }
  };

  const getOrderStatusBadge = (order: OrderWithDetails) => {
    if (order.assignment) {
      switch (order.assignment.status) {
        case 'assigned':
          return <Badge variant="outline">Assigned</Badge>;
        case 'accepted':
          return <Badge variant="default" className="bg-blue-500">Accepted</Badge>;
        case 'rejected':
          return <Badge variant="destructive">Rejected</Badge>;
        case 'completed':
          return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      }
    }
    return <Badge variant="outline">{order.status}</Badge>;
  };

  const getPriorityColor = (order: OrderWithDetails) => {
    if (order.urgent) return 'border-red-200 bg-red-50';
    return 'border-gray-200';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  const assignedOrders = orders.filter(order => 
    order.assignment?.status === 'assigned' || order.assignment?.status === 'accepted'
  );
  const completedOrders = orders.filter(order => order.assignment?.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{assignedOrders.length}</div>
                <div className="text-sm text-gray-600">Active Orders</div>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{completedOrders.length}</div>
                <div className="text-sm text-gray-600">Completed Today</div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.totals.total, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Your Orders
          </CardTitle>
          <CardDescription>
            Orders assigned to you for delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders assigned to you yet
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${getPriorityColor(order)}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{order.orderId}</span>
                        {getOrderStatusBadge(order)}
                        {order.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            URGENT
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Customer:</span>
                          {order.customer.first_name} {order.customer.last_name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {order.customer.phone_number}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {order.customer.address || 'Address not provided'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {order.items.length} items - {formatCurrency(order.totals.total)}
                        </div>
                        {order.assignment?.assignedAt && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Assigned: {order.assignment.assignedAt.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.assignment?.status === 'assigned' && (
                        <>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAssignmentStatus(order.id, 'accepted');
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              const reason = prompt('Reason for rejection:');
                              if (reason) {
                                updateAssignmentStatus(order.id, 'rejected', reason);
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {order.assignment?.status === 'accepted' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Mark this order as completed?')) {
                              updateAssignmentStatus(order.id, 'completed', 'Order delivered successfully');
                            }
                          }}
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal/Sidebar could be added here */}
      {selectedOrder && (
        <Card className="fixed inset-4 z-50 overflow-auto bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Details - #{selectedOrder.orderId}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Detailed order information could be displayed here */}
            <div className="text-sm">
              <strong>Customer:</strong> {selectedOrder.customer.first_name} {selectedOrder.customer.last_name}
            </div>
            <div className="text-sm">
              <strong>Phone:</strong> {selectedOrder.customer.phone_number}
            </div>
            <div className="text-sm">
              <strong>Address:</strong> {selectedOrder.customer.address || 'Not provided'}
            </div>
            <div className="text-sm">
              <strong>Items:</strong>
            </div>
            <ul className="text-sm space-y-1 ml-4">
              {selectedOrder.items.map((item, index) => (
                <li key={index}>
                  {item.name} - {item.quantity || 1}x - {formatCurrency(item.price)}
                </li>
              ))}
            </ul>
            <div className="text-sm">
              <strong>Total:</strong> {formatCurrency(selectedOrder.totals.total)}
            </div>
            {selectedOrder.assignment?.notes && (
              <div className="text-sm">
                <strong>Notes:</strong> {selectedOrder.assignment.notes}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}