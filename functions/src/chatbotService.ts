import * as admin from "firebase-admin";

export class ChatbotService {
  private db = admin.firestore();

  // Process incoming message and generate response
  async processMessage(data: any): Promise<any> {
    const { senderId, message, context = {} } = data;
    
    try {
      // Save incoming message
      await this.saveMessage(senderId, message, 'user');
      
      // Get user context
      const userContext = await this.getUserContext(senderId);
      
      // Generate response based on message content
      const response = await this.generateResponse(message, {
        ...userContext,
        ...context
      });
      
      // Save bot response
      await this.saveMessage(senderId, response.text, 'bot');
      
      return response;
    } catch (error: any) {
      console.error('Error processing chatbot message:', error);
      return {
        text: "I'm sorry, I'm having trouble understanding. Please try again or contact our support team.",
        type: 'error'
      };
    }
  }

  // Generate contextual response
  private async generateResponse(message: string, context: any): Promise<any> {
    const lowerMessage = message.toLowerCase();
    
    // Order status inquiries
    if (this.isOrderStatusInquiry(lowerMessage)) {
      return await this.handleOrderStatusInquiry(message, context);
    }
    
    // Pricing inquiries
    if (this.isPricingInquiry(lowerMessage)) {
      return await this.handlePricingInquiry(message, context);
    }
    
    // Service inquiries
    if (this.isServiceInquiry(lowerMessage)) {
      return await this.handleServiceInquiry(message, context);
    }
    
    // Order placement
    if (this.isOrderPlacement(lowerMessage)) {
      return await this.handleOrderPlacement(message, context);
    }
    
    // Support requests
    if (this.isSupportRequest(lowerMessage)) {
      return await this.handleSupportRequest(message, context);
    }
    
    // Greetings
    if (this.isGreeting(lowerMessage)) {
      return await this.handleGreeting(message, context);
    }
    
    // Default response with suggestions
    return this.getDefaultResponse(context);
  }

