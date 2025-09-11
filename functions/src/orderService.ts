import * as admin from "firebase-admin";
import { notificationService } from "./notificationService";

const db = admin.firestore();

class OrderService {
  async assignOrder(data: { orderId: string; agentId: string; assignedBy: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { orderId, agentId, assignedBy } = data;

      // Verify agent exists and is active
      const agentDoc = await db.collection("agents").doc(agentId).get();
      if (!agentDoc.exists) {
        return { success: false, error: "Agent not found" };
      }

      const agent = agentDoc.data();
      if (agent?.status !== 'active') {
        return { success: false, error: "Agent is not active" };
      }

      // Update order
      const orderRef = db.collection("orders").doc(orderId);
      await orderRef.update({
        assignedAgentId: agentId,
        status: 'Processing',
        timeline: admin.firestore.FieldValue.arrayUnion({
          ts: admin.firestore.FieldValue.serverTimestamp(),
          actor: assignedBy,
          action: 'order_assigned',
          note: `Order assigned to agent ${agent?.first_name} ${agent?.last_name}`
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Send notification to agent
      try {
        await notificationService.sendTemplatedMessage({
          templateName: 'order_assigned',
          recipientPhone: agent?.phone,
          parameters: {
            first_name: agent?.first_name,
            orderId: orderId
          }
        });
      } catch (notifError) {
        console.error("Failed to send notification:", notifError);
        // Don't fail the assignment if notification fails
      }

      return { success: true };
    } catch (error: any) {
      console.error("Order assignment error:", error);
      return { success: false, error: error.message };
    }
  }

  async updateOrderStatus(data: { 
    orderId: string; 
    status: string; 
    updatedBy: string; 
    note?: string;
    proof?: { url: string; type: string };
    customerOtp?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { orderId, status, updatedBy, note, proof, customerOtp } = data;

      const orderRef = db.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        return { success: false, error: "Order not found" };
      }

      const order = orderDoc.data();

      // Validate OTP if required for delivery
      if (status === 'Delivered' && order?.delivery?.type === 'own') {
        if (customerOtp) {
          const isValidOtp = await this.validateDeliveryOTP(orderId, customerOtp);
          if (!isValidOtp) {
            return { success: false, error: "Invalid delivery OTP" };
          }
        }
      }

      // Prepare update data
      const updateData: any = {
        status,
        timeline: admin.firestore.FieldValue.arrayUnion({
          ts: admin.firestore.FieldValue.serverTimestamp(),
          actor: updatedBy,
          action: 'status_update',
          note: note || `Status updated to ${status}`
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Add proof if provided
      if (proof) {
        updateData.deliveryProof = admin.firestore.FieldValue.arrayUnion({
          url: proof.url,
          type: proof.type,
          uploadedBy: updatedBy,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      await orderRef.update(updateData);

      // Send customer notification for status change
      try {
        await this.sendCustomerStatusNotification(order, status);
      } catch (notifError) {
        console.error("Failed to send customer notification:", notifError);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Order status update error:", error);
      return { success: false, error: error.message };
    }
  }

  async autoAssignOrders(): Promise<void> {
    try {
      // Get unassigned orders older than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const unassignedOrders = await db.collection("orders")
        .where("assignedAgentId", "==", null)
        .where("delivery.type", "==", "own")
        .where("status", "in", ["Pending", "Processing"])
        .where("createdAt", "<=", tenMinutesAgo)
        .limit(10)
        .get();

      if (unassignedOrders.empty) {
        return;
      }

      // Get available agents
      const availableAgents = await db.collection("agents")
        .where("status", "==", "active")
        .get();

      if (availableAgents.empty) {
        console.log("No available agents for auto-assignment");
        return;
      }

      const agents = availableAgents.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let agentIndex = 0;

      // Assign orders in round-robin fashion
      for (const orderDoc of unassignedOrders.docs) {
        const agent = agents[agentIndex % agents.length];
        
        await this.assignOrder({
          orderId: orderDoc.id,
          agentId: agent.id,
          assignedBy: 'system_auto_assign'
        });

        agentIndex++;
      }

      console.log(`Auto-assigned ${unassignedOrders.size} orders to ${agents.length} agents`);
    } catch (error) {
      console.error("Auto assignment error:", error);
    }
  }

  async onOrderStatusChange(change: any): Promise<void> {
    const before = change.before.data();
    const after = change.after.data();

    if (before?.status !== after?.status) {
      console.log(`Order ${change.after.id} status changed from ${before?.status} to ${after?.status}`);
      
      // Trigger additional actions based on status change
      switch (after?.status) {
        case 'Out for Delivery':
          if (after?.delivery?.type === 'own') {
            await this.generateDeliveryOTP(change.after.id, after);
          }
          break;
        case 'Delivered':
          await this.handleDeliveryCompletion(change.after.id, after);
          break;
      }
    }
  }

  async onAgentLocationUpdate(change: any): Promise<void> {
    // const agentData = change.after.data();
    const agentId = change.after.id;

    // Update location timestamp
    await change.after.ref.update({
      'location.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
    });

    // You can add logic here to update nearby customers about agent location
    console.log(`Agent ${agentId} location updated`);
  }

  private async validateDeliveryOTP(orderId: string, otp: string): Promise<boolean> {
    try {
      const otpDoc = await db.collection("delivery_otps")
        .where("orderId", "==", orderId)
        .where("used", "==", false)
        .limit(1)
        .get();

      if (otpDoc.empty) {
        return false;
      }

      const otpData = otpDoc.docs[0].data();
      
      // Check if OTP has expired (valid for 30 minutes)
      const expiresAt = otpData.expiresAt.toDate();
      if (new Date() > expiresAt) {
        return false;
      }

      // Validate OTP
      if (otpData.otp === otp) {
        // Mark OTP as used
        await otpDoc.docs[0].ref.update({
          used: true,
          usedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("OTP validation error:", error);
      return false;
    }
  }

  private async generateDeliveryOTP(orderId: string, orderData: any): Promise<void> {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP
      await db.collection("delivery_otps").add({
        orderId,
        otp,
        agentId: orderData.assignedAgentId,
        customerPhone: orderData.customer.phone_number || orderData.customer.phone,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        used: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Send OTP to customer
      await notificationService.sendTemplatedMessage({
        templateName: 'delivery_otp',
        recipientPhone: orderData.customer.phone_number || orderData.customer.phone,
        parameters: {
          first_name: orderData.customer.first_name,
          orderId: orderData.orderId || orderId,
          copy_code: otp
        }
      });

    } catch (error) {
      console.error("OTP generation error:", error);
    }
  }

  private async handleDeliveryCompletion(orderId: string, orderData: any): Promise<void> {
    try {
      // Send delivery confirmation to customer
      await notificationService.sendTemplatedMessage({
        templateName: 'order_delivered',
        recipientPhone: orderData.customer.phone_number || orderData.customer.phone,
        parameters: {
          first_name: orderData.customer.first_name,
          orderId: orderData.orderId || orderId
        }
      });

      // Update order metrics or trigger post-delivery workflows
      console.log(`Order ${orderId} delivery completed`);
    } catch (error) {
      console.error("Delivery completion handling error:", error);
    }
  }

  private async sendCustomerStatusNotification(orderData: any, status: string): Promise<void> {
    const templateMap: { [key: string]: string } = {
      'Processing': 'order_processing',
      'Shipped': 'order_shipped',
      'Out for Delivery': 'order_out_for_delivery',
      'Delivered': 'order_delivered',
      'Cancelled': 'order_cancelled'
    };

    const templateName = templateMap[status];
    if (!templateName) return;

    await notificationService.sendTemplatedMessage({
      templateName,
      recipientPhone: orderData.customer.phone_number || orderData.customer.phone,
      parameters: {
        first_name: orderData.customer.first_name,
        orderId: orderData.orderId || orderData.id,
        tracking_url: orderData.delivery?.tracking_url || ''
      }
    });
  }
}

export const orderService = new OrderService();
