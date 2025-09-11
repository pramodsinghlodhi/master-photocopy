import * as admin from "firebase-admin";

const db = admin.firestore();

interface TemplateParameters {
  [key: string]: string;
}

interface MessageTemplate {
  name: string;
  language: string;
  header_image?: string;
  fields: string[];
  bodyTemplate: string;
}

class NotificationService {
  async sendTemplatedMessage(data: {
    templateName: string;
    recipientPhone: string;
    parameters: TemplateParameters;
    language?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { templateName, recipientPhone, parameters, language = 'en' } = data;

      // Get template
      const template = await this.getTemplate(templateName, language);
      if (!template) {
        return { success: false, error: `Template ${templateName} not found` };
      }

      // Replace parameters in template
      let message = template.bodyTemplate;
      for (const [key, value] of Object.entries(parameters)) {
        const placeholder = `{${key}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
      }

      // Store message for audit/tracking
      await db.collection("messages").add({
        templateName,
        recipientPhone,
        message,
        parameters,
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Here you would integrate with your actual messaging service
      // For now, we'll just log the message
      console.log(`Message to ${recipientPhone}: ${message}`);

      return { success: true };
    } catch (error: any) {
      console.error("Send message error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendWhatsAppMessage(data: {
    phone_number: string;
    template_name: string;
    template_language?: string;
    header_image?: string;
    parameters: TemplateParameters;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // This would integrate with your WhatsApp Business API
      // Using the dynamic parameters format from your requirements
      
      const messagePayload = {
        from_phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID,
        phone_number: data.phone_number,
        template_name: data.template_name,
        template_language: data.template_language || 'en',
        header_image: data.header_image,
        ...this.mapParametersToFields(data.parameters)
      };

      // Store the message request
      await db.collection("whatsapp_messages").add({
        payload: messagePayload,
        status: 'queued',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Here you would make the actual API call to your WhatsApp service
      console.log(`WhatsApp message queued for ${data.phone_number}:`, messagePayload);

      return { success: true };
    } catch (error: any) {
      console.error("WhatsApp message error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendPushNotification(data: {
    userId: string;
    title: string;
    body: string;
    data?: { [key: string]: string };
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user's FCM tokens
      const userDoc = await db.collection("users").doc(data.userId).get();
      const userData = userDoc.data();
      
      if (!userData?.fcmTokens || userData.fcmTokens.length === 0) {
        return { success: false, error: "No FCM tokens found for user" };
      }

      const message = {
        notification: {
          title: data.title,
          body: data.body
        },
        data: data.data || {},
        tokens: userData.fcmTokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(userData.fcmTokens[idx]);
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          await db.collection("users").doc(data.userId).update({
            fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
          });
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("Push notification error:", error);
      return { success: false, error: error.message };
    }
  }

  private async getTemplate(name: string, language: string): Promise<MessageTemplate | null> {
    try {
      const templateDoc = await db.collection("templates").doc(`${name}_${language}`).get();
      
      if (templateDoc.exists) {
        return templateDoc.data() as MessageTemplate;
      }

      // Fallback to English if specific language not found
      if (language !== 'en') {
        const fallbackDoc = await db.collection("templates").doc(`${name}_en`).get();
        if (fallbackDoc.exists) {
          return fallbackDoc.data() as MessageTemplate;
        }
      }

      return null;
    } catch (error) {
      console.error("Get template error:", error);
      return null;
    }
  }

  private mapParametersToFields(parameters: TemplateParameters): any {
    // Map common parameters to WhatsApp template fields
    const mapped: any = {};
    
    // Standard fields
    if (parameters.first_name) mapped.field_1 = parameters.first_name;
    if (parameters.last_name) mapped.field_2 = parameters.last_name;
    if (parameters.email) mapped.field_3 = parameters.email;
    if (parameters.country) mapped.field_4 = parameters.country;
    if (parameters.language_code) mapped.field_5 = parameters.language_code;
    
    // Header field
    if (parameters.full_name) mapped.header_field_1 = parameters.full_name;
    
    // Button fields
    if (parameters.full_name) mapped.button_0 = parameters.full_name;
    if (parameters.phone_number) mapped.button_1 = parameters.phone_number;
    
    // Copy code
    if (parameters.copy_code) mapped.copy_code = parameters.copy_code;

    return mapped;
  }

  async createDefaultTemplates(): Promise<void> {
    const templates = [
      {
        name: 'order_assigned_en',
        data: {
          name: 'order_assigned',
          language: 'en',
          fields: ['first_name', 'orderId'],
          bodyTemplate: 'Hi {first_name}, you have been assigned a new order {orderId}. Please check your agent portal for details.',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      {
        name: 'delivery_otp_en',
        data: {
          name: 'delivery_otp',
          language: 'en',
          fields: ['first_name', 'orderId', 'copy_code'],
          bodyTemplate: 'Hi {first_name}, your delivery code for order {orderId} is {copy_code}. Please share this with the delivery agent.',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      {
        name: 'order_delivered_en',
        data: {
          name: 'order_delivered',
          language: 'en',
          fields: ['first_name', 'orderId'],
          bodyTemplate: 'Hi {first_name}, your order {orderId} has been successfully delivered. Thank you for your business!',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      {
        name: 'order_shipped_en',
        data: {
          name: 'order_shipped',
          language: 'en',
          fields: ['first_name', 'orderId', 'tracking_url'],
          bodyTemplate: 'Hi {first_name}, your order {orderId} has been shipped. Track it here: {tracking_url}',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      {
        name: 'order_processing_en',
        data: {
          name: 'order_processing',
          language: 'en',
          fields: ['first_name', 'orderId'],
          bodyTemplate: 'Hi {first_name}, your order {orderId} is now being processed. We will update you soon!',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }
    ];

    const batch = db.batch();
    for (const template of templates) {
      const ref = db.collection("templates").doc(template.name);
      batch.set(ref, template.data);
    }

    await batch.commit();
    console.log("Default templates created");
  }
}

export const notificationService = new NotificationService();
