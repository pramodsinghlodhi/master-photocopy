import React from 'react'

export default function ConfigTestPage() {
  // Check environment variables
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  const isConfigured = Object.values(firebaseConfig).every(value => 
    value && !value.includes('your_') && !value.includes('demo-')
  )

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Firebase Configuration Status</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className={`p-4 rounded-lg mb-6 ${isConfigured ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border-2`}>
          <h2 className="text-xl font-bold mb-2">
            {isConfigured ? '✅ Firebase Configuration: SUCCESS' : '❌ Firebase Configuration: ERROR'}
          </h2>
          <p className="text-gray-700">
            {isConfigured 
              ? 'All Firebase environment variables are properly configured!' 
              : 'Firebase environment variables are missing or contain placeholder values.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Environment Variables:</h3>
            <div className="space-y-1 text-sm">
              <div><strong>API Key:</strong> {firebaseConfig.apiKey ? '✅ Set' : '❌ Missing'}</div>
              <div><strong>Auth Domain:</strong> {firebaseConfig.authDomain ? '✅ Set' : '❌ Missing'}</div>
              <div><strong>Project ID:</strong> {firebaseConfig.projectId ? '✅ Set' : '❌ Missing'}</div>
              <div><strong>Storage Bucket:</strong> {firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing'}</div>
              <div><strong>Messaging Sender ID:</strong> {firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing'}</div>
              <div><strong>App ID:</strong> {firebaseConfig.appId ? '✅ Set' : '❌ Missing'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Configuration Details:</h3>
            <div className="space-y-1 text-sm">
              <div><strong>Project:</strong> {firebaseConfig.projectId}</div>
              <div><strong>Auth Domain:</strong> {firebaseConfig.authDomain}</div>
              <div><strong>API Key:</strong> {firebaseConfig.apiKey?.substring(0, 10)}...</div>
              <div><strong>Sender ID:</strong> {firebaseConfig.messagingSenderId}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2">Next Steps:</h3>
          {isConfigured ? (
            <div className="text-green-700">
              <p>✅ Firebase is properly configured!</p>
              <p>✅ You can now use authentication, database, and storage features.</p>
              <p>✅ Try visiting the <a href="/login" className="underline text-blue-600">login page</a> to test authentication.</p>
            </div>
          ) : (
            <div className="text-red-700">
              <p>❌ Please check your apphosting.yaml file.</p>
              <p>❌ Environment variables need to be properly configured in Firebase App Hosting.</p>
              <p>❌ Redeploy after updating the configuration.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
