// Email Service with multiple providers
interface EmailConfig {
  enabled: boolean;
  provider: 'firebase' | 'sendgrid' | 'mailgun' | 'ses' | 'nodemailer';
  apiKey?: string;
  from: string;
  fromName?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: any;
}

class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('Email service is disabled');
      return false;
    }

    try {
      switch (this.config.provider) {
        case 'firebase':
          return await this.sendFirebaseEmail(data);
        case 'sendgrid':
          return await this.sendSendGridEmail(data);
        case 'mailgun':
          return await this.sendMailgunEmail(data);
        case 'ses':
          return await this.sendSESEmail(data);
        case 'nodemailer':
          return await this.sendNodemailerEmail(data);
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private async sendFirebaseEmail(data: EmailData): Promise<boolean> {
    // Use Firebase Functions to send email
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'firebase',
          ...data,
          from: this.config.from,
          fromName: this.config.fromName
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Firebase email error:', error);
      return false;
    }
  }

  private async sendSendGridEmail(data: EmailData): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: data.to }] }],
          from: { email: this.config.from, name: this.config.fromName },
          subject: data.subject,
          content: [
            { type: 'text/html', value: data.html || '' },
            { type: 'text/plain', value: data.text || '' }
          ]
        })
      });
      return response.ok;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  private async sendMailgunEmail(data: EmailData): Promise<boolean> {
    if (!this.config.apiKey) {
      throw new Error('Mailgun API key not configured');
    }

    try {
      const domain = this.config.from.split('@')[1];
      const formData = new FormData();
      formData.append('from', `${this.config.fromName} <${this.config.from}>`);
      formData.append('to', data.to);
      formData.append('subject', data.subject);
      if (data.html) formData.append('html', data.html);
      if (data.text) formData.append('text', data.text);

      const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.config.apiKey}`)}`
        },
        body: formData
      });
      return response.ok;
    } catch (error) {
      console.error('Mailgun email error:', error);
      return false;
    }
  }

  private async sendSESEmail(data: EmailData): Promise<boolean> {
    // AWS SES implementation would go here
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ses',
          ...data,
          from: this.config.from,
          fromName: this.config.fromName
        })
      });
      return response.ok;
    } catch (error) {
      console.error('SES email error:', error);
      return false;
    }
  }

  private async sendNodemailerEmail(data: EmailData): Promise<boolean> {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'nodemailer',
          ...data,
          from: this.config.from,
          fromName: this.config.fromName
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Nodemailer email error:', error);
      return false;
    }
  }

  // Predefined email templates
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Welcome to Master PhotoCopy!',
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining Master PhotoCopy. We're excited to serve your printing needs.</p>
        <p>Get started by uploading your first document for printing.</p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>Master PhotoCopy Team</p>
      `,
      text: `Welcome, ${name}! Thank you for joining Master PhotoCopy. We're excited to serve your printing needs.`
    });
  }

  async sendOrderConfirmationEmail(to: string, orderDetails: any): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Order Confirmation - ${orderDetails.orderId}`,
      html: `
        <h1>Order Confirmed!</h1>
        <p>Your order <strong>${orderDetails.orderId}</strong> has been received and is being processed.</p>
        <h3>Order Details:</h3>
        <ul>
          <li>Order ID: ${orderDetails.orderId}</li>
          <li>Total Amount: ₹${orderDetails.total}</li>
          <li>Payment Method: ${orderDetails.paymentMethod}</li>
          <li>Status: ${orderDetails.status}</li>
        </ul>
        <p>You can track your order status in your dashboard.</p>
        <p>Thank you for choosing Master PhotoCopy!</p>
      `,
      text: `Order Confirmed! Your order ${orderDetails.orderId} has been received and is being processed.`
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Reset Your Password - Master PhotoCopy',
      html: `
        <h1>Reset Your Password</h1>
        <p>You requested a password reset for your Master PhotoCopy account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
      `,
      text: `Reset your password by clicking this link: ${resetLink}`
    });
  }

  async sendOTPEmail(to: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Your OTP Code - Master PhotoCopy',
      html: `
        <h1>Your Verification Code</h1>
        <p>Your OTP code is: <strong style="font-size: 24px; color: #007bff;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `,
      text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`
    });
  }
}

export default EmailService;
export type { EmailConfig, EmailData, EmailTemplate };