import { NextResponse } from 'next/server'

export async function GET() {
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

  return NextResponse.json({
    configured: isConfigured,
    config: {
      apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'missing',
      authDomain: firebaseConfig.authDomain || 'missing',
      projectId: firebaseConfig.projectId || 'missing',
      storageBucket: firebaseConfig.storageBucket || 'missing',
      messagingSenderId: firebaseConfig.messagingSenderId || 'missing',
      appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 15)}...` : 'missing',
    },
    timestamp: new Date().toISOString()
  })
}