  // Check if message is about order status
  private isOrderStatusInquiry(message: string): boolean {
    const keywords = ['order', 'status', 'track', 'where', 'delivery', 'shipped', 'delivered'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle order status inquiries
  private async handleOrderStatusInquiry(message: string, context: any): Promise<any> {
    try {
      // Extract order ID if mentioned
      const orderIdMatch = message.match(/\b[A-Z0-9]{6,}\b/);
      
      if (orderIdMatch) {
        const orderId = orderIdMatch[0];
        const orderDoc = await this.db.collection('orders').doc(orderId).get();
        
        if (orderDoc.exists) {
          const order = orderDoc.data();
          return {
            text: `Your order #${orderId} is currently ${order?.status}. ${this.getStatusMessage(order?.status)}`,
            type: 'order_status',
            data: { orderId, status: order?.status }
          };
        } else {
          return {
            text: `I couldn't find order #${orderId}. Please check the order ID and try again.`,
            type: 'order_not_found'
          };
        }
      } else {
        // Get recent orders for user
        const recentOrders = await this.getRecentOrders(context.userId);
        
        if (recentOrders.length > 0) {
          const ordersList = recentOrders.map(order => 
            `#${order.orderId}: ${order.status}`
          ).join('\n');
          
          return {
            text: `Here are your recent orders:\n${ordersList}\n\nWhich order would you like to track?`,
            type: 'recent_orders',
            data: { orders: recentOrders }
          };
        } else {
          return {
            text: "You don't have any recent orders. Would you like to place a new order?",
            type: 'no_orders'
          };
        }
      }
    } catch (error: any) {
      console.error('Error handling order status inquiry:', error);
      return {
        text: "I'm having trouble checking your order status. Please try again later.",
        type: 'error'
      };
    }
  }

  // Check if message is about pricing
  private isPricingInquiry(message: string): boolean {
    const keywords = ['price', 'cost', 'rate', 'charge', 'how much', 'pricing'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle pricing inquiries
  private async handlePricingInquiry(message: string, context: any): Promise<any> {
    const pricingInfo = `📋 **Our Pricing:**

**Black & White:**
• Single-sided: ₹2 per page
• Double-sided: ₹3 per page

**Color:**
• Single-sided: ₹8 per page
• Double-sided: ₹12 per page

**Additional Services:**
• Binding: ₹20-50
• Lamination: ₹10-30 per page
• Spiral Binding: ₹30

**Delivery:**
• Free delivery for orders above ₹100
• Delivery charge: ₹30 for orders below ₹100

Would you like to place an order?`;

    return {
      text: pricingInfo,
      type: 'pricing_info',
      data: { showOrderButton: true }
    };
  }

  // Check if message is about services
  private isServiceInquiry(message: string): boolean {
    const keywords = ['service', 'what do you', 'what can', 'help', 'offer'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle service inquiries
  private async handleServiceInquiry(message: string, context: any): Promise<any> {
    const servicesInfo = `🖨️ **Smart Photocopy Services:**

**Printing:**
• Documents (PDF, Word, Excel)
• Photos & Images
• Black & White / Color printing
• Single/Double sided options

**Binding & Finishing:**
• Spiral binding
• Comb binding
• Lamination
• Stapling

**Digital Services:**
• Scan to PDF
• Document conversion
• Photo printing from digital files

**Delivery:**
• Same-day delivery available
• Free delivery above ₹100
• Live tracking

How can I help you today?`;

    return {
      text: servicesInfo,
      type: 'services_info',
      data: { showOrderButton: true }
    };
  }

  // Check if message is about placing order
  private isOrderPlacement(message: string): boolean {
    const keywords = ['order', 'print', 'want to', 'need', 'can you print'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle order placement
  private async handleOrderPlacement(message: string, context: any): Promise<any> {
    return {
      text: `I'd be happy to help you place an order! 📋

To get started:
1. Upload your documents using our order form
2. Select your printing preferences
3. Choose delivery option
4. Complete payment

Click the "Place Order" button below to start, or visit our website.

Need help with anything specific about your order?`,
      type: 'order_placement',
      data: { 
        showOrderButton: true,
        actions: ['place_order', 'upload_files']
      }
    };
  }

  // Check if message is support request
  private isSupportRequest(message: string): boolean {
    const keywords = ['help', 'problem', 'issue', 'support', 'contact', 'complain'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle support requests
  private async handleSupportRequest(message: string, context: any): Promise<any> {
    return {
      text: `I'm here to help! 🤝

**Quick Support:**
• Order issues: Share your order ID
• Technical problems: Describe what's happening
• General questions: Just ask!

**Contact Support:**
📞 Phone: +91-XXXXXXXXXX
📧 Email: support@smartphotocopy.com
⏰ Hours: 9 AM - 9 PM (Mon-Sun)

**Live Chat:**
If you need immediate assistance, I can connect you with a human agent.

What specific issue are you facing?`,
      type: 'support_info',
      data: { 
        showContactButton: true,
        actions: ['contact_agent', 'call_support']
      }
    };
  }

  // Check if message is greeting
  private isGreeting(message: string): boolean {
    const keywords = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle greetings
  private async handleGreeting(message: string, context: any): Promise<any> {
    const hour = new Date().getHours();
    let timeGreeting = 'Hello';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    const userName = context.userName || 'there';

    return {
      text: `${timeGreeting} ${userName}! 👋

Welcome to Smart Photocopy! I'm here to help you with:

🖨️ **Place Orders** - Upload and print documents
📋 **Track Orders** - Check status and delivery
💰 **Pricing Info** - Get cost estimates
🚚 **Delivery** - Schedule and track deliveries
🆘 **Support** - Get help with any issues

What can I help you with today?`,
      type: 'greeting',
      data: {
        showQuickActions: true,
        actions: ['place_order', 'track_order', 'pricing', 'support']
      }
    };
  }

  // Get default response with suggestions
  private getDefaultResponse(context: any): any {
    return {
      text: `I'd be happy to help! Here are some things I can assist you with:

🖨️ **"Place an order"** - Upload and print documents
📋 **"Track my order"** - Check order status
💰 **"What are your prices?"** - Get pricing info
🚚 **"Delivery options"** - Learn about delivery
🆘 **"I need help"** - Contact support

You can also type your question and I'll do my best to help!`,
      type: 'default_response',
      data: {
        suggestions: [
          'Place an order',
          'Track my order',
          'What are your prices?',
          'I need help'
        ]
      }
    };
  }

  // Get status message for order
  private getStatusMessage(status: string): string {
    const messages = {
      'Pending': 'We\'ve received your order and are reviewing it.',
      'Processing': 'Your documents are being prepared for printing.',
      'Printed': 'Your order has been printed and is ready for delivery.',
      'Shipped': 'Your order is on its way to you.',
      'Out for Delivery': 'Your order will be delivered shortly.',
      'Delivered': 'Your order has been successfully delivered!',
      'Cancelled': 'This order has been cancelled.'
    };
    
    return messages[status as keyof typeof messages] || 'Status updated.';
  }

  // Get user context
  private async getUserContext(userId: string): Promise<any> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data() : {};
    } catch (error: any) {
      console.error('Error getting user context:', error);
      return {};
    }
  }

  // Get recent orders for user
  private async getRecentOrders(userId: string): Promise<any[]> {
    try {
      const ordersSnapshot = await this.db.collection('orders')
        .where('customer.uid', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      return ordersSnapshot.docs.map(doc => ({
        orderId: doc.id,
        ...doc.data()
      }));
    } catch (error: any) {
      console.error('Error getting recent orders:', error);
      return [];
    }
  }

  // Save message to chat history
  private async saveMessage(userId: string, message: string, sender: 'user' | 'bot'): Promise<void> {
    try {
      await this.db.collection('chat_messages').add({
        userId,
        message,
        sender,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error: any) {
      console.error('Error saving chat message:', error);
    }
  }

  // Get chat history
  async getChatHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const messagesSnapshot = await this.db.collection('chat_messages')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      return messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
    } catch (error: any) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  // Handle file upload for order
  async handleFileUpload(data: any): Promise<any> {
    const { userId, fileUrl, fileName, fileType } = data;
    
    try {
      // Create a draft order with the uploaded file
      const orderRef = await this.db.collection('draft_orders').add({
        userId,
        files: [{
          url: fileUrl,
          name: fileName,
          type: fileType,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp()
        }],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        text: `Great! I've received your file "${fileName}". 

Now let me help you set up your printing preferences:

🖨️ **Printing Options:**
• Black & White or Color?
• Single-sided or Double-sided?
• Number of copies?

📦 **Binding/Finishing:**
• Spiral binding?
• Lamination?

Just let me know your preferences or click "Configure Order" below!`,
        type: 'file_uploaded',
        data: {
          draftOrderId: orderRef.id,
          fileName,
          showConfigButton: true,
          actions: ['configure_order', 'add_more_files']
        }
      };
    } catch (error: any) {
      console.error('Error handling file upload:', error);
      return {
        text: "Sorry, there was an error processing your file. Please try again.",
        type: 'error'
      };
    }
  }

  // Clean up old chat messages
  async cleanupOldMessages(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldMessages = await this.db.collection('chat_messages')
      .where('timestamp', '<', thirtyDaysAgo)
      .limit(500)
      .get();

    const batch = this.db.batch();
    oldMessages.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldMessages.size} old chat messages`);
  }
}
