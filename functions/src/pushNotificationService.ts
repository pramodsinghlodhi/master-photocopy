import * as admin from "firebase-admin";

export class PushNotificationService {
  private db = admin.firestore();
  private messaging = admin.messaging();

  // Subscribe user to topics
  async subscribeToTopics(userId: string, token: string, topics: string[]): Promise<void> {
    try {
      // Save token to user document
      await this.db.collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Subscribe to topics
      if (topics.length > 0) {
        await this.messaging.subscribeToTopic(token, topics[0]);
        console.log(`User ${userId} subscribed to topics:`, topics);
      }
    } catch (error: any) {
      console.error('Error subscribing to topics:', error);
      throw error;
    }
  }

  // Send order confirmation notification
  async sendOrderConfirmation(order: any): Promise<void> {
    const notification = {
      title: "Order Confirmed! 📋",
      body: `Your order #${order.orderId} has been received and is being processed.`,
      data: {
        orderId: order.orderId,
        type: "order_confirmation"
      }
    };

    await this.sendToUser(order.customer.phone_number, notification);
    await this.saveNotification(order.customer.phone_number, notification);
  }

  // Send status update notification
  async sendStatusUpdate(order: any): Promise<void> {
    const statusMessages = {
      'Pending': 'Your order is pending confirmation.',
      'Processing': 'Your order is being processed.',
      'Printed': 'Your order has been printed and ready for delivery.',
      'Shipped': 'Your order has been shipped.',
      'Out for Delivery': 'Your order is out for delivery.',
      'Delivered': 'Your order has been delivered successfully!',
      'Cancelled': 'Your order has been cancelled.'
    };

    const notification = {
      title: `Order ${order.status} 📦`,
      body: statusMessages[order.status as keyof typeof statusMessages] || `Order status updated to ${order.status}`,
      data: {
        orderId: order.orderId,
        status: order.status,
        type: "status_update"
      }
    };

    await this.sendToUser(order.customer.phone_number, notification);
    await this.saveNotification(order.customer.phone_number, notification);
  }

  // Send agent assignment notification
  async sendAgentAssignment(assignment: any): Promise<void> {
    // Notify customer
    const customerNotification = {
      title: "Delivery Agent Assigned 🚗",
      body: `${assignment.agent.first_name} has been assigned to deliver your order #${assignment.orderId}`,
      data: {
        orderId: assignment.orderId,
        agentId: assignment.agentId,
        type: "agent_assigned"
      }
    };

    // Notify agent
    const agentNotification = {
      title: "New Delivery Assignment 📋",
      body: `You have been assigned order #${assignment.orderId} for delivery`,
      data: {
        orderId: assignment.orderId,
        type: "new_assignment"
      }
    };

    await Promise.all([
      this.sendToUser(assignment.customer.phone_number, customerNotification),
      this.sendToUser(assignment.agent.phone, agentNotification),
      this.saveNotification(assignment.customer.phone_number, customerNotification),
      this.saveNotification(assignment.agent.phone, agentNotification)
    ]);
  }

  // Send payment confirmation notification
  async sendPaymentConfirmation(orderId: string): Promise<void> {
    const orderDoc = await this.db.collection('orders').doc(orderId).get();
    const order = orderDoc.data();

    if (order) {
      const notification = {
        title: "Payment Confirmed ✅",
        body: `Payment of ₹${order.totals.total} for order #${orderId} has been confirmed.`,
        data: {
          orderId: orderId,
          amount: order.totals.total.toString(),
          type: "payment_confirmed"
        }
      };

      await this.sendToUser(order.customer.phone_number, notification);
      await this.saveNotification(order.customer.phone_number, notification);
    }
  }

  // Send delivery assignment notification
  async sendDeliveryAssignment(assignment: any): Promise<void> {
    const notification = {
      title: "Ready for Delivery 🚚",
      body: `Your order #${assignment.orderId} is ready and will be delivered soon.`,
      data: {
        orderId: assignment.orderId,
        type: "delivery_assignment"
      }
    };

    await this.sendToUser(assignment.customer.phone_number, notification);
    await this.saveNotification(assignment.customer.phone_number, notification);
  }

