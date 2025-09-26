import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoginTracker } from '@/lib/login-tracker';

export async function POST(req: NextRequest) {
  try {
    const { agentId, password } = await req.json();

    if (!agentId || !password) {
      return NextResponse.json(
        { success: false, error: 'Agent ID and password are required' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Query agents collection for the agent with matching ID and password
    const agentsRef = collection(db, 'agents');
    const q = query(
      agentsRef, 
      where('agentId', '==', agentId),
      where('password', '==', password)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Invalid Agent ID or Password' },
        { status: 401 }
      );
    }

    // Get the agent document
    const agentDoc = querySnapshot.docs[0];
    const agentData = agentDoc.data();

    // Check if agent account is active
    if (agentData.status !== 'active') {
      let errorMessage = 'Account is not active';
      
      switch (agentData.status) {
        case 'pending':
          errorMessage = 'Account is pending approval';
          break;
        case 'suspended':
          errorMessage = 'Account has been suspended';
          break;
        case 'inactive':
          errorMessage = 'Account is inactive';
          break;
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 403 }
      );
    }

    // Track login session
    try {
      const userAgent = req.headers.get('user-agent') || '';
      const clientIP = LoginTracker.getClientIP(req);
      const deviceInfo = LoginTracker.getDeviceInfo(userAgent);
      const locationInfo = await LoginTracker.getLocationInfo(clientIP);
      const sessionId = LoginTracker.generateSessionId();

      // Save login session to database
      const loginSessionsRef = collection(db, 'loginSessions');
      await addDoc(loginSessionsRef, {
        sessionId,
        userId: agentDoc.id,
        userType: 'agent',
        agentId: agentData.agentId,
        deviceInfo,
        location: locationInfo,
        loginTime: serverTimestamp(),
        isActive: true,
        createdAt: serverTimestamp()
      });

      console.log(`Agent login session created: ${agentData.agentId} - ${(deviceInfo as any).type} ${(deviceInfo as any).browser}`);
    } catch (sessionError) {
      console.error('Failed to save login session:', sessionError);
      // Don't fail the login if session tracking fails
    }

    // Return successful login with agent data (excluding password)
    const { password: _, ...safeAgentData } = agentData;
    
    return NextResponse.json({
      success: true,
      agent: {
        ...safeAgentData,
        id: agentDoc.id,
        agentId: agentData.agentId
      }
    });

  } catch (error: any) {
    console.error('Error in agent login:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}