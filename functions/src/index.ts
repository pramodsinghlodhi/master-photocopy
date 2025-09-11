import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Create Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Import services
import { PushNotificationService } from "./pushNotificationService";
import { ChatbotService } from "./chatbotService";
import { OrderManagementService } from "./orderManagementService";
import { AgentService } from "./agentService";
import { PaymentService } from "./paymentService";
import { DeliveryService } from "./deliveryService";

// Initialize services
const pushService = new PushNotificationService();
const chatbotService = new ChatbotService();
const orderService = new OrderManagementService();
const agentService = new AgentService();
const paymentService = new PaymentService();
const deliveryService = new DeliveryService();

// ===================
// API ENDPOINTS
// ===================

// Order Management
app.post("/orders/create", async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);
    await pushService.sendOrderConfirmation(order);
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/orders/:orderId/update-status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, agentId } = req.body;
    const order = await orderService.updateOrderStatus(orderId, status, agentId);
    await pushService.sendStatusUpdate(order);
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/orders/:orderId/assign-agent", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { agentId } = req.body;
    const assignment = await orderService.assignAgent(orderId, agentId);
    await pushService.sendAgentAssignment(assignment);
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agent Management
app.post("/agents/register", async (req, res) => {
  try {
    const agent = await agentService.registerAgent(req.body);
    await pushService.sendAgentWelcome(agent);
    res.json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/agents/:agentId/update-location", async (req, res) => {
  try {
    const { agentId } = req.params;
    const { latitude, longitude } = req.body;
    await agentService.updateAgentLocation(agentId, { latitude, longitude });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/agents/:agentId/update-status", async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;
    await agentService.updateAgentStatus(agentId, status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Processing
app.post("/payments/create-order", async (req, res) => {
  try {
    const paymentOrder = await paymentService.createRazorpayOrder(req.body);
    res.json({ success: true, paymentOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/payments/verify", async (req, res) => {
  try {
    const verification = await paymentService.verifyPayment(req.body);
    if (verification.success) {
      await orderService.updateOrderStatus(verification.orderId, "Paid");
      await pushService.sendPaymentConfirmation(verification.orderId);
    }
    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delivery Management
app.post("/delivery/shiprocket/create", async (req, res) => {
  try {
    const shipment = await deliveryService.createDeliveryAssignment(req.body);
    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/delivery/assign-own", async (req, res) => {
  try {
    const assignment = await deliveryService.createDeliveryAssignment(req.body);
    await pushService.sendDeliveryAssignment(assignment);
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chatbot Endpoints
app.post("/chatbot/message", async (req, res) => {
  try {
    const response = await chatbotService.processMessage(req.body);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/chatbot/suggestions", async (req, res) => {
  try {
    const suggestions = await chatbotService.getChatHistory(req.query.userId as string, 10);
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Push Notification Management
app.post("/notifications/subscribe", async (req, res) => {
  try {
    const { userId, token, topics } = req.body;
    await pushService.subscribeToTopics(userId, token, topics);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/notifications/send", async (req, res) => {
  try {
    const result = await pushService.sendCustomNotification(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook Endpoints
app.post("/webhooks/shiprocket", async (req, res) => {
  try {
    await deliveryService.updateDeliveryStatus(req.body.assignmentId, req.body.status, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/webhooks/payment", async (req, res) => {
  try {
    await paymentService.handlePaymentWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/webhooks/whatsapp", async (req, res) => {
  try {
    await chatbotService.processMessage(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics and Reports
app.get("/analytics/orders", async (req, res) => {
  try {
    const analytics = await orderService.getOrderAnalytics(req.query);
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/agents", async (req, res) => {
  try {
    const analytics = await agentService.getAgentAnalytics(req.query);
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export the main API
export const api = functions.https.onRequest(app);

// ===================
// CLOUD FUNCTIONS
// ===================

// Order Status Change Triggers
export const onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== after.status) {
      await pushService.sendStatusUpdate(after);
      
      // Auto-assign agent if status changed to Processing
      if (after.status === 'Processing' && !after.agentId) {
        await orderService.autoAssignOrder(context.params.orderId);
        console.log('Auto-assignment completed for order:', context.params.orderId);
      }
    }
  });

// Agent Online Status Tracker
export const onAgentStatusChange = functions.firestore
  .document('agents/{agentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== after.status) {
      await agentService.updateAgentStatus(context.params.agentId, after.status);
    }
  });

// Payment Confirmation Trigger
export const onPaymentConfirmation = functions.firestore
  .document('payments/{paymentId}')
  .onCreate(async (snap, context) => {
    const payment = snap.data();
    if (payment.status === 'success') {
      await orderService.updateOrderStatus(payment.orderId, 'Paid');
      await pushService.sendPaymentConfirmation(payment.orderId);
    }
  });

// Daily Report Generation
export const generateDailyReports = functions.pubsub
  .schedule('0 23 * * *') // Run at 11 PM daily
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    await orderService.getOrderAnalytics({ startDate: new Date(Date.now() - 24*60*60*1000), endDate: new Date() });
    await agentService.getAgentAnalytics({ startDate: new Date(Date.now() - 24*60*60*1000), endDate: new Date() });
    await pushService.sendDailyReportToAdmins();
  });

// Cleanup Old Data
export const cleanupOldData = functions.pubsub
  .schedule('0 2 * * 0') // Run at 2 AM every Sunday
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    // Cleanup old data - implement cleanup methods in services
    console.log('Daily cleanup completed');
    await pushService.cleanupOldNotifications();
  });

// Auto-assign Orders
export const autoAssignOrders = functions.pubsub
  .schedule('*/5 * * * *') // Run every 5 minutes
  .onRun(async (context) => {
    await orderService.autoAssignOrder('pending_orders');
  });

// Agent Performance Monitoring
export const monitorAgentPerformance = functions.pubsub
  .schedule('0 */4 * * *') // Run every 4 hours
  .onRun(async (context) => {
    await agentService.getAgentAnalytics({ startDate: new Date(Date.now() - 60*60*1000), endDate: new Date() });
  });

// Send Push Notification on New Message
export const onNewChatMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    if (message.senderId !== message.receiverId) {
      await pushService.sendChatNotification(message);
    }
  });

// Handle File Upload Processing
export const onFileUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (object.name?.includes('/orders/')) {
      // Handle file upload - implement file processing
      console.log('File uploaded:', object.name);
    }
  });

// Emergency Alert System
export const sendEmergencyAlert = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  await pushService.sendEmergencyAlert(data.message, data.targets);
  return { success: true };
});

// Bulk Operations
export const bulkUpdateOrders = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const results = await orderService.bulkUpdateOrders(data.orderIds, data.updates);
  return { success: true, results };
});

export const bulkNotifyUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const results = await pushService.bulkNotifyUsers(data.userIds, data.notification);
  return { success: true, results };
});

// Export admin setup functions
export { createAdminUser, makeUserAdmin, listAdminUsers } from './adminSetup';