  // Send agent welcome notification
  async sendAgentWelcome(agent: any): Promise<void> {
    const notification = {
      title: "Welcome to Smart Photocopy! 🎉",
      body: `Hi ${agent.first_name}, your agent registration is under review. You'll be notified once approved.`,
      data: {
        agentId: agent.uid,
        type: "agent_welcome"
      }
    };

    await this.sendToUser(agent.phone, notification);
    await this.saveNotification(agent.phone, notification);
  }

  // Send chat notification
  async sendChatNotification(message: any): Promise<void> {
    const notification = {
      title: "New Message 💬",
      body: message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text,
      data: {
        chatId: message.chatId,
        senderId: message.senderId,
        type: "new_message"
      }
    };

    await this.sendToUser(message.receiverId, notification);
    await this.saveNotification(message.receiverId, notification);
  }

  // Send custom notification
  async sendCustomNotification(data: any): Promise<any> {
    const { userId, title, body, customData } = data;
    
    const notification = {
      title,
      body,
      data: {
        ...customData,
        type: "custom"
      }
    };

    await this.sendToUser(userId, notification);
    await this.saveNotification(userId, notification);
    
    return { success: true };
  }

  // Send emergency alert
  async sendEmergencyAlert(message: string, targets: string[]): Promise<void> {
    const notification = {
      title: "Emergency Alert ⚠️",
      body: message,
      data: {
        type: "emergency_alert",
        priority: "high"
      }
    };

    const promises = targets.map(async (userId) => {
      await this.sendToUser(userId, notification);
      await this.saveNotification(userId, notification);
    });

    await Promise.all(promises);
  }

  // Send daily report to admins
  async sendDailyReportToAdmins(): Promise<void> {
    const adminsSnapshot = await this.db.collection('users')
      .where('role', '==', 'admin')
      .get();

    const notification = {
      title: "Daily Report Available 📊",
      body: "Today's business report is ready for review.",
      data: {
        type: "daily_report"
      }
    };

    const promises = adminsSnapshot.docs.map(async (doc) => {
      const admin = doc.data();
      await this.sendToUser(admin.phone, notification);
      await this.saveNotification(admin.phone, notification);
    });

    await Promise.all(promises);
  }

  // Bulk notify users
  async bulkNotifyUsers(userIds: string[], notification: any): Promise<any> {
    const promises = userIds.map(async (userId) => {
      await this.sendToUser(userId, notification);
      await this.saveNotification(userId, notification);
    });

    await Promise.all(promises);
    return { notified: userIds.length };
  }

  // Send notification to user
  private async sendToUser(userIdentifier: string, notification: any): Promise<void> {
    try {
      // Get user tokens
      const userSnapshot = await this.db.collection('users')
        .where('phone', '==', userIdentifier)
        .limit(1)
        .get();

      if (!userSnapshot.empty) {
        const user = userSnapshot.docs[0].data();
        const tokens = user.fcmTokens || [];

        if (tokens.length > 0) {
          const message = {
            notification: {
              title: notification.title,
              body: notification.body
            },
            data: notification.data,
            tokens: tokens
          };

          const response = await this.messaging.sendMulticast(message);
          console.log(`Notification sent to ${userIdentifier}:`, response.successCount);

          // Clean up invalid tokens
          if (response.failureCount > 0) {
            await this.cleanupInvalidTokens(userSnapshot.docs[0].id, tokens, response.responses);
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
    }
  }

  // Save notification to database
  private async saveNotification(userId: string, notification: any): Promise<void> {
    try {
      await this.db.collection('notifications').add({
        userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error: any) {
      console.error('Error saving notification:', error);
    }
  }

  // Clean up invalid FCM tokens
  private async cleanupInvalidTokens(userId: string, tokens: string[], responses: any[]): Promise<void> {
    const invalidTokens: string[] = [];

    responses.forEach((response, index) => {
      if (!response.success && response.error?.code === 'messaging/registration-token-not-registered') {
        invalidTokens.push(tokens[index]);
      }
    });

    if (invalidTokens.length > 0) {
      await this.db.collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens)
      });
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotifications = await this.db.collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo)
      .limit(500)
      .get();

    const batch = this.db.batch();
    oldNotifications.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldNotifications.size} old notifications`);
  }
}
