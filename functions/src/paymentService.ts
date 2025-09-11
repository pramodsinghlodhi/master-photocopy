import * as admin from "firebase-admin";
import { PushNotificationService } from "./pushNotificationService";

export class PaymentService {
  private db = admin.firestore();
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = new PushNotificationService();
  }

  // Create Razorpay order
  async createRazorpayOrder(data: any): Promise<any> {
    try {
      const { orderId, amount, currency = 'INR' } = data;
      
      // Get Razorpay configuration
      const config = await this.getRazorpayConfig();
      
      const orderData = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: orderId,
        notes: {
          order_id: orderId,
          source: 'smart_photocopy'
        }
      };
      
      // In a real implementation, you would call Razorpay API here
      // For now, we'll simulate the response
      const razorpayOrder = {
        id: `order_${Date.now()}`,
        entity: 'order',
        amount: orderData.amount,
        amount_paid: 0,
        amount_due: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000)
      };
      
      // Save payment record
      await this.db.collection('payments').add({
        orderId,
        razorpay_order_id: razorpayOrder.id,
        amount: amount,
        currency,
        status: 'created',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, razorpayOrder };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  // Verify payment signature
  async verifyPayment(data: any): Promise<any> {
    try {
      const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;
      
      // In a real implementation, you would verify the signature using Razorpay webhook secret
      // For now, we'll simulate verification
      const isValid = true; // This should be actual signature verification
      
      if (isValid) {
        // Update payment record
        const paymentSnapshot = await this.db.collection('payments')
          .where('razorpay_order_id', '==', razorpay_order_id)
          .limit(1)
          .get();
        
        if (!paymentSnapshot.empty) {
          const paymentDoc = paymentSnapshot.docs[0];
          await paymentDoc.ref.update({
            razorpay_payment_id,
            razorpay_signature,
            status: 'paid',
            paid_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // Update order payment status
        await this.db.collection('orders').doc(orderId).update({
          payment_status: 'paid',
          razorpay_payment_id,
          paid_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Send payment confirmation notification
        await this.pushService.sendPaymentConfirmation(orderId);
        
        return { success: true, verified: true };
      } else {
        return { success: false, error: 'Invalid payment signature' };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Handle payment webhook
  async handlePaymentWebhook(data: any): Promise<any> {
    try {
      const { event, payload } = data;
      
      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'order.paid':
          await this.handleOrderPaid(payload);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }
      
      return { success: true, event };
    } catch (error) {
      console.error('Error handling payment webhook:', error);
      throw error;
    }
  }

  // Handle payment captured
  private async handlePaymentCaptured(payload: any): Promise<void> {
    const { payment } = payload;
    
    // Find payment record
    const paymentSnapshot = await this.db.collection('payments')
      .where('razorpay_payment_id', '==', payment.id)
      .limit(1)
      .get();
    
    if (!paymentSnapshot.empty) {
      const paymentDoc = paymentSnapshot.docs[0];
      const paymentData = paymentDoc.data();
      
      // Update payment status
      await paymentDoc.ref.update({
        status: 'captured',
        captured_at: admin.firestore.FieldValue.serverTimestamp(),
        amount_captured: payment.amount / 100
      });
      
      // Update order
      await this.db.collection('orders').doc(paymentData.orderId).update({
        payment_status: 'captured',
        amount_captured: payment.amount / 100
      });
    }
  }

  // Handle payment failed
  private async handlePaymentFailed(payload: any): Promise<void> {
    const { payment } = payload;
    
    // Find payment record
    const paymentSnapshot = await this.db.collection('payments')
      .where('razorpay_payment_id', '==', payment.id)
      .limit(1)
      .get();
    
    if (!paymentSnapshot.empty) {
      const paymentDoc = paymentSnapshot.docs[0];
      const paymentData = paymentDoc.data();
      
      // Update payment status
      await paymentDoc.ref.update({
        status: 'failed',
        failed_at: admin.firestore.FieldValue.serverTimestamp(),
        failure_reason: payment.error_description
      });
      
      // Update order
      await this.db.collection('orders').doc(paymentData.orderId).update({
        payment_status: 'failed',
        payment_failure_reason: payment.error_description
      });
      
      // Send failure notification
      const orderDoc = await this.db.collection('orders').doc(paymentData.orderId).get();
      const order = orderDoc.data();
      
      if (order) {
        const notification = {
          title: "Payment Failed ❌",
          body: `Payment for order #${paymentData.orderId} failed. Please try again.`,
          data: {
            orderId: paymentData.orderId,
            type: "payment_failed"
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
  }

  // Handle order paid
  private async handleOrderPaid(payload: any): Promise<void> {
    const { order } = payload;
    
    // Find order by receipt
    const orderDoc = await this.db.collection('orders').doc(order.receipt).get();
    
    if (orderDoc.exists) {
      await orderDoc.ref.update({
        payment_status: 'paid',
        paid_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Send confirmation
      await this.pushService.sendPaymentConfirmation(order.receipt);
    }
  }

  // Process refund
  async processRefund(data: any): Promise<any> {
    try {
      const { orderId, amount, reason } = data;
      
      // Get payment record
      const paymentSnapshot = await this.db.collection('payments')
        .where('orderId', '==', orderId)
        .where('status', '==', 'paid')
        .limit(1)
        .get();
      
      if (paymentSnapshot.empty) {
        return { success: false, error: 'No paid payment found for this order' };
      }
      
      const paymentDoc = paymentSnapshot.docs[0];
      const payment = paymentDoc.data();
      
      // In a real implementation, you would call Razorpay refund API here
      const refund = {
        id: `rfnd_${Date.now()}`,
        payment_id: payment.razorpay_payment_id,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        status: 'processed',
        created_at: Math.floor(Date.now() / 1000)
      };
      
      // Create refund record
      await this.db.collection('refunds').add({
        orderId,
        payment_id: payment.razorpay_payment_id,
        razorpay_refund_id: refund.id,
        amount,
        reason,
        status: 'processed',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update order
      await this.db.collection('orders').doc(orderId).update({
        refund_status: 'processed',
        refund_amount: amount,
        refunded_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Send refund notification
      const orderDoc = await this.db.collection('orders').doc(orderId).get();
      const order = orderDoc.data();
      
      if (order) {
        const notification = {
          title: "Refund Processed ✅",
          body: `Refund of ₹${amount} for order #${orderId} has been processed.`,
          data: {
            orderId,
            amount: amount.toString(),
            type: "refund_processed"
          }
        };
        
        await this.pushService.sendCustomNotification({
          userId: order.customer.phone_number,
          title: notification.title,
          body: notification.body,
          customData: notification.data
        });
      }
      
      return { success: true, refund };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(dateRange: any): Promise<any> {
    try {
      const { startDate, endDate } = dateRange;
      
      const paymentsSnapshot = await this.db.collection('payments')
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', endDate)
        .get();
      
      const payments = paymentsSnapshot.docs.map(doc => doc.data());
      
      const analytics = {
        totalTransactions: payments.length,
        totalAmount: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        successfulPayments: payments.filter(p => p.status === 'paid').length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        pendingPayments: payments.filter(p => p.status === 'created').length,
        successRate: payments.length > 0 ? 
          (payments.filter(p => p.status === 'paid').length / payments.length * 100).toFixed(2) : 0,
        averageTransactionAmount: payments.length > 0 ? 
          payments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / payments.length : 0,
        paymentMethods: this.getPaymentMethodBreakdown(payments),
        hourlyDistribution: this.getHourlyDistribution(payments)
      };
      
      return analytics;
    } catch (error) {
      console.error('Error getting payment analytics:', error);
      throw error;
    }
  }

  // Get payment method breakdown
  private getPaymentMethodBreakdown(payments: any[]): any {
    const breakdown: any = {};
    payments.forEach(payment => {
      const method = payment.payment_method || 'unknown';
      breakdown[method] = (breakdown[method] || 0) + 1;
    });
    return breakdown;
  }

  // Get hourly distribution
  private getHourlyDistribution(payments: any[]): any {
    const distribution: any = {};
    payments.forEach(payment => {
      if (payment.created_at && payment.created_at.toDate) {
        const hour = payment.created_at.toDate().getHours();
        distribution[hour] = (distribution[hour] || 0) + 1;
      }
    });
    return distribution;
  }

  // Get Razorpay configuration
  private async getRazorpayConfig(): Promise<any> {
    try {
      const configDoc = await this.db.collection('settings').doc('razorpay').get();
      
      if (configDoc.exists) {
        return configDoc.data();
      }
      
      // Fallback to environment variables
      return {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
        webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET
      };
    } catch (error) {
      console.error('Error getting Razorpay config:', error);
      throw error;
    }
  }

  // Validate payment amount
  async validatePaymentAmount(orderId: string, amount: number): Promise<boolean> {
    try {
      const orderDoc = await this.db.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        return false;
      }
      
      const order = orderDoc.data();
      const expectedAmount = order?.totals?.total || 0;
      
      // Allow for small discrepancies (1 rupee) due to rounding
      return Math.abs(expectedAmount - amount) <= 1;
    } catch (error) {
      console.error('Error validating payment amount:', error);
      return false;
    }
  }

  // Get payment history for order
  async getOrderPaymentHistory(orderId: string): Promise<any> {
    try {
      const paymentsSnapshot = await this.db.collection('payments')
        .where('orderId', '==', orderId)
        .orderBy('created_at', 'desc')
        .get();
      
      const payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get refunds
      const refundsSnapshot = await this.db.collection('refunds')
        .where('orderId', '==', orderId)
        .orderBy('created_at', 'desc')
        .get();
      
      const refunds = refundsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        payments,
        refunds
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  // Handle payment timeout
  async handlePaymentTimeout(orderId: string): Promise<void> {
    try {
      // Update order status
      await this.db.collection('orders').doc(orderId).update({
        payment_status: 'timeout',
        status: 'Cancelled',
        cancelled_reason: 'Payment timeout',
        cancelled_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get order details
      const orderDoc = await this.db.collection('orders').doc(orderId).get();
      const order = orderDoc.data();
      
      if (order) {
        const notification = {
          title: "Payment Timeout ⏰",
          body: `Payment for order #${orderId} has timed out. The order has been cancelled.`,
          data: {
            orderId,
            type: "payment_timeout"
          }
        };
        
        await this.pushService.sendCustomNotification({
          userId: order.customer.phone_number,
          title: notification.title,
          body: notification.body,
          customData: notification.data
        });
      }
    } catch (error) {
      console.error('Error handling payment timeout:', error);
    }
  }
}
