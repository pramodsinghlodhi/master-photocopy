import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/lib/types';
import { Agent } from '@/app/api/agents/route';

export interface OrderFilters {
  search?: string;
  status?: string;
  paymentMethod?: string;
  deliveryType?: string;
  urgent?: boolean;
  agentId?: string;
}

export interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  lastDocId?: string | null;
}

interface UseOrdersReturn {
  orders: Order[];
  agents: Agent[];
  loading: boolean;
  error: string | null;
  pagination: PaginationData;
  filters: OrderFilters;
  setFilters: (filters: OrderFilters) => void;
  fetchOrders: (resetPagination?: boolean) => Promise<void>;
  fetchAgents: () => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<boolean>;
  bulkUpdateOrders: (orderIds: string[], action: string, data: any) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
  createOrder: (orderData: Partial<Order>) => Promise<boolean>;
  assignAgent: (orderId: string, agentId: string, assignedBy?: string) => Promise<boolean>;
  unassignAgent: (orderId: string, reason?: string, unassignedBy?: string) => Promise<boolean>;
  bulkAssignAgent: (orderIds: string[], agentId: string, assignedBy?: string) => Promise<boolean>;
  bulkUnassignAgent: (orderIds: string[], reason?: string, unassignedBy?: string) => Promise<boolean>;
  refetch: () => void;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    lastDocId: null
  });
  const [filters, setFilters] = useState<OrderFilters>({});

  const fetchOrders = useCallback(async (resetPagination = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (resetPagination) {
        params.set('page', '1');
        params.set('limit', '50');
      } else {
        // Use current state values without dependencies
        setPagination(currentPagination => {
          params.set('page', currentPagination.page.toString());
          params.set('limit', currentPagination.pageSize.toString());
          if (currentPagination.lastDocId) {
            params.set('lastDocId', currentPagination.lastDocId);
          }
          return currentPagination;
        });
      }

      // Use current filter values without dependencies
      setFilters(currentFilters => {
        if (currentFilters.status) params.set('status', currentFilters.status);
        if (currentFilters.paymentMethod) params.set('paymentMethod', currentFilters.paymentMethod);
        if (currentFilters.deliveryType) params.set('deliveryType', currentFilters.deliveryType);
        if (currentFilters.urgent !== undefined) params.set('urgent', currentFilters.urgent.toString());
        if (currentFilters.agentId) params.set('agentId', currentFilters.agentId);
        return currentFilters;
      });

      const response = await fetch(`/api/orders?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      if (resetPagination) {
        setOrders(result.data.orders);
      } else {
        // For pagination, append new orders
        setOrders(prev => [...prev, ...result.data.orders]);
      }
      
      setPagination(result.data.pagination);

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents?active=true');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch agents');
      }

      setAgents(result.data);
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      // Don't set main error for agents fetch failure
    }
  }, []);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update order');
      }

      // Optimistically update the local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, ...result.data }
            : order
        )
      );

      return true;
    } catch (err: any) {
      console.error('Error updating order:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const bulkUpdateOrders = useCallback(async (orderIds: string[], action: string, data: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/orders/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, orderIds, data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform bulk action');
      }

      // Refetch orders to get updated data
      await fetchOrders(true);

      return true;
    } catch (err: any) {
      console.error('Error performing bulk action:', err);
      setError(err.message);
      return false;
    }
  }, [fetchOrders]);

  const deleteOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete order');
      }

      // Remove from local state
      setOrders(prev => prev.filter(order => order.id !== orderId));

      return true;
    } catch (err: any) {
      console.error('Error deleting order:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const createOrder = useCallback(async (orderData: Partial<Order>): Promise<boolean> => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Add to local state
      setOrders(prev => [result.data, ...prev]);

      return true;
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const assignAgent = useCallback(async (orderId: string, agentId: string, assignedBy = 'admin'): Promise<boolean> => {
    try {
      const response = await fetch('/api/orders/assign-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, agentId, assignedBy }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign agent');
      }

      // Update the local state with the updated order
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, ...result.data.order }
            : order
        )
      );

      // Update agent status in local state
      setAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? { ...agent, status: 'busy', assigned_orders_count: (agent.assigned_orders_count || 0) + 1 }
            : agent
        )
      );

      return true;
    } catch (err: any) {
      console.error('Error assigning agent:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const unassignAgent = useCallback(async (orderId: string, reason?: string, unassignedBy = 'admin'): Promise<boolean> => {
    try {
      const response = await fetch('/api/orders/unassign-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, reason, unassignedBy }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unassign agent');
      }

      // Update the local state with the updated order
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, ...result.data.order }
            : order
        )
      );

      // Update agent status in local state
      if (result.data.previousAgent?.id) {
        setAgents(prev =>
          prev.map(agent =>
            agent.id === result.data.previousAgent.id
              ? { ...agent, status: 'available', assigned_orders_count: Math.max((agent.assigned_orders_count || 1) - 1, 0) }
              : agent
          )
        );
      }

      return true;
    } catch (err: any) {
      console.error('Error unassigning agent:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const bulkAssignAgent = useCallback(async (orderIds: string[], agentId: string, assignedBy = 'admin'): Promise<boolean> => {
    try {
      const response = await fetch('/api/orders/assign-agent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds, agentId, assignedBy }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk assign agent');
      }

      // Refetch orders to get updated data
      await fetchOrders(true);
      await fetchAgents();

      return true;
    } catch (err: any) {
      console.error('Error bulk assigning agent:', err);
      setError(err.message);
      return false;
    }
  }, [fetchOrders, fetchAgents]);

  const bulkUnassignAgent = useCallback(async (orderIds: string[], reason?: string, unassignedBy = 'admin'): Promise<boolean> => {
    try {
      const response = await fetch('/api/orders/unassign-agent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds, reason, unassignedBy }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk unassign agents');
      }

      // Refetch orders to get updated data
      await fetchOrders(true);
      await fetchAgents();

      return true;
    } catch (err: any) {
      console.error('Error bulk unassigning agents:', err);
      setError(err.message);
      return false;
    }
  }, [fetchOrders, fetchAgents]);

  const refetch = useCallback(() => {
    fetchOrders(true);
    fetchAgents();
  }, [fetchOrders, fetchAgents]);

  // Filter orders locally by search term
  const filteredOrders = orders.filter(order => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      order.id.toLowerCase().includes(search) ||
      order.orderId?.toLowerCase().includes(search) ||
      order.customer?.first_name?.toLowerCase().includes(search) ||
      order.customer?.last_name?.toLowerCase().includes(search) ||
      order.customer?.phone_number?.includes(search) ||
      order.customer?.phone?.includes(search)
    );
  });

  // Initial load
  useEffect(() => {
    fetchOrders(true);
    fetchAgents();
  }, []);

  // Refetch when filters change (except search)
  useEffect(() => {
    fetchOrders(true);
  }, [filters.status, filters.paymentMethod, filters.deliveryType, filters.urgent, filters.agentId]);

  return {
    orders: filteredOrders,
    agents,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    fetchOrders,
    fetchAgents,
    updateOrder,
    bulkUpdateOrders,
    deleteOrder,
    createOrder,
    assignAgent,
    unassignAgent,
    bulkAssignAgent,
    bulkUnassignAgent,
    refetch
  };
}