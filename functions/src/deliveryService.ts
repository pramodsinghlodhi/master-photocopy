import * as admin from "firebase-admin";
import { shiprocketService } from "./shiprocketService";
import { PushNotificationService } from "./pushNotificationService";

export class DeliveryService {
  private db = admin.firestore();
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = new PushNotificationService();
  }

  // Create delivery assignment
  async createDeliveryAssignment(data: any): Promise<any> {
    try {
      const { orderId, delivery_option, agent_id, notes } = data;
      
      const assignmentData: any = {
        orderId,
        delivery_option,
        agent_id: agent_id || null,
        status: 'assigned',
        notes: notes || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (delivery_option === 'own_delivery') {
        if (!agent_id) {
          // Auto-assign available agent
          const agent = await this.findAvailableAgent(orderId);
          if (agent) {
            assignmentData.agent_id = agent.id;
          } else {
            assignmentData.status = 'pending_agent';
          }
        }
        
        // Update agent status if assigned
        if (assignmentData.agent_id) {
          await this.assignAgentToDelivery(assignmentData.agent_id, orderId);
        }
      } else if (delivery_option === 'shiprocket') {
        // Create Shiprocket shipment
        const shiprocketResult = await shiprocketService.createShipment({ orderId });
        
        if (shiprocketResult.success) {
          assignmentData.shiprocket_shipment_id = shiprocketResult.shipmentId;
          assignmentData.tracking_url = shiprocketResult.trackingUrl;
          assignmentData.status = 'shipped';
        } else {
          // Fallback to own delivery
          assignmentData.delivery_option = 'own_delivery';
          assignmentData.shiprocket_error = shiprocketResult.error;
          assignmentData.status = 'pending_agent';
        }
      }
      
      // Create assignment record
      const assignmentRef = await this.db.collection('delivery_assignments').add(assignmentData);
      
      // Update order
      await this.db.collection('orders').doc(orderId).update({
        delivery_assignment_id: assignmentRef.id,
        delivery_option: assignmentData.delivery_option,
        assigned_agent_id: assignmentData.agent_id,
        delivery_status: assignmentData.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Send notifications
      await this.sendAssignmentNotifications(orderId, assignmentData);
      
      return { 
        success: true, 
        assignmentId: assignmentRef.id,
        assignment: assignmentData
      };
    } catch (error: any) {
      console.error('Error creating delivery assignment:', error);
      throw error;
    }
  }

  // Update delivery status
  async updateDeliveryStatus(assignmentId: string, status: string, data: any = {}): Promise<any> {
    try {
      const updateData = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...data
      };
      
      // Add status history
      updateData[`statusHistory.${Date.now()}`] = {
        status,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data
      };
      
      await this.db.collection('delivery_assignments').doc(assignmentId).update(updateData);
      
      // Get assignment details
      const assignmentDoc = await this.db.collection('delivery_assignments').doc(assignmentId).get();
      const assignment = assignmentDoc.data();
      
      if (assignment) {
        // Update order status
        await this.db.collection('orders').doc(assignment.orderId).update({
          delivery_status: status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Handle status-specific actions
        await this.handleStatusUpdate(assignment.orderId, status, data);
      }
      
      return { success: true, assignmentId, status };
    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  // Handle status update actions
  private async handleStatusUpdate(orderId: string, status: string, data: any): Promise<void> {
    const orderDoc = await this.db.collection('orders').doc(orderId).get();
    const order = orderDoc.data();
    
    if (!order) return;
    
    switch (status) {
      case 'picked_up':
        await this.handlePickedUp(orderId, order, data);
        break;
      case 'out_for_delivery':
        await this.handleOutForDelivery(orderId, order, data);
        break;
      case 'delivered':
        await this.handleDelivered(orderId, order, data);
        break;
      case 'failed':
        await this.handleDeliveryFailed(orderId, order, data);
        break;
      case 'returned':
        await this.handleReturned(orderId, order, data);
        break;
    }
  }

  // Handle picked up status
  private async handlePickedUp(orderId: string, order: any, data: any): Promise<void> {
    const notification = {
      title: "Order Picked Up 📦",
      body: `Your order #${orderId} has been picked up and is on the way!`,
      data: {
        orderId,
        type: "order_picked_up"
      }
    };
    
    await this.pushService.sendCustomNotification({
      userId: order.customer.phone_number,
      title: notification.title,
      body: notification.body,
      customData: notification.data
    });
  }

  // Handle out for delivery status
  private async handleOutForDelivery(orderId: string, order: any, data: any): Promise<void> {
    // Update order status
    await this.db.collection('orders').doc(orderId).update({
      status: 'Out for Delivery',
      out_for_delivery_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const notification = {
      title: "Out for Delivery 🚚",
      body: `Your order #${orderId} is out for delivery and will arrive soon!`,
      data: {
        orderId,
        type: "out_for_delivery"
      }
    };
    
    await this.pushService.sendCustomNotification({
      userId: order.customer.phone_number,
      title: notification.title,
      body: notification.body,
      customData: notification.data
    });
  }

  // Handle delivered status
  private async handleDelivered(orderId: string, order: any, data: any): Promise<void> {
    // Update order status
    await this.db.collection('orders').doc(orderId).update({
      status: 'Delivered',
      deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
      delivery_notes: data.notes || '',
      delivery_photo: data.photo || '',
      customer_rating: data.rating || null
    });
    
    // Update agent status if own delivery
    if (order.assigned_agent_id) {
      await this.db.collection('agents').doc(order.assigned_agent_id).update({
        status: 'available',
        current_order_id: admin.firestore.FieldValue.delete(),
        'performance.deliveries_completed': admin.firestore.FieldValue.increment(1),
        lastDeliveryAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    const notification = {
      title: "Order Delivered! 🎉",
      body: `Your order #${orderId} has been successfully delivered!`,
      data: {
        orderId,
        type: "order_delivered"
      }
    };
    
    await this.pushService.sendCustomNotification({
      userId: order.customer.phone_number,
      title: notification.title,
      body: notification.body,
      customData: notification.data
    });
  }

  // Handle delivery failed status
  private async handleDeliveryFailed(orderId: string, order: any, data: any): Promise<void> {
    const notification = {
      title: "Delivery Failed ❌",
      body: `Delivery attempt for order #${orderId} failed. ${data.reason || 'We will try again soon.'}`,
      data: {
        orderId,
        reason: data.reason || '',
        type: "delivery_failed"
      }
    };
    
    await this.pushService.sendCustomNotification({
      userId: order.customer.phone_number,
      title: notification.title,
      body: notification.body,
      customData: notification.data
    });
  }

  // Handle returned status
  private async handleReturned(orderId: string, order: any, data: any): Promise<void> {
    // Update order status
    await this.db.collection('orders').doc(orderId).update({
      status: 'Returned',
      returnedAt: admin.firestore.FieldValue.serverTimestamp(),
      return_reason: data.reason || ''
    });
    
    const notification = {
      title: "Order Returned 📦",
      body: `Your order #${orderId} has been returned. ${data.reason || ''}`,
      data: {
        orderId,
        reason: data.reason || '',
        type: "order_returned"
      }
    };
    
    await this.pushService.sendCustomNotification({
      userId: order.customer.phone_number,
      title: notification.title,
      body: notification.body,
      customData: notification.data
    });
  }

  // Find available agent
  private async findAvailableAgent(orderId: string): Promise<any> {
    try {
      // Get order location for proximity-based assignment
      const orderDoc = await this.db.collection('orders').doc(orderId).get();
      const order = orderDoc.data();
      
      // Find available agents
      const agentsSnapshot = await this.db.collection('agents')
        .where('approved', '==', true)
        .where('status', '==', 'available')
        .get();
      
      if (agentsSnapshot.empty) return null;
      
      const agents = agentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // For now, return random agent
      // In production, implement location-based or performance-based selection
      return agents[Math.floor(Math.random() * agents.length)];
    } catch (error: any) {
      console.error('Error finding available agent:', error);
      return null;
    }
  }

  // Assign agent to delivery
  private async assignAgentToDelivery(agentId: string, orderId: string): Promise<void> {
    await this.db.collection('agents').doc(agentId).update({
      status: 'busy',
      current_order_id: orderId,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      'performance.orders_assigned': admin.firestore.FieldValue.increment(1)
    });
  }

  // Send assignment notifications
  private async sendAssignmentNotifications(orderId: string, assignment: any): Promise<void> {
    // Get order details
    const orderDoc = await this.db.collection('orders').doc(orderId).get();
    const order = orderDoc.data();
    
    if (!order) return;
    
    if (assignment.delivery_option === 'own_delivery' && assignment.agent_id) {
      // Get agent details
      const agentDoc = await this.db.collection('agents').doc(assignment.agent_id).get();
      const agent = agentDoc.data();
      
      if (agent) {
        // Notify customer
        const customerNotification = {
          title: "Delivery Agent Assigned 🚗",
          body: `${agent.first_name} has been assigned to deliver your order #${orderId}`,
          data: {
            orderId,
            agentId: assignment.agent_id,
            type: "agent_assigned"
          }
        };
        
        // Notify agent
        const agentNotification = {
          title: "New Delivery Assignment 📋",
          body: `You have been assigned order #${orderId} for delivery`,
          data: {
            orderId,
            type: "new_assignment"
          }
        };
        
        await Promise.all([
          this.pushService.sendCustomNotification({
            userId: order.customer.phone_number,
            title: customerNotification.title,
            body: customerNotification.body,
            customData: customerNotification.data
          }),
          this.pushService.sendCustomNotification({
            userId: agent.phone,
            title: agentNotification.title,
            body: agentNotification.body,
            customData: agentNotification.data
          })
        ]);
      }
    } else if (assignment.delivery_option === 'shiprocket') {
      // Notify customer about Shiprocket
      const notification = {
        title: "Order Shipped 📦",
        body: `Your order #${orderId} has been shipped via courier and will be delivered soon!`,
        data: {
          orderId,
          tracking_url: assignment.tracking_url || '',
          type: "order_shipped"
        }
      };
      
      await this.pushService.sendCustomNotification({
        userId: order.customer.phone_number,
        title: notification.title,
        body: notification.body,
        customData: notification.data
      });
    }
  }

  // Get delivery analytics
  async getDeliveryAnalytics(dateRange: any): Promise<any> {
    try {
      const { startDate, endDate } = dateRange;
      
      const assignmentsSnapshot = await this.db.collection('delivery_assignments')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();
      
      const assignments = assignmentsSnapshot.docs.map(doc => doc.data());
      
      const analytics = {
        totalDeliveries: assignments.length,
        ownDeliveries: assignments.filter(a => a.delivery_option === 'own_delivery').length,
        shiprocketDeliveries: assignments.filter(a => a.delivery_option === 'shiprocket').length,
        successfulDeliveries: assignments.filter(a => a.status === 'delivered').length,
        failedDeliveries: assignments.filter(a => a.status === 'failed').length,
        pendingDeliveries: assignments.filter(a => ['assigned', 'picked_up', 'out_for_delivery'].includes(a.status)).length,
        successRate: assignments.length > 0 ? 
          (assignments.filter(a => a.status === 'delivered').length / assignments.length * 100).toFixed(2) : 0,
        averageDeliveryTime: this.calculateAverageDeliveryTime(assignments),
        statusDistribution: this.getStatusDistribution(assignments),
        deliveryOptionDistribution: this.getDeliveryOptionDistribution(assignments)
      };
      
      return analytics;
    } catch (error: any) {
      console.error('Error getting delivery analytics:', error);
      throw error;
    }
  }

  // Calculate average delivery time
  private calculateAverageDeliveryTime(assignments: any[]): number {
    const completedAssignments = assignments.filter(a => 
      a.status === 'delivered' && a.createdAt && a.updatedAt
    );
    
    if (completedAssignments.length === 0) return 0;
    
    const deliveryTimes = completedAssignments.map(assignment => {
      const created = assignment.createdAt.toDate();
      const delivered = assignment.updatedAt.toDate();
      return delivered.getTime() - created.getTime();
    });
    
    const averageMs = deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length;
    return Math.round(averageMs / (1000 * 60)); // Return in minutes
  }

  // Get status distribution
  private getStatusDistribution(assignments: any[]): any {
    const distribution: any = {};
    assignments.forEach(assignment => {
      const status = assignment.status || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }

  // Get delivery option distribution
  private getDeliveryOptionDistribution(assignments: any[]): any {
    const distribution: any = {};
    assignments.forEach(assignment => {
      const option = assignment.delivery_option || 'unknown';
      distribution[option] = (distribution[option] || 0) + 1;
    });
    return distribution;
  }

  // Bulk update delivery assignments
  async bulkUpdateAssignments(assignmentIds: string[], updates: any): Promise<any> {
    try {
      const batch = this.db.batch();
      
      assignmentIds.forEach(assignmentId => {
        const assignmentRef = this.db.collection('delivery_assignments').doc(assignmentId);
        batch.update(assignmentRef, {
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      
      return { success: true, updated: assignmentIds.length };
    } catch (error: any) {
      console.error('Error bulk updating assignments:', error);
      throw error;
    }
  }

  // Reassign delivery to different agent
  async reassignDelivery(assignmentId: string, newAgentId: string, reason: string): Promise<any> {
    try {
      const assignmentDoc = await this.db.collection('delivery_assignments').doc(assignmentId).get();
      
      if (!assignmentDoc.exists) {
        return { success: false, error: 'Assignment not found' };
      }
      
      const assignment = assignmentDoc.data();
      
      // Release current agent if any
      if (assignment?.agent_id) {
        await this.db.collection('agents').doc(assignment.agent_id).update({
          status: 'available',
          current_order_id: admin.firestore.FieldValue.delete()
        });
      }
      
      // Assign to new agent
      await this.assignAgentToDelivery(newAgentId, assignment?.orderId);
      
      // Update assignment
      await this.db.collection('delivery_assignments').doc(assignmentId).update({
        agent_id: newAgentId,
        reassigned: true,
        reassignment_reason: reason,
        reassignedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update order
      await this.db.collection('orders').doc(assignment?.orderId).update({
        assigned_agent_id: newAgentId,
        reassigned: true
      });
      
      // Send notifications
      await this.sendReassignmentNotifications(assignment?.orderId, newAgentId, reason);
      
      return { success: true, assignmentId, newAgentId };
    } catch (error: any) {
      console.error('Error reassigning delivery:', error);
      throw error;
    }
  }

  // Send reassignment notifications
  private async sendReassignmentNotifications(orderId: string, newAgentId: string, reason: string): Promise<void> {
    const [orderDoc, agentDoc] = await Promise.all([
      this.db.collection('orders').doc(orderId).get(),
      this.db.collection('agents').doc(newAgentId).get()
    ]);
    
    const order = orderDoc.data();
    const agent = agentDoc.data();
    
    if (order && agent) {
      // Notify customer
      const customerNotification = {
        title: "Delivery Agent Changed 🔄",
        body: `${agent.first_name} is now assigned to deliver your order #${orderId}`,
        data: {
          orderId,
          agentId: newAgentId,
          type: "agent_reassigned"
        }
      };
      
      // Notify new agent
      const agentNotification = {
        title: "New Delivery Assignment 📋",
        body: `You have been assigned order #${orderId} for delivery (reassigned)`,
        data: {
          orderId,
          type: "reassignment"
        }
      };
      
      await Promise.all([
        this.pushService.sendCustomNotification({
          userId: order.customer.phone_number,
          title: customerNotification.title,
          body: customerNotification.body,
          customData: customerNotification.data
        }),
        this.pushService.sendCustomNotification({
          userId: agent.phone,
          title: agentNotification.title,
          body: agentNotification.body,
          customData: agentNotification.data
        })
      ]);
    }
  }
}
