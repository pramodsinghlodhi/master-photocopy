import * as admin from "firebase-admin";
import { PushNotificationService } from "./pushNotificationService";

export class AgentService {
  private db = admin.firestore();
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = new PushNotificationService();
  }

  // Register new agent
  async registerAgent(data: any): Promise<any> {
    try {
      const { phone, first_name, last_name, email, address, city, state, pincode } = data;
      
      // Check if agent already exists
      const existingAgent = await this.db.collection('agents')
        .where('phone', '==', phone)
        .limit(1)
        .get();
      
      if (!existingAgent.empty) {
        return { success: false, error: 'Agent with this phone number already exists' };
      }
      
      // Create agent document
      const agentRef = await this.db.collection('agents').add({
        phone,
        first_name,
        last_name,
        email,
        address,
        city,
        state,
        pincode,
        status: 'inactive', // inactive until approved
        approved: false,
        verification_status: 'pending',
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        performance: {
          orders_assigned: 0,
          deliveries_completed: 0,
          average_rating: 0,
          total_earnings: 0
        },
        location: {
          latitude: null,
          longitude: null,
          last_updated: null
        }
      });
      
      // Send welcome notification
      await this.pushService.sendAgentWelcome({
        uid: agentRef.id,
        phone,
        first_name
      });
      
      return { success: true, agentId: agentRef.id };
    } catch (error: any) {
      console.error('Error registering agent:', error);
      throw error;
    }
  }

  // Helper method to safely update agent documents
  private async safeUpdateAgent(agentId: string, updateData: any): Promise<boolean> {
    try {
      const agentDoc = await this.db.collection('agents').doc(agentId).get();
      if (!agentDoc.exists) {
        console.warn(`Agent ${agentId} does not exist, skipping update`);
        return false;
      }
      
      await this.db.collection('agents').doc(agentId).update(updateData);
      return true;
    } catch (error: any) {
      console.error(`Error updating agent ${agentId}:`, error);
      throw error;
    }
  }

  // Approve agent
  async approveAgent(agentId: string): Promise<any> {
    try {
      const updateData = {
        approved: true,
        verification_status: 'approved',
        status: 'available',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const updated = await this.safeUpdateAgent(agentId, updateData);
      if (!updated) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      // Get agent details
      const agentDoc = await this.db.collection('agents').doc(agentId).get();
      const agent = agentDoc.data();
      
      // Send approval notification
      if (agent) {
        const notification = {
          title: "Registration Approved! 🎉",
          body: `Hi ${agent.first_name}, your agent registration has been approved. You can now start receiving delivery assignments.`,
          data: {
            type: "agent_approved",
            agentId
          }
        };
        
        await this.pushService.sendCustomNotification({
          userId: agent.phone,
          title: notification.title,
          body: notification.body,
          customData: notification.data
        });
      }
      
      return { success: true, agentId };
    } catch (error: any) {
      console.error('Error approving agent:', error);
      throw error;
    }
  }

  // Reject agent
  async rejectAgent(agentId: string, reason: string): Promise<any> {
    try {
      const updateData = {
        approved: false,
        verification_status: 'rejected',
        rejection_reason: reason,
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const updated = await this.safeUpdateAgent(agentId, updateData);
      if (!updated) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      // Get agent details
      const agentDoc = await this.db.collection('agents').doc(agentId).get();
      const agent = agentDoc.data();
      
      // Send rejection notification
      if (agent) {
        const notification = {
          title: "Registration Update",
          body: `Hi ${agent.first_name}, your agent registration could not be approved. Reason: ${reason}`,
          data: {
            type: "agent_rejected",
            agentId,
            reason
          }
        };
        
        await this.pushService.sendCustomNotification({
          userId: agent.phone,
          title: notification.title,
          body: notification.body,
          customData: notification.data
        });
      }
      
      return { success: true, agentId };
    } catch (error: any) {
      console.error('Error rejecting agent:', error);
      throw error;
    }
  }

  // Update agent status
  async updateAgentStatus(agentId: string, status: string): Promise<any> {
    try {
      const validStatuses = ['available', 'busy', 'offline', 'inactive'];
      
      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Invalid status' };
      }
      
      const updateData = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const updated = await this.safeUpdateAgent(agentId, updateData);
      if (!updated) {
        return { success: false, error: `Agent ${agentId} not found` };
      }
      
      return { success: true, agentId, status };
    } catch (error: any) {
      console.error('Error updating agent status:', error);
      throw error;
    }
  }

  // Update agent location
  async updateAgentLocation(agentId: string, location: any): Promise<any> {
    try {
      const { latitude, longitude } = location;
      
      const updateData = {
        'location.latitude': latitude,
        'location.longitude': longitude,
        'location.last_updated': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const updated = await this.safeUpdateAgent(agentId, updateData);
      if (!updated) {
        return { success: false, error: `Agent ${agentId} not found` };
      }
      
      return { 
        success: true, 
        message: 'Location updated successfully',
        location: { latitude, longitude }
      };
    } catch (error: any) {
      console.error('Error updating agent location:', error);
      throw error;
    }
  }

  // Get available agents
  async getAvailableAgents(filters: any = {}): Promise<any> {
    try {
      let query = this.db.collection('agents')
        .where('approved', '==', true)
        .where('status', '==', 'available');
      
      // Add location filter if provided
      if (filters.city) {
        query = query.where('city', '==', filters.city);
      }
      
      const agentsSnapshot = await query.get();
      
      const agents = agentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, agents };
    } catch (error: any) {
      console.error('Error getting available agents:', error);
      throw error;
    }
  }

  // Assign order to agent
  async assignOrder(agentId: string, orderId: string): Promise<any> {
    try {
      const batch = this.db.batch();
      
      // Update agent
      const agentRef = this.db.collection('agents').doc(agentId);
      batch.update(agentRef, {
        status: 'busy',
        current_order_id: orderId,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        'performance.orders_assigned': admin.firestore.FieldValue.increment(1)
      });
      
      // Update order
      const orderRef = this.db.collection('orders').doc(orderId);
      batch.update(orderRef, {
        assigned_agent_id: agentId,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      // Send assignment notification
      const [agentDoc, orderDoc] = await Promise.all([
        this.db.collection('agents').doc(agentId).get(),
        this.db.collection('orders').doc(orderId).get()
      ]);
      
      const agent = agentDoc.data();
      const order = orderDoc.data();
      
      if (agent && order) {
        const notification = {
          title: "New Delivery Assignment 📦",
          body: `You have been assigned order #${orderId} for delivery`,
          data: {
            type: "order_assigned",
            orderId,
            agentId
          }
        };
        
        await this.pushService.sendCustomNotification({
          userId: agent.phone,
          title: notification.title,
          body: notification.body,
          customData: notification.data
        });
      }
      
      return { success: true, agentId, orderId };
    } catch (error: any) {
      console.error('Error assigning order to agent:', error);
      throw error;
    }
  }

  // Complete delivery
  async completeDelivery(agentId: string, orderId: string, deliveryData: any): Promise<any> {
    try {
      const { delivery_notes, customer_rating, delivery_photo } = deliveryData;
      
      const batch = this.db.batch();
      
      // Update agent
      const agentRef = this.db.collection('agents').doc(agentId);
      batch.update(agentRef, {
        status: 'available',
        current_order_id: admin.firestore.FieldValue.delete(),
        'performance.deliveries_completed': admin.firestore.FieldValue.increment(1),
        lastDeliveryAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update order
      const orderRef = this.db.collection('orders').doc(orderId);
      batch.update(orderRef, {
        status: 'Delivered',
        delivery_notes,
        customer_rating,
        delivery_photo,
        deliveredAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await batch.commit();
      
      // Update agent rating if provided
      if (customer_rating) {
        await this.updateAgentRating(agentId, customer_rating);
      }
      
      return { success: true, agentId, orderId };
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  }

  // Update agent rating
  private async updateAgentRating(agentId: string, newRating: number): Promise<void> {
    try {
      const agentDoc = await this.db.collection('agents').doc(agentId).get();
      
      if (!agentDoc.exists) {
        console.warn(`Agent ${agentId} not found when updating rating`);
        return;
      }
      
      const agent = agentDoc.data();
      
      if (agent) {
        const currentRating = agent.performance?.average_rating || 0;
        const totalDeliveries = agent.performance?.deliveries_completed || 1;
        
        // Calculate new average rating
        const totalPoints = currentRating * (totalDeliveries - 1) + newRating;
        const averageRating = totalPoints / totalDeliveries;
        
        const updated = await this.safeUpdateAgent(agentId, {
          'performance.average_rating': parseFloat(averageRating.toFixed(2))
        });
        
        if (!updated) {
          console.warn(`Failed to update rating for agent ${agentId} - document not found`);
        }
      }
    } catch (error: any) {
      console.error('Error updating agent rating:', error);
    }
  }

  // Get agent performance
  async getAgentPerformance(agentId: string, dateRange?: any): Promise<any> {
    try {
      const agentDoc = await this.db.collection('agents').doc(agentId).get();
      
      if (!agentDoc.exists) {
        return { success: false, error: 'Agent not found' };
      }
      
      const agent = agentDoc.data();
      
      // Get completed orders for date range
      let ordersQuery = this.db.collection('orders')
        .where('assigned_agent_id', '==', agentId)
        .where('status', '==', 'Delivered');
      
      if (dateRange?.startDate && dateRange?.endDate) {
        ordersQuery = ordersQuery
          .where('deliveredAt', '>=', dateRange.startDate)
          .where('deliveredAt', '<=', dateRange.endDate);
      }
      
      const ordersSnapshot = await ordersQuery.get();
      const completedOrders = ordersSnapshot.docs.map(doc => doc.data());
      
      const performance = {
        basic: agent?.performance || {},
        period: {
          deliveries: completedOrders.length,
          total_earnings: completedOrders.reduce((sum, order) => 
            sum + (order.agent_commission || 0), 0),
          average_delivery_time: this.calculateAverageDeliveryTime(completedOrders),
          customer_ratings: completedOrders
            .filter(order => order.customer_rating)
            .map(order => order.customer_rating)
        }
      };
      
      return { success: true, agentId, performance };
    } catch (error: any) {
      console.error('Error getting agent performance:', error);
      throw error;
    }
  }

  // Calculate average delivery time
  private calculateAverageDeliveryTime(orders: any[]): number {
    if (orders.length === 0) return 0;
    
    const deliveryTimes = orders
      .filter(order => order.assignedAt && order.deliveredAt)
      .map(order => {
        const assigned = order.assignedAt.toDate();
        const delivered = order.deliveredAt.toDate();
        return delivered.getTime() - assigned.getTime();
      });
    
    if (deliveryTimes.length === 0) return 0;
    
    const averageMs = deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length;
    return Math.round(averageMs / (1000 * 60)); // Return in minutes
  }

  // Get agent dashboard data
  async getAgentDashboard(agentId: string): Promise<any> {
    try {
      const agentDoc = await this.db.collection('agents').doc(agentId).get();
      
      if (!agentDoc.exists) {
        return { success: false, error: 'Agent not found' };
      }
      
      const agent = agentDoc.data();
      
      // Get current order if any
      let currentOrder = null;
      if (agent?.current_order_id) {
        const orderDoc = await this.db.collection('orders').doc(agent.current_order_id).get();
        if (orderDoc.exists) {
          currentOrder = { id: orderDoc.id, ...orderDoc.data() };
        }
      }
      
      // Get recent deliveries
      const recentDeliveriesSnapshot = await this.db.collection('orders')
        .where('assigned_agent_id', '==', agentId)
        .where('status', '==', 'Delivered')
        .orderBy('deliveredAt', 'desc')
        .limit(10)
        .get();
      
      const recentDeliveries = recentDeliveriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayDeliveriesSnapshot = await this.db.collection('orders')
        .where('assigned_agent_id', '==', agentId)
        .where('deliveredAt', '>=', today)
        .where('deliveredAt', '<', tomorrow)
        .get();
      
      const todayStats = {
        deliveries: todayDeliveriesSnapshot.size,
        earnings: todayDeliveriesSnapshot.docs.reduce((sum, doc) => 
          sum + (doc.data().agent_commission || 0), 0)
      };
      
      return {
        success: true,
        agent: {
          id: agentId,
          ...agent
        },
        currentOrder,
        recentDeliveries,
        todayStats
      };
    } catch (error: any) {
      console.error('Error getting agent dashboard:', error);
      throw error;
    }
  }

  // Bulk update agents
  async bulkUpdateAgents(agentIds: string[], updates: any): Promise<any> {
    try {
      const batch = this.db.batch();
      const validAgents: string[] = [];
      
      // Check which agents exist first
      const agentChecks = await Promise.all(
        agentIds.map(async (agentId) => {
          const agentDoc = await this.db.collection('agents').doc(agentId).get();
          return { agentId, exists: agentDoc.exists };
        })
      );
      
      // Only update existing agents
      agentChecks.forEach(({ agentId, exists }) => {
        if (exists) {
          const agentRef = this.db.collection('agents').doc(agentId);
          batch.update(agentRef, {
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          validAgents.push(agentId);
        } else {
          console.warn(`Skipping update for non-existent agent: ${agentId}`);
        }
      });
      
      if (validAgents.length > 0) {
        await batch.commit();
      }
      
      return { 
        success: true, 
        updated: validAgents.length,
        skipped: agentIds.length - validAgents.length,
        validAgents
      };
    } catch (error: any) {
      console.error('Error bulk updating agents:', error);
      throw error;
    }
  }

  // Get agent analytics
  async getAgentAnalytics(dateRange: any): Promise<any> {
    try {
      const { startDate, endDate } = dateRange;
      
      // Get all agents
      const agentsSnapshot = await this.db.collection('agents').get();
      const agents = agentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Get deliveries in date range
      const deliveriesSnapshot = await this.db.collection('orders')
        .where('status', '==', 'Delivered')
        .where('deliveredAt', '>=', startDate)
        .where('deliveredAt', '<=', endDate)
        .get();
      
      const deliveries = deliveriesSnapshot.docs.map(doc => doc.data());
      
      const analytics = {
        totalAgents: agents.length,
        activeAgents: agents.filter(agent => agent.status === 'available' || agent.status === 'busy').length,
        approvedAgents: agents.filter(agent => agent.approved).length,
        pendingApprovals: agents.filter(agent => !agent.approved && agent.verification_status === 'pending').length,
        totalDeliveries: deliveries.length,
        averageRating: this.calculateOverallAverageRating(agents),
        topPerformers: this.getTopPerformers(agents, deliveries),
        statusDistribution: this.getStatusDistribution(agents)
      };
      
      return analytics;
    } catch (error: any) {
      console.error('Error getting agent analytics:', error);
      throw error;
    }
  }

  // Helper methods for analytics
  private calculateOverallAverageRating(agents: any[]): number {
    const ratingsAgents = agents.filter(agent => agent.performance?.average_rating > 0);
    if (ratingsAgents.length === 0) return 0;
    
    const totalRating = ratingsAgents.reduce((sum, agent) => 
      sum + agent.performance.average_rating, 0);
    
    return parseFloat((totalRating / ratingsAgents.length).toFixed(2));
  }

  private getTopPerformers(agents: any[], deliveries: any[]): any[] {
    return agents
      .filter(agent => agent.approved)
      .map(agent => ({
        id: agent.id,
        name: `${agent.first_name} ${agent.last_name}`,
        deliveries: deliveries.filter(delivery => delivery.assigned_agent_id === agent.id).length,
        rating: agent.performance?.average_rating || 0
      }))
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 10);
  }

  private getStatusDistribution(agents: any[]): any {
    const distribution: any = {};
    agents.forEach(agent => {
      const status = agent.status || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }
}
