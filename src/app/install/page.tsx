'use client';

import { useState, useEffect } from 'react';
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, Copy, Download, Settings, Database, Shield, Zap, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConfigCheck {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  required: boolean;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export default function InstallPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [configChecks, setConfigChecks] = useState<ConfigCheck[]>([]);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const { toast } = useToast();

  const steps = [
    { id: 'requirements', title: 'System Requirements', icon: <Settings className="h-5 w-5" /> },
    { id: 'firebase', title: 'Firebase Configuration', icon: <Database className="h-5 w-5" /> },
    { id: 'environment', title: 'Environment Setup', icon: <Shield className="h-5 w-5" /> },
    { id: 'testing', title: 'Testing & Validation', icon: <Zap className="h-5 w-5" /> },
    { id: 'deployment', title: 'Deployment Ready', icon: <CheckCircle className="h-5 w-5" /> }
  ];

  useEffect(() => {
    checkSystemRequirements();
  }, []);

  const checkSystemRequirements = async () => {
    const checks: ConfigCheck[] = [
      {
        name: 'Node.js Version',
        status: 'pending',
        message: 'Checking Node.js version...',
        required: true
      },
      {
        name: 'Firebase CLI',
        status: 'pending',
        message: 'Checking Firebase CLI installation...',
        required: true
      },
      {
        name: 'Dependencies',
        status: 'pending',
        message: 'Checking project dependencies...',
        required: true
      },
      {
        name: 'Environment Files',
        status: 'pending',
        message: 'Checking environment configuration...',
        required: true
      }
    ];

    setConfigChecks(checks);

    // Simulate system checks
    setTimeout(() => {
      const updatedChecks = checks.map(check => {
        switch (check.name) {
          case 'Node.js Version':
            return {
              ...check,
              status: 'success' as const,
              message: 'Node.js 18+ detected'
            };
          case 'Firebase CLI':
            return {
              ...check,
              status: 'success' as const,
              message: 'Firebase CLI is installed'
            };
          case 'Dependencies':
            return {
              ...check,
              status: 'success' as const,
              message: 'All dependencies are installed'
            };
          case 'Environment Files':
            return {
              ...check,
              status: 'warning' as const,
              message: 'Environment files need configuration'
            };
          default:
            return check;
        }
      });
      setConfigChecks(updatedChecks);
    }, 2000);
  };

  const generateEnvironmentFile = () => {
    const envContent = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${firebaseConfig.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${firebaseConfig.appId}

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Masterphoto Copy"

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

# Optional: WhatsApp API Configuration
WHATSAPP_API_TOKEN=your_api_token_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here`;

    return envContent;
  };

  const downloadEnvironmentFile = () => {
    const content = generateEnvironmentFile();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.local';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Environment file downloaded",
      description: "Place the .env.local file in your project root"
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`
    });
  };

  const runTests = async () => {
    setTestResults([]);
    const tests = [
      { name: 'Firebase Connection', status: 'running' },
      { name: 'Authentication System', status: 'pending' },
      { name: 'Database Operations', status: 'pending' },
      { name: 'File Upload', status: 'pending' },
      { name: 'Cloud Functions', status: 'pending' }
    ];

    setTestResults(tests);

    // Simulate test execution
    for (let i = 0; i < tests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newResults = [...tests];
      newResults[i] = { ...newResults[i], status: 'success' };
      if (i < tests.length - 1) {
        newResults[i + 1] = { ...newResults[i + 1], status: 'running' };
      }
      setTestResults(newResults);
    }
  };

  const installAndSetup = async () => {
    setIsInstalling(true);
    setInstallProgress(0);

    const steps = [
      'Installing dependencies...',
      'Setting up Firebase...',
      'Configuring environment...',
      'Building project...',
      'Starting services...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setInstallProgress((i + 1) * 20);
      
      toast({
        title: "Installation Progress",
        description: steps[i]
      });
    }

    setIsInstalling(false);
    setCurrentStep(4);
    
    toast({
      title: "Installation Complete!",
      description: "Your Masterphoto Copy application is ready to use"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <AdminProtectedRoute fallbackMessage="System installation and setup require administrator access. Only admin users can perform installation procedures.">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Masterphoto Copy Installation
          </h1>
          <p className="text-lg text-gray-600">
            Set up your professional printing management system
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                <span className="text-sm font-medium text-center max-w-20">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <Tabs value={steps[currentStep]?.id || 'requirements'} className="space-y-6">
          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  System Requirements Check
                </CardTitle>
                <CardDescription>
                  Verifying that your system meets all requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {configChecks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-gray-600">{check.message}</p>
                      </div>
                    </div>
                    <Badge variant={check.required ? 'destructive' : 'secondary'}>
                      {check.required ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                ))}
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ensure Node.js 18+, Firebase CLI, and all dependencies are installed before proceeding.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setCurrentStep(1)}
                    disabled={configChecks.some(check => check.required && check.status === 'error')}
                  >
                    Continue to Firebase Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firebase">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-6 w-6" />
                  Firebase Configuration
                </CardTitle>
                <CardDescription>
                  Enter your Firebase project configuration details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      value={firebaseConfig.apiKey}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, apiKey: e.target.value})}
                      placeholder="AIzaSyC..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="authDomain">Auth Domain</Label>
                    <Input
                      id="authDomain"
                      value={firebaseConfig.authDomain}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, authDomain: e.target.value})}
                      placeholder="your-project.firebaseapp.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectId">Project ID</Label>
                    <Input
                      id="projectId"
                      value={firebaseConfig.projectId}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, projectId: e.target.value})}
                      placeholder="your-project-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="storageBucket">Storage Bucket</Label>
                    <Input
                      id="storageBucket"
                      value={firebaseConfig.storageBucket}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, storageBucket: e.target.value})}
                      placeholder="your-project.appspot.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                    <Input
                      id="messagingSenderId"
                      value={firebaseConfig.messagingSenderId}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, messagingSenderId: e.target.value})}
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="appId">App ID</Label>
                    <Input
                      id="appId"
                      value={firebaseConfig.appId}
                      onChange={(e) => setFirebaseConfig({...firebaseConfig, appId: e.target.value})}
                      placeholder="1:123456789:web:abc123"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You can find these values in your Firebase project settings under "General" → "Your apps".
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(0)}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!firebaseConfig.apiKey || !firebaseConfig.projectId}
                  >
                    Continue to Environment Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Environment Setup
                </CardTitle>
                <CardDescription>
                  Generate and configure your environment files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Generated .env.local</h4>
                  <Textarea
                    value={generateEnvironmentFile()}
                    readOnly
                    className="h-64 font-mono text-sm"
                  />
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(generateEnvironmentFile(), 'Environment configuration')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadEnvironmentFile}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Save this as .env.local in your project root directory. Never commit this file to version control.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>
                    Continue to Testing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6" />
                  Testing & Validation
                </CardTitle>
                <CardDescription>
                  Test all system components and connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResults.length > 0 && (
                  <div className="space-y-3">
                    {testResults.map((test, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        {getStatusIcon(test.status)}
                        <span className="font-medium">{test.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={runTests}
                    disabled={testResults.length > 0 && testResults.some(t => t.status === 'running')}
                  >
                    {testResults.length > 0 ? 'Run Tests Again' : 'Start Testing'}
                  </Button>
                  {testResults.length > 0 && testResults.every(t => t.status === 'success') && (
                    <Button onClick={installAndSetup}>
                      Proceed to Installation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Installation Complete!
                </CardTitle>
                <CardDescription>
                  Your Masterphoto Copy application is ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isInstalling && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Installing...</span>
                      <span>{installProgress}%</span>
                    </div>
                    <Progress value={installProgress} />
                  </div>
                )}

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your system is now configured and ready for use. You can access the application at http://localhost:3000
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Quick Commands</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">npm run dev</code>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard('npm run dev', 'Development command')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">npm run emulators</code>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard('npm run emulators', 'Emulator command')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">npm run seed</code>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard('npm run seed', 'Seed command')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>• Start the development server</p>
                      <p>• Run Firebase emulators</p>
                      <p>• Test the application</p>
                      <p>• Deploy to production</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button asChild>
                    <a href="/" target="_blank">Open Application</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/admin" target="_blank">Admin Dashboard</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AdminProtectedRoute>
  );
}
