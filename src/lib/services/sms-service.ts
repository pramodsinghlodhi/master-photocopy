// SMS Service with multiple providers
interface SMSConfig {
  enabled: boolean;
  provider: 'firebase' | 'twilio' | 'fast2sms' | 'textlocal' | 'msg91';
  apiKey?: string;
  from?: string;
  senderId?: string;
}

interface SMSData {
  to: string;
  message: string;
  template?: string;
  templateData?: any;
}

interface OTPConfig {
  enabled: boolean;
  provider: 'firebase' | 'custom';
  length: number;
  expiry: number; // minutes
  template?: string;
}

class SMSService {
  private config: SMSConfig;
  private otpConfig: OTPConfig;

  constructor(smsConfig: SMSConfig, otpConfig: OTPConfig) {
    this.config = smsConfig;
    this.otpConfig = otpConfig;
  }

  async sendSMS(data: SMSData): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('SMS service is disabled');
      return false;
    }

    try {
      switch (this.config.provider) {
        case 'firebase':
          return await this.sendFirebaseSMS(data);
        case 'twilio':
          return await this.sendTwilioSMS(data);
        case 'fast2sms':
          return await this.sendFast2SMS(data);
        case 'textlocal':
          return await this.sendTextlocalSMS(data);
        case 'msg91':
          return await this.sendMsg91SMS(data);
        default:
          throw new Error(`Unsupported SMS provider: ${this.config.provider}`);
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  private async sendFirebaseSMS(data: SMSData): Promise<boolean> {
    // Firebase SMS through Functions
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'firebase',
          ...data,
          from: this.config.from
        })
      });
      return response.ok;
    } catch (error: any) {
      console.error('Firebase SMS error:', error);
      return false;
    }
  }

  private async sendTwilioSMS(data: SMSData): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('Twilio API key not configured');
    }

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'twilio',
          ...data,
          from: this.config.from
        })
      });
      return response.ok;
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      return false;
    }
  }

  private async sendFast2SMS(data: SMSData): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('Fast2SMS API key not configured');
    }

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: this.config.senderId || 'FSTSMS',
          message: data.message,
          language: 'english',
          flash: 0,
          numbers: data.to
        })
      });

      const result = await response.json();
      return result.return === true;
    } catch (error: any) {
      console.error('Fast2SMS error:', error);
      return false;
    }
  }

  private async sendTextlocalSMS(data: SMSData): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('Textlocal API key not configured');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('apikey', this.config.apiKey);
      formData.append('numbers', data.to);
      formData.append('message', data.message);
      formData.append('sender', this.config.senderId || 'TXTLCL');

      const response = await fetch('https://api.textlocal.in/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const result = await response.json();
      return result.status === 'success';
    } catch (error: any) {
      console.error('Textlocal SMS error:', error);
      return false;
    }
  }

  private async sendMsg91SMS(data: SMSData): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('MSG91 API key not configured');
    }

    try {
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          flow_id: 'your_flow_id',
          sender: this.config.senderId || 'MSG91',
          mobiles: data.to,
          message: data.message
        })
      });

      const result = await response.json();
      return result.type === 'success';
    } catch (error: any) {
      console.error('MSG91 SMS error:', error);
      return false;
    }
  }

  // OTP Generation and Management
  generateOTP(): string {
    const length = this.otpConfig.length || 6;
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  async sendOTP(phoneNumber: string, customMessage?: string): Promise<{ success: boolean; otp?: string }> {
    if (!this.otpConfig.enabled) {
      return { success: false };
    }

    try {
      const otp = this.generateOTP();
      const message = customMessage || `Your Master PhotoCopy OTP is: ${otp}. Valid for ${this.otpConfig.expiry} minutes. Do not share with anyone.`;

      const sent = await this.sendSMS({
        to: phoneNumber,
        message
      });

      if (sent) {
        // Store OTP in cache/database with expiry
        await this.storeOTP(phoneNumber, otp);
        return { success: true, otp };
      }

      return { success: false };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return { success: false };
    }
  }

  private async storeOTP(phoneNumber: string, otp: string): Promise<void> {
    try {
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + this.otpConfig.expiry);

      // Store in your preferred storage (Redis, Firestore, etc.)
      await fetch('/api/otp/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          otp,
          expiryTime: expiryTime.toISOString()
        })
      });
    } catch (error: any) {
      console.error('Error storing OTP:', error);
    }
  }

  async verifyOTP(phoneNumber: string, enteredOTP: string): Promise<boolean> {
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          otp: enteredOTP
        })
      });

      const result = await response.json();
      return result.valid === true;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  // Predefined SMS templates
  async sendWelcomeSMS(phoneNumber: string, name: string): Promise<boolean> {
    return this.sendSMS({
      to: phoneNumber,
      message: `Welcome to Master PhotoCopy, ${name}! Start uploading documents for printing. Need help? Contact support.`
    });
  }

  async sendOrderConfirmationSMS(phoneNumber: string, orderDetails: any): Promise<boolean> {
    return this.sendSMS({
      to: phoneNumber,
      message: `Order ${orderDetails.orderId} confirmed! Amount: ₹${orderDetails.total}. Payment: ${orderDetails.paymentMethod}. Track at masterphotocopy.com`
    });
  }

  async sendOrderUpdateSMS(phoneNumber: string, orderId: string, status: string): Promise<boolean> {
    return this.sendSMS({
      to: phoneNumber,
      message: `Order Update: Your order ${orderId} is now ${status}. Visit masterphotocopy.com for details.`
    });
  }

  async sendDeliveryNotificationSMS(phoneNumber: string, orderId: string, trackingId?: string): Promise<boolean> {
    const message = trackingId 
      ? `Your order ${orderId} is out for delivery! Tracking: ${trackingId}. Master PhotoCopy`
      : `Your order ${orderId} is out for delivery! Master PhotoCopy`;
    
    return this.sendSMS({
      to: phoneNumber,
      message
    });
  }
}

export default SMSService;
export type { SMSConfig, SMSData, OTPConfig };