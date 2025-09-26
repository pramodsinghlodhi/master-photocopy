import * as admin from "firebase-admin";
import { PushNotificationService } from "./pushNotificationService";

export class PaymentService {
  private db = admin.firestore();
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = new PushNotificationService();
  }

  // Create Razorpay order with complete error handling
  async createRazorpayOrder(data: any): Promise<any> {
    try {
      const { orderId, amount, currency = 'INR', customerId, notes = {} } = data;
      
      // Validate input
      if (!orderId || !amount || amount <= 0) {
        throw new Error('Invalid order data: orderId and positive amount are required');
      }
      
      // Get Razorpay configuration
      const config = await this.getRazorpayConfig();
      
      const orderData = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt: orderId,
        notes: {
          order_id: orderId,
          source: 'master_photocopy',
          customer_id: customerId || 'unknown',
          timestamp: new Date().toISOString(),
          ...notes
        },
        payment_capture: 1 // Auto-capture payment
      };
      
      let razorpayOrder;
      
      // Try to create actual Razorpay order
      if (config.keyId !== 'rzp_test_dummy_key') {
        try {
          const Razorpay = require('razorpay');
          const razorpay = new Razorpay({
            key_id: config.keyId,
            key_secret: config.keySecret,
          });
          
          razorpayOrder = await razorpay.orders.create(orderData);
          console.log('Razorpay order created successfully:', razorpayOrder.id);
        } catch (razorpayError: any) {
          console.error('Razorpay API Error:', razorpayError);
          throw razorpayError;
        }
      } else {
        // Create mock order for development/testing
        razorpayOrder = {
          id: `order_dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entity: 'order',
          amount: orderData.amount,
          amount_paid: 0,
          amount_due: orderData.amount,
          currency: orderData.currency,
          receipt: orderData.receipt,
          status: 'created',
          created_at: Math.floor(Date.now() / 1000),
          notes: orderData.notes
        };
        
        console.log('Using mock Razorpay order for development:', razorpayOrder.id);
      }
      
      // Save payment record with comprehensive tracking
      const paymentRecord = {
        orderId,
        razorpay_order_id: razorpayOrder.id,
        amount: amount,
        amount_paise: razorpayOrder.amount,
        currency,
        status: 'created',
        razorpay_response: razorpayOrder,
        customer_id: customerId || 'unknown',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          source: 'master_photocopy_app',
          version: '1.0.0',
          created_by: 'payment_service',
          environment: process.env.NODE_ENV || 'development'
        },
        tracking: {
          attempts: 0,
          last_attempt_at: null,
          completion_time: null
        }
      };
      
      await this.db.collection('payments').add(paymentRecord);
      
      // Update order with payment information
      await this.db.collection('orders').doc(orderId).update({
        'payment.razorpay_order_id': razorpayOrder.id,
        'payment.status': 'Pending',
        'payment.created_at': admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { 
        success: true, 
        razorpayOrder,
        orderId,
        amount: amount, // Keep original amount for frontend
        currency: razorpayOrder.currency,
        payment_order_id: razorpayOrder.id
      };
      
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      
      // Log error for debugging
      await this.logPaymentError('create_order', {
        orderId: data.orderId,
        amount: data.amount,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message || 'Failed to create payment order',
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency || 'INR'
      };
    }
  }

  // Verify payment signature with proper validation
  async verifyPayment(data: any): Promise<any> {
    try {
      const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;
      
      if (!orderId || !razorpay_payment_id || !razorpay_order_id) {
        return { success: false, error: 'Missing required payment verification data' };
      }
      
      // Get Razorpay config for signature verification
      const config = await this.getRazorpayConfig();
      
      let isValid = false;
      
      // Perform actual signature verification if we have real keys
      if (config.keySecret !== 'dummy_secret') {
        const crypto = require('crypto');
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac('sha256', config.keySecret)
          .update(body.toString())
          .digest('hex');
        
        isValid = expectedSignature === razorpay_signature;
      } else {
        // For development/testing, consider signature valid
        isValid = true;
        console.log('Using mock signature verification for development');
      }
      
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
            verified_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            'tracking.completion_time': admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // Update order payment status
        const currentTimestamp = new Date();
        await this.db.collection('orders').doc(orderId).update({
          'payment.status': 'Paid',
          'payment.razorpay_payment_id': razorpay_payment_id,
          'payment.razorpay_signature': razorpay_signature,
          'payment.paid_at': admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          // Add to timeline with regular Date object (not serverTimestamp inside array)
          timeline: admin.firestore.FieldValue.arrayUnion({
            ts: currentTimestamp,
            actor: 'payment_system',
            action: 'Payment completed successfully'
          })
        });
        
        // Send payment confirmation notification
        try {
          await this.pushService.sendPaymentConfirmation(orderId);
        } catch (notificationError) {
          console.error('Payment notification failed:', notificationError);
          // Don't fail the whole payment verification for notification errors
        }
        
        return { success: true, verified: true, orderId, payment_id: razorpay_payment_id };
        
      } else {
        // Log failed verification attempt
        await this.logPaymentError('signature_verification_failed', {
          orderId,
          razorpay_order_id,
          razorpay_payment_id
        });
        
        return { 
          success: false, 
          error: 'Payment signature verification failed',
          verified: false 
        };
      }
      
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      
      await this.logPaymentError('verification_error', {
        orderId: data.orderId,
        error: error.message
      });
      
      return { 
        success: false, 
        error: error.message || 'Payment verification failed',
        verified: false 
      };
    }
  }

  // Handle payment webhooks
  async handlePaymentWebhook(data: any): Promise<any> {
    try {
      const { event, payload } = data;
      
      console.log('Processing Razorpay webhook:', event);
      
      switch (event) {
        case 'payment.captured':
          return await this.handlePaymentCaptured(payload);
        case 'payment.failed':
          return await this.handlePaymentFailed(payload);
        case 'order.paid':
          return await this.handleOrderPaid(payload);
        case 'payment.refunded':
          return await this.handlePaymentRefunded(payload);
        default:
          console.log('Unhandled webhook event:', event);
          return { success: true, message: 'Event acknowledged but not processed' };
      }
      
    } catch (error: any) {
      console.error('Error handling payment webhook:', error);
      
      await this.logPaymentError('webhook_processing_error', {
        event: data.event,
        error: error.message
      });
      
      return { 
        success: false, 
        error: error.message || 'Webhook processing failed' 
      };
    }
  }

  // Process refunds
  async processRefund(data: any): Promise<any> {
    try {
      const { paymentId, amount, reason, orderId } = data;
      
      if (!paymentId || !amount) {
        return { 
          success: false, 
          error: 'Payment ID and refund amount are required' 
        };
      }
      
      const config = await this.getRazorpayConfig();
      
      let refundResult;
      
      // Process actual refund if we have real keys
      if (config.keySecret !== 'dummy_secret') {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: config.keyId,
          key_secret: config.keySecret,
        });
        
        refundResult = await razorpay.payments.refund(paymentId, {
          amount: Math.round(amount * 100), // Amount in paise
          speed: 'normal',
          notes: {
            reason: reason || 'Customer request',
            order_id: orderId,
            processed_by: 'payment_service'
          }
        });
      } else {
        // Mock refund for development
        refundResult = {
          id: `rfnd_dev_${Date.now()}`,
          entity: 'refund',
          amount: Math.round(amount * 100),
          currency: 'INR',
          payment_id: paymentId,
          status: 'processed',
          created_at: Math.floor(Date.now() / 1000)
        };
      }
      
      // Record refund in database
      await this.db.collection('refunds').add({
        refund_id: refundResult.id,
        payment_id: paymentId,
        order_id: orderId,
        amount: amount,
        reason: reason || 'Customer request',
        status: refundResult.status || 'processed',
        razorpay_response: refundResult,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        processed_by: 'payment_service'
      });
      
      // Update order status
      if (orderId) {
        await this.db.collection('orders').doc(orderId).update({
          'payment.status': 'Refunded',
          'payment.refund_id': refundResult.id,
          'payment.refunded_at': admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return { 
        success: true, 
        refund: refundResult,
        amount: amount,
        refund_id: refundResult.id 
      };
      
    } catch (error: any) {
      console.error('Error processing refund:', error);
      
      await this.logPaymentError('refund_processing_error', {
        paymentId: data.paymentId,
        orderId: data.orderId,
        amount: data.amount,
        error: error.message
      });
      
      return { 
        success: false, 
        error: error.message || 'Refund processing failed' 
      };
    }
  }

  // Get Razorpay configuration with proper fallback
  private async getRazorpayConfig(): Promise<any> {
    try {
      // Try to get from Firestore settings first
      const settingsDoc = await this.db.collection('settings').doc('payments').get();
      
      if (settingsDoc.exists) {
        const settings = settingsDoc.data();
        if (settings?.razorpay?.keyId && settings?.razorpay?.keySecret) {
          return {
            keyId: settings.razorpay.keyId,
            keySecret: settings.razorpay.keySecret,
            webhookSecret: settings.razorpay.webhookSecret
          };
        }
      }
      
      // Fallback to environment variables
      const config = {
        keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
        keySecret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret'
      };
      
      return config;
      
    } catch (error: any) {
      console.error('Error getting Razorpay config:', error);
      
      // Return safe test credentials as fallback
      return {
        keyId: 'rzp_test_dummy_key',
        keySecret: 'dummy_secret',
        webhookSecret: 'dummy_webhook_secret'
      };
    }
  }

  // Handle payment captured webhook
  private async handlePaymentCaptured(payload: any): Promise<void> {
    const paymentData = payload.payment?.entity || payload;
    const orderId = paymentData.notes?.order_id;
    
    if (orderId) {
      await this.db.collection('orders').doc(orderId).update({
        'payment.status': 'Paid',
        'payment.captured_at': admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Trigger order processing workflow
      await this.pushService.sendPaymentConfirmation(orderId);
    }
  }

  // Handle payment failed webhook
  private async handlePaymentFailed(payload: any): Promise<void> {
    const paymentData = payload.payment?.entity || payload;
    const orderId = paymentData.notes?.order_id;
    
    if (orderId) {
      await this.db.collection('orders').doc(orderId).update({
        'payment.status': 'Failed',
        'payment.failed_at': admin.firestore.FieldValue.serverTimestamp(),
        'payment.error_description': paymentData.error_description || 'Payment failed',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // Handle order paid webhook
  private async handleOrderPaid(payload: any): Promise<void> {
    const orderData = payload.order?.entity || payload;
    const orderId = orderData.receipt;
    
    if (orderId) {
      await this.db.collection('orders').doc(orderId).update({
        'payment.status': 'Paid',
        'payment.order_paid_at': admin.firestore.FieldValue.serverTimestamp(),
        status: 'Processing', // Move order to processing
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // Handle payment refunded webhook
  private async handlePaymentRefunded(payload: any): Promise<void> {
    const refundData = payload.refund?.entity || payload;
    const paymentId = refundData.payment_id;
    
    // Find order by payment ID
    const paymentsSnapshot = await this.db.collection('payments')
      .where('razorpay_payment_id', '==', paymentId)
      .limit(1)
      .get();
    
    if (!paymentsSnapshot.empty) {
      const paymentDoc = paymentsSnapshot.docs[0];
      const orderId = paymentDoc.data().orderId;
      
      if (orderId) {
        await this.db.collection('orders').doc(orderId).update({
          'payment.status': 'Refunded',
          'payment.refunded_at': admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  }

  // Log payment errors for debugging
  private async logPaymentError(errorType: string, details: any): Promise<void> {
    try {
      await this.db.collection('payment_errors').add({
        error_type: errorType,
        details,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (loggingError) {
      console.error('Failed to log payment error:', loggingError);
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      let query = this.db.collection('payments').orderBy('created_at', 'desc');
      
      if (dateRange) {
        query = query
          .where('created_at', '>=', dateRange.start)
          .where('created_at', '<=', dateRange.end);
      }
      
      const paymentsSnapshot = await query.get();
      const payments = paymentsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as any[];
      
      // Calculate analytics
      const totalPayments = payments.length;
      const successfulPayments = payments.filter((p: any) => p.status === 'paid').length;
      const failedPayments = payments.filter((p: any) => p.status === 'failed').length;
      const pendingPayments = payments.filter((p: any) => p.status === 'created' || p.status === 'pending').length;
      
      const totalAmount = payments
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      return {
        success: true,
        analytics: {
          total_payments: totalPayments,
          successful_payments: successfulPayments,
          failed_payments: failedPayments,
          pending_payments: pendingPayments,
          success_rate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
          total_amount: totalAmount,
          average_order_value: successfulPayments > 0 ? totalAmount / successfulPayments : 0
        }
      };
      
    } catch (error: any) {
      console.error('Error getting payment analytics:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get payment analytics' 
      };
    }
  }
}