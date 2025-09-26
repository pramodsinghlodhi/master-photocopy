import * as admin from "firebase-admin";
import { shiprocketService } from "./shiprocketService";
import { PushNotificationService } from "./pushNotificationService";

export class OrderManagementService {
  private db = admin.firestore();
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = new PushNotificationService();
  }

  // Create new order with comprehensive validation
  async createOrder(orderData: any): Promise<any> {
    try {
      // Validate required fields
      if (!orderData.customer || !orderData.items || !orderData.totals) {
        throw new Error('Missing required order data: customer, items, and totals are required');
      }

      const orderId = this.generateOrderId();
      
      // Ensure proper data structure
      const currentTimestamp = new Date();
      const order = {
        id: orderId,
        orderId: orderId,
        ...orderData,
        status: 'Pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        timeline: [
          {
            ts: currentTimestamp,
            actor: 'system',
            action: 'Order created',
            note: 'Order submitted successfully'
          }
        ],
        // Ensure proper payment structure
        payment: {
          method: orderData.payment?.method || 'COD',
          status: 'Pending',
          ...orderData.payment
        },
        // Ensure proper delivery structure
        delivery: {
          type: orderData.delivery?.type || 'own',
          ...orderData.delivery
        },
        // Processing flags
        processing: {
          aiAnalysisComplete: false,
          filesProcessed: false,
          readyForPrint: false
        }
      };

      // Save order to Firestore
      await this.db.collection('orders').doc(orderId).set(order);
      
      // Create order summary for notifications
      const orderSummary = {
        orderId,
        customerName: `${order.customer.first_name} ${order.customer.last_name}`,
        itemCount: order.items.length,
        total: order.totals.total,
        paymentMethod: order.payment.method
      };
      
      // Send confirmation notification
      try {
        await this.pushService.sendOrderConfirmation(orderSummary);
      } catch (notificationError) {
        console.error('Order confirmation notification failed:', notificationError);
        // Don't fail order creation for notification errors
      }
      
      // Auto-assign if criteria are met
      try {
        await this.autoAssignOrder(orderId);
      } catch (assignmentError) {
        console.error('Auto-assignment failed:', assignmentError);
        // Continue without failing order creation
      }
      
      return { 
        success: true, 
        orderId, 
        order: {
          ...order,
          // Return formatted timestamps for frontend
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Log error for debugging
      await this.logOrderError('order_creation_failed', {
        orderData,
        error: error.message
      });
      
      throw new Error(`Order creation failed: ${error.message}`);
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<any> {
    try {
      const updateData: any = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (notes) {
        updateData.statusNotes = notes;
      }

      // Add status history with regular timestamp
      const currentTimestamp = new Date();
      updateData[`statusHistory.${Date.now()}`] = {
        status,
        timestamp: currentTimestamp,
        notes
      };

      await this.db.collection('orders').doc(orderId).update(updateData);
      
      // Get updated order
      const orderDoc = await this.db.collection('orders').doc(orderId).get();
      const order = orderDoc.data();
      
      // Send status update notification
      if (order) {
        await this.pushService.sendStatusUpdate({ orderId, ...order });
      }
      
      // Handle status-specific actions
      await this.handleStatusChange(orderId, status, order);
      
      return { success: true, orderId, status };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Handle status-specific actions
  private async handleStatusChange(orderId: string, status: string, order: any): Promise<void> {
    switch (status) {
      case 'Processing':
        await this.startProcessing(orderId, order);
        break;
      case 'Printed':
        await this.handlePrinted(orderId, order);
        break;
      case 'Shipped':
        await this.handleShipped(orderId, order);
        break;
      case 'Delivered':
        await this.handleDelivered(orderId, order);
        break;
      case 'Cancelled':
        await this.handleCancelled(orderId, order);
        break;
    }
  }

  // Start processing order
  private async startProcessing(orderId: string, order: any): Promise<void> {
    // Calculate estimated completion time
    const estimatedTime = this.calculateEstimatedTime(order);
    
    await this.db.collection('orders').doc(orderId).update({
      estimatedCompletion: new Date(Date.now() + estimatedTime),
      processingStarted: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Handle printed status
  private async handlePrinted(orderId: string, order: any): Promise<void> {
    // Auto-assign delivery if own delivery
    if (order.delivery_option === 'own_delivery') {
      await this.autoAssignDelivery(orderId, order);
    } else if (order.delivery_option === 'shiprocket') {
      // Create Shiprocket order
      await this.createShiprocketOrder(orderId, order);
    }
  }

  // Handle shipped status
  private async handleShipped(orderId: string, order: any): Promise<void> {
    // Update tracking information
    if (order.delivery_option === 'shiprocket' && order.shiprocket_order_id) {
      // Update tracking information - implement tracking call
      // const trackingInfo = await shiprocketService.getTrackingInfo(order.shiprocket_order_id);
      
      await this.db.collection('orders').doc(orderId).update({
        shippedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // Handle delivered status
  private async handleDelivered(orderId: string, order: any): Promise<void> {
    await this.db.collection('orders').doc(orderId).update({
      deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
      completed: true
    });
    
    // Update agent performance if own delivery
    if (order.assigned_agent_id) {
      await this.updateAgentPerformance(order.assigned_agent_id, 'delivery_completed');
    }
    
    // Send feedback request (delayed)
    setTimeout(async () => {
      await this.sendFeedbackRequest(orderId, order);
    }, 2 * 60 * 60 * 1000); // 2 hours delay
  }

  // Handle cancelled status
  private async handleCancelled(orderId: string, order: any): Promise<void> {
    // Process refund if payment was made
    if (order.payment_status === 'paid') {
      await this.processRefund(orderId, order);
    }
    
    // Release assigned agent
    if (order.assigned_agent_id) {
      await this.releaseAgent(order.assigned_agent_id);
    }
  }

  // Auto-assign order to agent
  async autoAssignOrder(orderId: string): Promise<void> {
    try {
      const orderDoc = await this.db.collection('orders').doc(orderId).get();
      const order = orderDoc.data();
      
      if (!order || order.assigned_agent_id) return;
      
      // Only auto-assign for own delivery
      if (order.delivery_option !== 'own_delivery') return;
      
      // Find available agent
      const agent = await this.findBestAgent(order);
      
      if (agent) {
        await this.assignAgent(orderId, agent.uid);
      }
    } catch (error: any) {
      console.error('Error auto-assigning order:', error);
    }
  }

  // Find best available agent
  private async findBestAgent(order: any): Promise<any> {
    const agentsSnapshot = await this.db.collection('agents')
      .where('status', '==', 'available')
      .where('approved', '==', true)
      .get();
    
    if (agentsSnapshot.empty) return null;
    
    const agents = agentsSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    // Simple assignment - can be enhanced with location-based logic
    return agents[Math.floor(Math.random() * agents.length)];
  }

  // Assign agent to order
  async assignAgent(orderId: string, agentId: string): Promise<any> {
    try {
      const batch = this.db.batch();
      
      // Update order
      const orderRef = this.db.collection('orders').doc(orderId);
      batch.update(orderRef, {
        assigned_agent_id: agentId,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update agent status
      const agentRef = this.db.collection('agents').doc(agentId);
      batch.update(agentRef, {
        status: 'assigned',
        current_order_id: orderId,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      // Get order and agent details
      const [orderDoc, agentDoc] = await Promise.all([
        this.db.collection('orders').doc(orderId).get(),
        this.db.collection('agents').doc(agentId).get()
      ]);
      
      const order = orderDoc.data();
      const agent = agentDoc.data();
      
      // Send assignment notifications
      if (order && agent) {
        await this.pushService.sendAgentAssignment({
          orderId,
          agentId,
          customer: order.customer,
          agent
        });
      }
      
      return { success: true, orderId, agentId };
    } catch (error: any) {
      console.error('Error assigning agent:', error);
      throw error;
    }
  }

  // Auto-assign delivery
  private async autoAssignDelivery(orderId: string, order: any): Promise<void> {
    if (!order.assigned_agent_id) {
      await this.autoAssignOrder(orderId);
    }
    
    // Send delivery assignment notification
    await this.pushService.sendDeliveryAssignment({
      orderId,
      customer: order.customer
    });
  }

  // Create Shiprocket order
  private async createShiprocketOrder(orderId: string, order: any): Promise<void> {
    try {
      const shiprocketResult = await shiprocketService.createShipment({
        orderId
      });
      
      if (shiprocketResult.success) {
        // Update order with Shiprocket details
        await this.db.collection('orders').doc(orderId).update({
          shiprocket_shipment_id: shiprocketResult.shipmentId,
          tracking_url: shiprocketResult.trackingUrl,
          shiprocketCreatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update status to shipped
        await this.updateOrderStatus(orderId, 'Shipped');
      } else {
        throw new Error(shiprocketResult.error || 'Failed to create Shiprocket order');
      }
      
    } catch (error: any) {
      console.error('Error creating Shiprocket order:', error);
      // Fallback to own delivery
      await this.db.collection('orders').doc(orderId).update({
        delivery_option: 'own_delivery',
        shiprocket_error: error.message
      });
      await this.autoAssignDelivery(orderId, order);
    }
  }

  // Calculate estimated completion time
  private calculateEstimatedTime(order: any): number {
    let baseTime = 30 * 60 * 1000; // 30 minutes base
    
    const totalPages = order.items.reduce((sum: number, item: any) => 
      sum + (item.pages * item.quantity), 0);
    
    // Add time based on pages
    baseTime += totalPages * 2 * 60 * 1000; // 2 minutes per page
    
    // Add time for color printing
    const hasColor = order.items.some((item: any) => item.color_option === 'color');
    if (hasColor) {
      baseTime += 15 * 60 * 1000; // 15 minutes extra for color
    }
    
    // Add time for binding
    const hasBinding = order.items.some((item: any) => 
      item.binding_option && item.binding_option !== 'none');
    if (hasBinding) {
      baseTime += 10 * 60 * 1000; // 10 minutes for binding
    }
    
    return baseTime;
  }

  // Bulk update orders
  async bulkUpdateOrders(orderIds: string[], updates: any): Promise<any> {
    try {
      const batch = this.db.batch();
      
      orderIds.forEach(orderId => {
        const orderRef = this.db.collection('orders').doc(orderId);
        batch.update(orderRef, {
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      return { success: true, updated: orderIds.length };
    } catch (error: any) {
      console.error('Error bulk updating orders:', error);
      throw error;
    }
  }

  // Get order analytics
  async getOrderAnalytics(dateRange: any): Promise<any> {
    try {
      const { startDate, endDate } = dateRange;
      
      const ordersSnapshot = await this.db.collection('orders')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();
      
      const orders = ordersSnapshot.docs.map(doc => doc.data());
      
      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.totals?.total || 0), 0),
        statusBreakdown: this.getStatusBreakdown(orders),
        averageOrderValue: orders.length > 0 ? 
          orders.reduce((sum, order) => sum + (order.totals?.total || 0), 0) / orders.length : 0,
        deliveryBreakdown: this.getDeliveryBreakdown(orders),
        hourlyDistribution: this.getHourlyDistribution(orders),
        topItems: this.getTopItems(orders)
      };
      
      return analytics;
    } catch (error: any) {
      console.error('Error getting order analytics:', error);
      throw error;
    }
  }

  // Generate order ID
  private generateOrderId(): string {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  // Helper methods for analytics
  private getStatusBreakdown(orders: any[]): any {
    const breakdown: any = {};
    orders.forEach(order => {
      breakdown[order.status] = (breakdown[order.status] || 0) + 1;
    });
    return breakdown;
  }

  private getDeliveryBreakdown(orders: any[]): any {
    const breakdown: any = {};
    orders.forEach(order => {
      const option = order.delivery_option || 'unknown';
      breakdown[option] = (breakdown[option] || 0) + 1;
    });
    return breakdown;
  }

  private getHourlyDistribution(orders: any[]): any {
    const distribution: any = {};
    orders.forEach(order => {
      if (order.createdAt && order.createdAt.toDate) {
        const hour = order.createdAt.toDate().getHours();
        distribution[hour] = (distribution[hour] || 0) + 1;
      }
    });
    return distribution;
  }

  private getTopItems(orders: any[]): any[] {
    const itemCount: any = {};
    
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const key = `${item.color_option}-${item.print_option}`;
          itemCount[key] = (itemCount[key] || 0) + item.quantity;
        });
      }
    });
    
    return Object.entries(itemCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([item, count]) => ({ item, count }));
  }

  // Update agent performance
  private async updateAgentPerformance(agentId: string, action: string): Promise<void> {
    if (!agentId) return;

    // Check if agent exists first
    const agentDoc = await this.db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists) {
      console.warn(`Agent ${agentId} does not exist, skipping performance update`);
      return;
    }

    const updates: any = {};
    
    switch (action) {
      case 'delivery_completed':
        updates[`performance.deliveries_completed`] = admin.firestore.FieldValue.increment(1);
        break;
      case 'order_assigned':
        updates[`performance.orders_assigned`] = admin.firestore.FieldValue.increment(1);
        break;
    }
    
    if (Object.keys(updates).length > 0) {
      await this.db.collection('agents').doc(agentId).update(updates);
    }
  }

  // Release agent from current assignment
  private async releaseAgent(agentId: string): Promise<void> {
    if (!agentId) return;

    // Check if agent exists first
    const agentDoc = await this.db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists) {
      console.warn(`Agent ${agentId} does not exist, skipping release`);
      return;
    }

    await this.db.collection('agents').doc(agentId).update({
      status: 'available',
      current_order_id: admin.firestore.FieldValue.delete(),
      assignedAt: admin.firestore.FieldValue.delete()
    });
  }

  // Process refund
  private async processRefund(orderId: string, order: any): Promise<void> {
    // Implement refund logic here
    console.log(`Processing refund for order ${orderId}`);
  }

  // Send feedback request
  private async sendFeedbackRequest(orderId: string, order: any): Promise<void> {
    // Implement feedback request logic
    console.log(`Sending feedback request for order ${orderId}`);
  }

  // Log order errors for debugging
  private async logOrderError(errorType: string, details: any): Promise<void> {
    try {
      await this.db.collection('order_errors').add({
        error_type: errorType,
        details,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (loggingError) {
      console.error('Failed to log order error:', loggingError);
    }
  }
}
