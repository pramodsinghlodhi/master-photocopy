'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Database, 
  Mail, 
  MessageSquare, 
  Shield, 
  Cloud, 
  Settings, 
  Phone,
  Key,
  Server,
  FileText,
  BarChart3,
  Bell,
  Globe,
  CheckCircle2,
  AlertCircle,
  HardDrive
} from 'lucide-react';

interface FirebaseServiceConfig {
  auth: { enabled: boolean };
  firestore: { enabled: boolean };
  storage: { enabled: boolean };
  realtimeDb: { enabled: boolean };
  functions: { enabled: boolean };
  analytics: { enabled: boolean };
  messaging: { enabled: boolean };
  remoteConfig: { enabled: boolean };
  dataConnect: { enabled: boolean };
  appCheck: { enabled: boolean };
  hosting: { enabled: boolean };
  email: {
    enabled: boolean;
    providers: {
      firebase: { enabled: boolean };
      sendgrid: { enabled: boolean; apiKey: string };
      mailgun: { enabled: boolean; apiKey: string; domain: string };
      ses: { enabled: boolean; region: string };
      nodemailer: { enabled: boolean; smtp: any };
    };
  };
  sms: {
    enabled: boolean;
    providers: {
      firebase: { enabled: boolean };
      twilio: { enabled: boolean; accountSid: string; authToken: string };
      fast2sms: { enabled: boolean; apiKey: string };
      textlocal: { enabled: boolean; apiKey: string; sender: string };
      msg91: { enabled: boolean; apiKey: string; route: string };
    };
  };
  otp: {
    enabled: boolean;
    length: number;
    expiryMinutes: number;
    maxAttempts: number;
  };
}

interface StorageConfig {
  provider: 'firebase' | 'aws-s3';
  aws?: {
    region: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
}

const FirebaseServicesPanel: React.FC = () => {
  const [config, setConfig] = useState<FirebaseServiceConfig | null>(null);
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchStorageConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch configuration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        title: "Error",
        description: "Failed to fetch configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageConfig = async () => {
    try {
      const response = await fetch('/api/storage/config');
      if (response.ok) {
        const data = await response.json();
        setStorageConfig(data);
      }
    } catch (error) {
      console.error('Error fetching storage config:', error);
    }
  };

