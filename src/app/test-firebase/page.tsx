'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isFirebaseConfigured, app, auth, db, storage } from '@/lib/firebase'

interface ConfigStatus {
  isConfigured: boolean
  config: {
    apiKey?: string
    authDomain?: string
    projectId?: string
    storageBucket?: string
    messagingSenderId?: string
    appId?: string
  }
  services: {
    app: boolean
    auth: boolean
    firestore: boolean
    storage: boolean
  }
}

export default function TestFirebasePage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    isConfigured: false,
    config: {},
    services: {
      app: false,
      auth: false,
      firestore: false,
      storage: false
    }
  })
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');

  const testFirebaseConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-firebase');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: 'Network error', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testFilesFetch = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/files`);
      const result = await response.json();
      setTestResult({ filesTest: true, ...result });
    } catch (error) {
      setTestResult({ filesTest: true, error: 'Network error', details: error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkFirebaseConfig = () => {
      setConfigStatus({
        isConfigured: Boolean(isFirebaseConfigured),
        config: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 15) + '...',
        },
        services: {
          app: !!app,
          auth: !!auth,
          firestore: !!db,
          storage: !!storage
        }
      })
    }

    checkFirebaseConfig()
  }, [])

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Firebase Configuration & Debug</h1>
      
      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded ${configStatus.isConfigured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {configStatus.isConfigured ? '✅ Firebase is properly configured' : '❌ Firebase is not configured'}
          </div>
        </CardContent>
      </Card>

      {/* Admin SDK Test */}
      <Card>
        <CardHeader>
          <CardTitle>Admin SDK Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={testFirebaseConnection} disabled={loading}>
              {loading ? 'Testing...' : 'Test Firebase Admin Connection'}
            </Button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Order ID (e.g., ORD789)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <Button onClick={testFilesFetch} disabled={loading || !orderId}>
              Test Files API
            </Button>
          </div>

          {testResult && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm max-h-96">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Services Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(configStatus.services).map(([service, status]) => (
              <div key={service} className={`p-3 rounded text-center ${status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <div className="font-semibold">{service}</div>
                <div>{status ? '✅' : '❌'}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>API Key:</strong> {configStatus.config.apiKey}</div>
            <div><strong>Auth Domain:</strong> {configStatus.config.authDomain}</div>
            <div><strong>Project ID:</strong> {configStatus.config.projectId}</div>
            <div><strong>Storage Bucket:</strong> {configStatus.config.storageBucket}</div>
            <div><strong>Messaging Sender ID:</strong> {configStatus.config.messagingSenderId}</div>
            <div><strong>App ID:</strong> {configStatus.config.appId}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
