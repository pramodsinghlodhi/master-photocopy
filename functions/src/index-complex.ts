import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { webhookHandler } from "./webhookHandler";
import { shiprocketService } from "./shiprocketService";
import { orderService } from "./orderService";
import { notificationService } from "./notificationService";

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Webhook endpoint
app.post("/webhook", webhookHandler);

// Export the main API
export const api = functions.https.onRequest(app);

// Export individual services
export const createShipment = functions.https.onCall(shiprocketService.createShipment);
export const assignOrder = functions.https.onCall(orderService.assignOrder);
export const updateOrderStatus = functions.https.onCall(orderService.updateOrderStatus);
export const sendNotification = functions.https.onCall(notificationService.sendTemplatedMessage);

// Scheduled functions
export const processUnassignedOrders = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(orderService.autoAssignOrders);

// Firestore triggers
export const onOrderStatusChange = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(orderService.onOrderStatusChange);

export const onAgentLocationUpdate = functions.firestore
  .document("agents/{agentId}")
  .onUpdate(orderService.onAgentLocationUpdate);