  const updateConfig = async (updates: Partial<FirebaseServiceConfig>) => {
    if (!config) return;

    setSaving(true);
    try {
      const updatedConfig = { ...config, ...updates };
      
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        setConfig(updatedConfig);
        toast({
          title: "Success",
          description: "Configuration updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update configuration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (service: keyof FirebaseServiceConfig, enabled: boolean) => {
    if (!config) return;
    updateConfig({
      [service]: { ...config[service], enabled }
    });
  };

  const updateEmailProvider = (provider: string, updates: any) => {
    if (!config) return;
    updateConfig({
      email: {
        ...config.email,
        providers: {
          ...config.email.providers,
          [provider]: { ...config.email.providers[provider as keyof typeof config.email.providers], ...updates }
        }
      }
    });
  };

  const updateStorageConfig = async (updates: Partial<StorageConfig>) => {
    if (!storageConfig) return;
    
    setSaving(true);
    try {
      const updatedConfig = { ...storageConfig, ...updates } as StorageConfig;
      
      const response = await fetch('/api/storage/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      });

      if (response.ok) {
        setStorageConfig(updatedConfig);
        toast({
          title: "Success",
          description: "Storage configuration updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update storage configuration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating storage config:', error);
      toast({
        title: "Error",
        description: "Failed to update storage configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSMSProvider = (provider: string, updates: any) => {
    if (!config) return;
    updateConfig({
      sms: {
        ...config.sms,
        providers: {
          ...config.sms.providers,
          [provider]: { ...config.sms.providers[provider as keyof typeof config.sms.providers], ...updates }
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-500">Failed to load configuration</p>
          <Button onClick={fetchConfig} className="mt-4 w-full">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const firebaseServices = [
    { key: 'auth', label: 'Authentication', icon: Shield, description: 'User authentication and authorization' },
    { key: 'firestore', label: 'Firestore Database', icon: Database, description: 'NoSQL document database' },
    { key: 'storage', label: 'Cloud Storage', icon: Cloud, description: 'File storage and serving' },
    { key: 'realtimeDb', label: 'Realtime Database', icon: Database, description: 'Real-time synchronized database' },
    { key: 'functions', label: 'Cloud Functions', icon: Server, description: 'Serverless functions' },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, description: 'App analytics and insights' },
    { key: 'messaging', label: 'Cloud Messaging', icon: Bell, description: 'Push notifications' },
    { key: 'remoteConfig', label: 'Remote Config', icon: Settings, description: 'Dynamic app configuration' },
    { key: 'dataConnect', label: 'Data Connect', icon: FileText, description: 'GraphQL data access' },
    { key: 'appCheck', label: 'App Check', icon: Shield, description: 'App attestation service' },
    { key: 'hosting', label: 'Hosting', icon: Globe, description: 'Web hosting service' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Firebase Services</h2>
          <p className="text-muted-foreground">Configure and manage Firebase services and integrations</p>
        </div>
        {saving && (
          <Badge variant="secondary" className="animate-pulse">
            <Settings className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </Badge>
        )}
      </div>

      <Tabs defaultValue="firebase" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="firebase">Firebase Services</TabsTrigger>
          <TabsTrigger value="storage">Storage Config</TabsTrigger>
          <TabsTrigger value="email">Email Services</TabsTrigger>
          <TabsTrigger value="sms">SMS Services</TabsTrigger>
          <TabsTrigger value="otp">OTP Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="firebase" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {firebaseServices.map((service) => {
              const ServiceIcon = service.icon;
              const isEnabled = config[service.key as keyof FirebaseServiceConfig]?.enabled || false;
              
              return (
                <Card key={service.key} className={isEnabled ? "border-green-200 bg-green-50" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <ServiceIcon className={`w-5 h-5 ${isEnabled ? 'text-green-600' : 'text-gray-500'}`} />
                      <CardTitle className="text-sm font-medium">{service.label}</CardTitle>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleService(service.key as keyof FirebaseServiceConfig, checked)}
                    />
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">{service.description}</CardDescription>
                    {isEnabled ? (
                      <Badge variant="default" className="mt-2">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-2">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5" />
                <CardTitle>Storage Configuration</CardTitle>
              </div>
              <CardDescription>Choose between Firebase Storage and AWS S3 for file storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageConfig && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="storage-provider">Storage Provider</Label>
                    <Select
                      value={storageConfig.provider}
                      onValueChange={(value: 'firebase' | 'aws-s3') => 
                        updateStorageConfig({ provider: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firebase">Firebase Storage</SelectItem>
                        <SelectItem value="aws-s3">Amazon S3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {storageConfig.provider === 'aws-s3' && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h3 className="font-medium">AWS S3 Configuration</h3>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="aws-region">AWS Region</Label>
                          <Input
                            id="aws-region"
                            value={storageConfig.aws?.region || ''}
                            onChange={(e) => updateStorageConfig({
                              aws: { ...storageConfig.aws!, region: e.target.value }
                            })}
                            placeholder="us-east-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="aws-bucket">Bucket Name</Label>
                          <Input
                            id="aws-bucket"
                            value={storageConfig.aws?.bucketName || ''}
                            onChange={(e) => updateStorageConfig({
                              aws: { ...storageConfig.aws!, bucketName: e.target.value }
                            })}
                            placeholder="my-storage-bucket"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="aws-access-key">Access Key ID</Label>
                          <Input
                            id="aws-access-key"
                            type="password"
                            value={storageConfig.aws?.accessKeyId || ''}
                            onChange={(e) => updateStorageConfig({
                              aws: { ...storageConfig.aws!, accessKeyId: e.target.value }
                            })}
                            placeholder="AKIA..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="aws-secret-key">Secret Access Key</Label>
                          <Input
                            id="aws-secret-key"
                            type="password"
                            value={storageConfig.aws?.secretAccessKey || ''}
                            onChange={(e) => updateStorageConfig({
                              aws: { ...storageConfig.aws!, secretAccessKey: e.target.value }
                            })}
                            placeholder="Secret key"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label htmlFor="aws-endpoint">Custom Endpoint (Optional)</Label>
                          <Input
                            id="aws-endpoint"
                            value={storageConfig.aws?.endpoint || ''}
                            onChange={(e) => updateStorageConfig({
                              aws: { ...storageConfig.aws!, endpoint: e.target.value }
                            })}
                            placeholder="https://s3.custom-endpoint.com"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {storageConfig.provider === 'firebase' && (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Using Firebase Storage (default configuration)</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Firebase Storage will use your project's default configuration.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <CardTitle>Email Services</CardTitle>
                </div>
                <Switch
                  checked={config.email.enabled}
                  onCheckedChange={(checked) => updateConfig({
                    email: { ...config.email, enabled: checked }
                  })}
                />
              </div>
              <CardDescription>Configure email service providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(config.email.providers).map(([provider, settings]) => (
                <div key={provider} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize font-medium">{provider}</Label>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateEmailProvider(provider, { enabled: checked })}
                    />
                  </div>
                  
                  {settings.enabled && provider !== 'firebase' && (
                    <div className="space-y-2 ml-4">
                      {provider === 'sendgrid' && (
                        <div>
                          <Label htmlFor={`${provider}-key`}>API Key</Label>
                          <Input
                            id={`${provider}-key`}
                            type="password"
                            value={(settings as any).apiKey || ''}
                            onChange={(e) => updateEmailProvider(provider, { apiKey: e.target.value })}
                            placeholder="SendGrid API Key"
                          />
                        </div>
                      )}
                      
                      {provider === 'mailgun' && (
                        <>
                          <div>
                            <Label htmlFor={`${provider}-key`}>API Key</Label>
                            <Input
                              id={`${provider}-key`}
                              type="password"
                              value={(settings as any).apiKey || ''}
                              onChange={(e) => updateEmailProvider(provider, { apiKey: e.target.value })}
                              placeholder="Mailgun API Key"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${provider}-domain`}>Domain</Label>
                            <Input
                              id={`${provider}-domain`}
                              value={(settings as any).domain || ''}
                              onChange={(e) => updateEmailProvider(provider, { domain: e.target.value })}
                              placeholder="your-domain.mailgun.org"
                            />
                          </div>
                        </>
                      )}
                      
                      {provider === 'ses' && (
                        <div>
                          <Label htmlFor={`${provider}-region`}>AWS Region</Label>
                          <Input
                            id={`${provider}-region`}
                            value={(settings as any).region || 'us-east-1'}
                            onChange={(e) => updateEmailProvider(provider, { region: e.target.value })}
                            placeholder="us-east-1"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <CardTitle>SMS Services</CardTitle>
                </div>
                <Switch
                  checked={config.sms.enabled}
                  onCheckedChange={(checked) => updateConfig({
                    sms: { ...config.sms, enabled: checked }
                  })}
                />
              </div>
              <CardDescription>Configure SMS service providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(config.sms.providers).map(([provider, settings]) => (
                <div key={provider} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize font-medium">{provider}</Label>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateSMSProvider(provider, { enabled: checked })}
                    />
                  </div>
                  
                  {settings.enabled && provider !== 'firebase' && (
                    <div className="space-y-2 ml-4">
                      {provider === 'twilio' && (
                        <>
                          <div>
                            <Label htmlFor={`${provider}-sid`}>Account SID</Label>
                            <Input
                              id={`${provider}-sid`}
                              value={(settings as any).accountSid || ''}
                              onChange={(e) => updateSMSProvider(provider, { accountSid: e.target.value })}
                              placeholder="Twilio Account SID"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${provider}-token`}>Auth Token</Label>
                            <Input
                              id={`${provider}-token`}
                              type="password"
                              value={(settings as any).authToken || ''}
                              onChange={(e) => updateSMSProvider(provider, { authToken: e.target.value })}
                              placeholder="Twilio Auth Token"
                            />
                          </div>
                        </>
                      )}
                      
                      {(provider === 'fast2sms' || provider === 'msg91') && (
                        <div>
                          <Label htmlFor={`${provider}-key`}>API Key</Label>
                          <Input
                            id={`${provider}-key`}
                            type="password"
                            value={(settings as any).apiKey || ''}
                            onChange={(e) => updateSMSProvider(provider, { apiKey: e.target.value })}
                            placeholder={`${provider.toUpperCase()} API Key`}
                          />
                        </div>
                      )}
                      
                      {provider === 'textlocal' && (
                        <>
                          <div>
                            <Label htmlFor={`${provider}-key`}>API Key</Label>
                            <Input
                              id={`${provider}-key`}
                              type="password"
                              value={(settings as any).apiKey || ''}
                              onChange={(e) => updateSMSProvider(provider, { apiKey: e.target.value })}
                              placeholder="Textlocal API Key"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${provider}-sender`}>Sender ID</Label>
                            <Input
                              id={`${provider}-sender`}
                              value={(settings as any).sender || ''}
                              onChange={(e) => updateSMSProvider(provider, { sender: e.target.value })}
                              placeholder="TXTLCL"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="otp" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <CardTitle>OTP Configuration</CardTitle>
                </div>
                <Switch
                  checked={config.otp.enabled}
                  onCheckedChange={(checked) => updateConfig({
                    otp: { ...config.otp, enabled: checked }
                  })}
                />
              </div>
              <CardDescription>Configure OTP generation and verification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="otp-length">OTP Length</Label>
                  <Input
                    id="otp-length"
                    type="number"
                    min="4"
                    max="8"
                    value={config.otp.length}
                    onChange={(e) => updateConfig({
                      otp: { ...config.otp, length: parseInt(e.target.value) || 6 }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="otp-expiry">Expiry (minutes)</Label>
                  <Input
                    id="otp-expiry"
                    type="number"
                    min="1"
                    max="60"
                    value={config.otp.expiryMinutes}
                    onChange={(e) => updateConfig({
                      otp: { ...config.otp, expiryMinutes: parseInt(e.target.value) || 10 }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="otp-attempts">Max Attempts</Label>
                  <Input
                    id="otp-attempts"
                    type="number"
                    min="1"
                    max="10"
                    value={config.otp.maxAttempts}
                    onChange={(e) => updateConfig({
                      otp: { ...config.otp, maxAttempts: parseInt(e.target.value) || 3 }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FirebaseServicesPanel;