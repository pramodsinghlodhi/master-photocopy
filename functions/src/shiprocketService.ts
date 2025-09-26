import * as admin from "firebase-admin";
import axios from "axios";

const db = admin.firestore();

interface ShiprocketConfig {
  apiKey: string;
  secret: string;
  baseUrl: string;
}

interface ShiprocketShipment {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id: string;
  comment: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }>;
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

interface ShiprocketResponse {
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
}

class ShiprocketService {
  private async getConfig(clientId?: string): Promise<ShiprocketConfig> {
    // Get Shiprocket configuration from settings or environment
    if (clientId) {
      const settingsDoc = await db.collection("settings").doc(clientId).get();
      if (settingsDoc.exists) {
        const settings = settingsDoc.data();
        if (settings?.shiprocket) {
          return settings.shiprocket;
        }
      }
    }

    // Fallback to environment variables
    return {
      apiKey: process.env.SHIPROCKET_API_KEY || "",
      secret: process.env.SHIPROCKET_API_SECRET || "",
      baseUrl: process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in/v1/external"
    };
  }

  private async getAuthToken(config: ShiprocketConfig): Promise<string> {
    try {
      const response = await axios.post(`${config.baseUrl}/auth/login`, {
        email: config.apiKey,
        password: config.secret
      });

      return response.data.token;
    } catch (error: any) {
      console.error("Shiprocket auth error:", error);
      throw new Error("Failed to authenticate with Shiprocket");
    }
  }

  async createShipment(data: { orderId: string }): Promise<{ success: boolean; shipmentId?: string; trackingUrl?: string; error?: string }> {
    try {
      const orderDoc = await db.collection("orders").doc(data.orderId).get();
      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const order = orderDoc.data() as any;
      
      // Check if already has Shiprocket shipment
      if (order.delivery?.shiprocket_shipment_id) {
        return {
          success: false,
          error: "Order already has Shiprocket shipment"
        };
      }

      const config = await this.getConfig(order.clientId);
      const token = await this.getAuthToken(config);

      // Prepare shipment data
      const shipmentData: ShiprocketShipment = {
        order_id: order.orderId || order.id,
        order_date: new Date(order.createdAt?.toDate() || order.date).toISOString().split('T')[0],
        pickup_location: "Primary", // Default pickup location
        channel_id: "5043", // Custom channel ID
        comment: order.urgent ? "Urgent Order" : "Standard Order",
        billing_customer_name: order.customer.first_name,
        billing_last_name: order.customer.last_name,
        billing_address: order.customer.address || "Address not provided",
        billing_city: order.customer.city || "City not provided",
        billing_pincode: order.customer.pincode || "000000",
        billing_state: order.customer.state || "State not provided",
        billing_country: order.customer.country || "India",
        billing_email: order.customer.email,
        billing_phone: order.customer.phone_number || order.customer.phone,
        shipping_is_billing: true,
        order_items: order.items.map((item: any) => ({
          name: item.name,
          sku: item.sku || item.name.replace(/\s+/g, '-').toLowerCase(),
          units: item.quantity || 1,
          selling_price: item.price
        })),
        payment_method: order.payment.method === 'COD' ? 'COD' : 'Prepaid',
        sub_total: order.totals?.subtotal || order.total,
        length: 10, // Default dimensions
        breadth: 10,
        height: 5,
        weight: 0.5
      };

      // Create shipment with Shiprocket
      const response = await axios.post(
        `${config.baseUrl}/orders/create/adhoc`,
        shipmentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const shipmentResponse: ShiprocketResponse = response.data;

      // Update order with shipment details
      const currentTimestamp = new Date();
      await orderDoc.ref.update({
        'delivery.shiprocket_shipment_id': shipmentResponse.shipment_id.toString(),
        'delivery.tracking_url': `https://shiprocket.in/tracking/${shipmentResponse.awb_code}`,
        'delivery.tracking_number': shipmentResponse.awb_code,
        'delivery.courier_name': shipmentResponse.courier_name,
        status: 'Shipped',
        timeline: admin.firestore.FieldValue.arrayUnion({
          ts: currentTimestamp,
          actor: 'system',
          action: 'shipment_created',
          note: `Shiprocket shipment created. AWB: ${shipmentResponse.awb_code}, Courier: ${shipmentResponse.courier_name}`
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        shipmentId: shipmentResponse.shipment_id.toString(),
        trackingUrl: `https://shiprocket.in/tracking/${shipmentResponse.awb_code}`
      };

    } catch (error: any) {
      console.error("Shiprocket shipment creation error:", error);
      return {
        success: false,
        error: error.message || "Failed to create shipment"
      };
    }
  }

  async trackShipment(shipmentId: string, config?: ShiprocketConfig): Promise<any> {
    try {
      if (!config) {
        config = await this.getConfig();
      }
      
      const token = await this.getAuthToken(config);

      const response = await axios.get(
        `${config.baseUrl}/courier/track/shipment/${shipmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Shiprocket tracking error:", error);
      throw error;
    }
  }

  async handleStatusWebhook(webhookData: any): Promise<void> {
    try {
      const { shipment_id, status, awb_code } = webhookData;

      // Find order by shipment ID
      const ordersSnap = await db.collection("orders")
        .where("delivery.shiprocket_shipment_id", "==", shipment_id.toString())
        .limit(1)
        .get();

      if (ordersSnap.empty) {
        console.log(`No order found for shipment ID: ${shipment_id}`);
        return;
      }

      const orderDoc = ordersSnap.docs[0];
      
      // Map Shiprocket status to our order status
      let orderStatus = 'Shipped';
      switch (status.toLowerCase()) {
        case 'shipped':
        case 'in_transit':
          orderStatus = 'Shipped';
          break;
        case 'out_for_delivery':
          orderStatus = 'Out for Delivery';
          break;
        case 'delivered':
          orderStatus = 'Delivered';
          break;
        case 'returned':
          orderStatus = 'Returned';
          break;
        case 'cancelled':
          orderStatus = 'Cancelled';
          break;
      }

      // Update order status
      const currentTimestamp = new Date();
      await orderDoc.ref.update({
        status: orderStatus,
        timeline: admin.firestore.FieldValue.arrayUnion({
          ts: currentTimestamp,
          actor: 'shiprocket',
          action: 'status_update',
          note: `Status updated to ${status}. AWB: ${awb_code}`
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error: any) {
      console.error("Shiprocket webhook processing error:", error);
      throw error;
    }
  }
}

export const shiprocketService = new ShiprocketService();
