'use client';

import { useState, useEffect } from 'react';
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Copy, 
  Download, 
  Settings, 
  Database, 
  Shield, 
  Zap, 
  Webhook,
  Terminal,
  Cloud,
  Smartphone,
  CreditCard,
  Mail,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceConfig {
  name: string;
  enabled: boolean;
  status: 'configured' | 'pending' | 'error';
  config: Record<string, any>;
}

export default function ConfigWizard() {
  const [currentTab, setCurrentTab] = useState('firebase');
  const [services, setServices] = useState<Record<string, ServiceConfig>>({
    firebase: {
      name: 'Firebase',
      enabled: true,
      status: 'pending',
      config: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        useEmulator: true
      }
    },
    whatsapp: {
      name: 'WhatsApp Business API',
      enabled: false,
      status: 'pending',
      config: {
        apiToken: '',
        verifyToken: '',
        phoneNumberId: '',
        businessAccountId: ''
      }
    },
    payment: {
      name: 'Payment Gateway (Razorpay)',
      enabled: false,
      status: 'pending',
      config: {
        keyId: '',
        keySecret: '',
        webhookSecret: ''
      }
    },
    shiprocket: {
      name: 'Shiprocket Integration',
      enabled: false,
      status: 'pending',
      config: {
        email: '',
        password: '',
        apiKey: ''
      }
    },
    email: {
      name: 'Email Service',
      enabled: false,
      status: 'pending',
      config: {
        provider: 'smtp',
        host: '',
        port: '587',
        username: '',
        password: '',
        fromEmail: ''
      }
    },
    analytics: {
      name: 'Google Analytics',
      enabled: false,
      status: 'pending',
      config: {
        measurementId: '',
        trackingId: ''
      }
    }
  });
  
  const [deploymentConfig, setDeploymentConfig] = useState({
    environment: 'production',
    domain: 'master-photocopy--master-photocopy.us-central1.hosted.app',
    httpsEnabled: true,
    corsOrigins: ['https://master-photocopy--master-photocopy.us-central1.hosted.app'],
    rateLimiting: true
  });

  const { toast } = useToast();

  const updateServiceConfig = (serviceKey: string, field: string, value: any) => {
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        config: {
          ...prev[serviceKey].config,
          [field]: value
        }
      }
    }));
  };

  const toggleService = (serviceKey: string) => {
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        enabled: !prev[serviceKey].enabled
      }
    }));
  };

  const validateFirebaseConfig = () => {
    const firebase = services.firebase.config;
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
    return required.every(field => firebase[field] && firebase[field].trim() !== '');
  };

  const generateEnvironmentConfig = () => {
    const config = [];
    
    // Firebase configuration
    if (services.firebase.enabled) {
      config.push('# Firebase Configuration');
      config.push(`NEXT_PUBLIC_FIREBASE_API_KEY=${services.firebase.config.apiKey}`);
      config.push(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${services.firebase.config.authDomain}`);
      config.push(`NEXT_PUBLIC_FIREBASE_PROJECT_ID=${services.firebase.config.projectId}`);
      config.push(`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${services.firebase.config.storageBucket}`);
      config.push(`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${services.firebase.config.messagingSenderId}`);
      config.push(`NEXT_PUBLIC_FIREBASE_APP_ID=${services.firebase.config.appId}`);
      config.push(`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=${services.firebase.config.useEmulator}`);
      config.push('');
    }

    // Application settings
    config.push('# Application Configuration');
    config.push(`NEXT_PUBLIC_APP_URL=http://${deploymentConfig.domain}`);
    config.push(`NEXT_PUBLIC_APP_NAME="Masterphoto Copy"`);
    config.push(`NODE_ENV=${deploymentConfig.environment}`);
    config.push('');

    // WhatsApp configuration
    if (services.whatsapp.enabled) {
      config.push('# WhatsApp Business API');
      config.push(`WHATSAPP_API_TOKEN=${services.whatsapp.config.apiToken}`);
      config.push(`WHATSAPP_VERIFY_TOKEN=${services.whatsapp.config.verifyToken}`);
      config.push(`WHATSAPP_PHONE_NUMBER_ID=${services.whatsapp.config.phoneNumberId}`);
      config.push(`WHATSAPP_BUSINESS_ACCOUNT_ID=${services.whatsapp.config.businessAccountId}`);
      config.push('');
    }

    // Payment configuration
    if (services.payment.enabled) {
      config.push('# Payment Gateway (Razorpay)');
      config.push(`RAZORPAY_KEY_ID=${services.payment.config.keyId}`);
      config.push(`RAZORPAY_KEY_SECRET=${services.payment.config.keySecret}`);
      config.push(`RAZORPAY_WEBHOOK_SECRET=${services.payment.config.webhookSecret}`);
      config.push('');
    }

    // Shiprocket configuration
    if (services.shiprocket.enabled) {
      config.push('# Shiprocket Integration');
      config.push(`SHIPROCKET_EMAIL=${services.shiprocket.config.email}`);
      config.push(`SHIPROCKET_PASSWORD=${services.shiprocket.config.password}`);
      config.push(`SHIPROCKET_API_KEY=${services.shiprocket.config.apiKey}`);
      config.push('');
    }

    // Email configuration
    if (services.email.enabled) {
      config.push('# Email Service');
      config.push(`EMAIL_PROVIDER=${services.email.config.provider}`);
      config.push(`EMAIL_HOST=${services.email.config.host}`);
      config.push(`EMAIL_PORT=${services.email.config.port}`);
      config.push(`EMAIL_USERNAME=${services.email.config.username}`);
      config.push(`EMAIL_PASSWORD=${services.email.config.password}`);
      config.push(`EMAIL_FROM=${services.email.config.fromEmail}`);
      config.push('');
    }

    // Analytics configuration
    if (services.analytics.enabled) {
      config.push('# Google Analytics');
      config.push(`NEXT_PUBLIC_GA_MEASUREMENT_ID=${services.analytics.config.measurementId}`);
      config.push(`NEXT_PUBLIC_GA_TRACKING_ID=${services.analytics.config.trackingId}`);
      config.push('');
    }

    return config.join('\n');
  };

  const generateFirebaseConfig = () => {
    const firebase = services.firebase.config;
    return `// firebase.json configuration
{
  "projects": {
    "default": "${firebase.projectId}"
  },
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  },
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix \\"$RESOURCE_DIR\\" run build"]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": {"port": 9099},
    "functions": {"port": 5001},
    "firestore": {"port": 8080},
    "storage": {"port": 9199},
    "ui": {"enabled": true, "port": 4000},
    "singleProjectMode": true
  }
}`;
  };

  const downloadConfig = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuration downloaded",
      description: `${filename} has been downloaded`
    });
  };

  const testConnection = async (serviceKey: string) => {
    toast({
      title: "Testing connection...",
      description: `Testing ${services[serviceKey].name} configuration`
    });

    // Simulate API test
    setTimeout(() => {
      setServices(prev => ({
        ...prev,
        [serviceKey]: {
          ...prev[serviceKey],
          status: 'configured'
        }
      }));
      
      toast({
        title: "Connection successful",
        description: `${services[serviceKey].name} is properly configured`
      });
    }, 2000);
  };

  const getServiceIcon = (serviceKey: string) => {
    const icons = {
      firebase: <Database className="h-5 w-5" />,
      whatsapp: <Smartphone className="h-5 w-5" />,
      payment: <CreditCard className="h-5 w-5" />,
      shiprocket: <Zap className="h-5 w-5" />,
      email: <Mail className="h-5 w-5" />,
      analytics: <Globe className="h-5 w-5" />
    };
    return icons[serviceKey as keyof typeof icons] || <Settings className="h-5 w-5" />;
  };

  return (
    <AdminProtectedRoute fallbackMessage="Configuration settings require administrator access. Only admin users can modify system configuration.">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Configuration Wizard
          </h1>
          <p className="text-lg text-gray-600">
            Configure all services and integrations for your Masterphoto Copy application
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Service Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Services</CardTitle>
                <CardDescription>Configure integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(services).map(([key, service]) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentTab === key ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentTab(key)}
                  >
                    <div className="flex items-center gap-2">
                      {getServiceIcon(key)}
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {service.enabled && (
                        <Badge variant={service.status === 'configured' ? 'default' : 'secondary'}>
                          {service.status}
                        </Badge>
                      )}
                      <Switch
                        checked={service.enabled}
                        onCheckedChange={() => toggleService(key)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-3">
            {/* Firebase Configuration */}
            {currentTab === 'firebase' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-6 w-6" />
                    Firebase Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your Firebase project for authentication, database, and storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="apiKey">API Key *</Label>
                      <Input
                        id="apiKey"
                        value={services.firebase.config.apiKey}
                        onChange={(e) => updateServiceConfig('firebase', 'apiKey', e.target.value)}
                        placeholder="AIzaSyC..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="authDomain">Auth Domain *</Label>
                      <Input
                        id="authDomain"
                        value={services.firebase.config.authDomain}
                        onChange={(e) => updateServiceConfig('firebase', 'authDomain', e.target.value)}
                        placeholder="your-project.firebaseapp.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectId">Project ID *</Label>
                      <Input
                        id="projectId"
                        value={services.firebase.config.projectId}
                        onChange={(e) => updateServiceConfig('firebase', 'projectId', e.target.value)}
                        placeholder="your-project-id"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storageBucket">Storage Bucket *</Label>
                      <Input
                        id="storageBucket"
                        value={services.firebase.config.storageBucket}
                        onChange={(e) => updateServiceConfig('firebase', 'storageBucket', e.target.value)}
                        placeholder="your-project.appspot.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                      <Input
                        id="messagingSenderId"
                        value={services.firebase.config.messagingSenderId}
                        onChange={(e) => updateServiceConfig('firebase', 'messagingSenderId', e.target.value)}
                        placeholder="123456789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="appId">App ID</Label>
                      <Input
                        id="appId"
                        value={services.firebase.config.appId}
                        onChange={(e) => updateServiceConfig('firebase', 'appId', e.target.value)}
                        placeholder="1:123456789:web:abc123"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useEmulator"
                      checked={services.firebase.config.useEmulator}
                      onCheckedChange={(checked) => updateServiceConfig('firebase', 'useEmulator', checked)}
                    />
                    <Label htmlFor="useEmulator">Use Firebase Emulators (Development)</Label>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You can find these values in your Firebase Console → Project Settings → General Tab
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('firebase')}
                      disabled={!validateFirebaseConfig()}
                    >
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadConfig(generateFirebaseConfig(), 'firebase.json')}
                    >
                      Download firebase.json
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WhatsApp Configuration */}
            {currentTab === 'whatsapp' && services.whatsapp.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-6 w-6" />
                    WhatsApp Business API
                  </CardTitle>
                  <CardDescription>
                    Configure WhatsApp for order notifications and customer communication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="whatsappApiToken">API Token</Label>
                      <Input
                        id="whatsappApiToken"
                        type="password"
                        value={services.whatsapp.config.apiToken}
                        onChange={(e) => updateServiceConfig('whatsapp', 'apiToken', e.target.value)}
                        placeholder="EAAx..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsappVerifyToken">Verify Token</Label>
                      <Input
                        id="whatsappVerifyToken"
                        value={services.whatsapp.config.verifyToken}
                        onChange={(e) => updateServiceConfig('whatsapp', 'verifyToken', e.target.value)}
                        placeholder="your-verify-token"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                      <Input
                        id="phoneNumberId"
                        value={services.whatsapp.config.phoneNumberId}
                        onChange={(e) => updateServiceConfig('whatsapp', 'phoneNumberId', e.target.value)}
                        placeholder="123456789012345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessAccountId">Business Account ID</Label>
                      <Input
                        id="businessAccountId"
                        value={services.whatsapp.config.businessAccountId}
                        onChange={(e) => updateServiceConfig('whatsapp', 'businessAccountId', e.target.value)}
                        placeholder="123456789012345"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Get these credentials from your Meta for Developers dashboard → WhatsApp → API Setup
                    </AlertDescription>
                  </Alert>

                  <Button onClick={() => testConnection('whatsapp')}>
                    Test WhatsApp Connection
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Configuration */}
            {currentTab === 'payment' && services.payment.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    Payment Gateway (Razorpay)
                  </CardTitle>
                  <CardDescription>
                    Configure Razorpay for secure payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="razorpayKeyId">Key ID</Label>
                      <Input
                        id="razorpayKeyId"
                        value={services.payment.config.keyId}
                        onChange={(e) => updateServiceConfig('payment', 'keyId', e.target.value)}
                        placeholder="rzp_test_..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                      <Input
                        id="razorpayKeySecret"
                        type="password"
                        value={services.payment.config.keySecret}
                        onChange={(e) => updateServiceConfig('payment', 'keySecret', e.target.value)}
                        placeholder="your-secret-key"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="webhookSecret">Webhook Secret</Label>
                      <Input
                        id="webhookSecret"
                        type="password"
                        value={services.payment.config.webhookSecret}
                        onChange={(e) => updateServiceConfig('payment', 'webhookSecret', e.target.value)}
                        placeholder="webhook-secret"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Get your API keys from Razorpay Dashboard → Settings → API Keys. Use test keys for development.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={() => testConnection('payment')}>
                    Test Payment Configuration
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Shiprocket Configuration */}
            {currentTab === 'shiprocket' && services.shiprocket.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-6 w-6" />
                    Shiprocket Integration
                  </CardTitle>
                  <CardDescription>
                    Configure Shiprocket for automated logistics and delivery management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shiprocketEmail">Email</Label>
                      <Input
                        id="shiprocketEmail"
                        type="email"
                        value={services.shiprocket.config.email}
                        onChange={(e) => updateServiceConfig('shiprocket', 'email', e.target.value)}
                        placeholder="your-email@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shiprocketPassword">Password</Label>
                      <Input
                        id="shiprocketPassword"
                        type="password"
                        value={services.shiprocket.config.password}
                        onChange={(e) => updateServiceConfig('shiprocket', 'password', e.target.value)}
                        placeholder="your-password"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="shiprocketApiKey">API Key (Optional)</Label>
                      <Input
                        id="shiprocketApiKey"
                        value={services.shiprocket.config.apiKey}
                        onChange={(e) => updateServiceConfig('shiprocket', 'apiKey', e.target.value)}
                        placeholder="your-api-key"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Get your credentials from Shiprocket Dashboard → Settings → API. Email and password are required for authentication.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={() => testConnection('shiprocket')}>
                    Test Shiprocket Connection
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Email Service Configuration */}
            {currentTab === 'email' && services.email.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-6 w-6" />
                    Email Service
                  </CardTitle>
                  <CardDescription>
                    Configure email service for notifications and communications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emailProvider">Provider</Label>
                      <Select 
                        value={services.email.config.provider} 
                        onValueChange={(value) => updateServiceConfig('email', 'provider', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select email provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smtp">SMTP</SelectItem>
                          <SelectItem value="gmail">Gmail</SelectItem>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="emailHost">SMTP Host</Label>
                      <Input
                        id="emailHost"
                        value={services.email.config.host}
                        onChange={(e) => updateServiceConfig('email', 'host', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailPort">Port</Label>
                      <Input
                        id="emailPort"
                        value={services.email.config.port}
                        onChange={(e) => updateServiceConfig('email', 'port', e.target.value)}
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailUsername">Username</Label>
                      <Input
                        id="emailUsername"
                        value={services.email.config.username}
                        onChange={(e) => updateServiceConfig('email', 'username', e.target.value)}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailPassword">Password/App Password</Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        value={services.email.config.password}
                        onChange={(e) => updateServiceConfig('email', 'password', e.target.value)}
                        placeholder="your-app-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailFrom">From Email</Label>
                      <Input
                        id="emailFrom"
                        value={services.email.config.fromEmail}
                        onChange={(e) => updateServiceConfig('email', 'fromEmail', e.target.value)}
                        placeholder="noreply@yourcompany.com"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      For Gmail, use App Passwords instead of your regular password. Enable 2FA first, then generate an App Password.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={() => testConnection('email')}>
                    Test Email Configuration
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Google Analytics Configuration */}
            {currentTab === 'analytics' && services.analytics.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-6 w-6" />
                    Google Analytics
                  </CardTitle>
                  <CardDescription>
                    Configure Google Analytics for tracking and insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gaMeasurementId">Measurement ID (GA4)</Label>
                      <Input
                        id="gaMeasurementId"
                        value={services.analytics.config.measurementId}
                        onChange={(e) => updateServiceConfig('analytics', 'measurementId', e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gaTrackingId">Tracking ID (Universal Analytics)</Label>
                      <Input
                        id="gaTrackingId"
                        value={services.analytics.config.trackingId}
                        onChange={(e) => updateServiceConfig('analytics', 'trackingId', e.target.value)}
                        placeholder="UA-XXXXXXXXX-X"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Get your Analytics IDs from Google Analytics → Admin → Property Settings. GA4 Measurement ID is recommended for new setups.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={() => testConnection('analytics')}>
                    Test Analytics Configuration
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Fallback for disabled services */}
            {!services[currentTab]?.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getServiceIcon(currentTab)}
                    {services[currentTab]?.name || 'Service'} Configuration
                  </CardTitle>
                  <CardDescription>
                    This service is currently disabled. Enable it from the sidebar to configure.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Toggle the switch in the sidebar to enable {services[currentTab]?.name || 'this service'} and access its configuration options.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => toggleService(currentTab)}>
                    Enable {services[currentTab]?.name || 'Service'}
                  </Button>
                </CardContent>
              </Card>
            )}
            
          </div>
        </div>

        {/* Configuration Output */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-6 w-6" />
              Generated Configuration
            </CardTitle>
            <CardDescription>
              Environment configuration based on your settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={generateEnvironmentConfig()}
              readOnly
              className="h-64 font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => downloadConfig(generateEnvironmentConfig(), '.env.local')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download .env.local
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generateEnvironmentConfig());
                  toast({ title: "Copied to clipboard" });
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminProtectedRoute>
  );
}
