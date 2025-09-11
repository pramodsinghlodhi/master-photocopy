'use client'

import { useEffect, useState } from 'react'
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
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Configuration Test</h1>
      
      <div className="space-y-6">
        {/* Configuration Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className={`p-4 rounded ${configStatus.isConfigured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {configStatus.isConfigured ? '✅ Firebase is properly configured' : '❌ Firebase is not configured'}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <div><strong>API Key:</strong> {configStatus.config.apiKey}</div>
            <div><strong>Auth Domain:</strong> {configStatus.config.authDomain}</div>
            <div><strong>Project ID:</strong> {configStatus.config.projectId}</div>
            <div><strong>Storage Bucket:</strong> {configStatus.config.storageBucket}</div>
            <div><strong>Messaging Sender ID:</strong> {configStatus.config.messagingSenderId}</div>
            <div><strong>App ID:</strong> {configStatus.config.appId}</div>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Services Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(configStatus.services).map(([service, status]) => (
              <div key={service} className={`p-3 rounded text-center ${status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <div className="font-semibold">{service}</div>
                <div>{status ? '✅' : '❌'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Home Page
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-4"
            >
              Test Login Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
