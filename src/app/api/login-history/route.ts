import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoginSession } from '@/types/login-history';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType') || 'agent';
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Query login sessions
    const loginSessionsRef = collection(db, 'loginSessions');
    let q = query(
      loginSessionsRef,
      where('userId', '==', userId),
      where('userType', '==', userType),
      orderBy('loginTime', 'desc'),
      limit(limitParam)
    );

    if (activeOnly) {
      q = query(
        loginSessionsRef,
        where('userId', '==', userId),
        where('userType', '==', userType),
        where('isActive', '==', true),
        orderBy('loginTime', 'desc'),
        limit(limitParam)
      );
    }

    const querySnapshot = await getDocs(q);
    
    const sessions: LoginSession[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        userId: data.userId,
        userType: data.userType,
        deviceInfo: data.deviceInfo,
        location: data.location,
        loginTime: data.loginTime.toDate(),
        logoutTime: data.logoutTime ? data.logoutTime.toDate() : undefined,
        isActive: data.isActive,
        sessionDuration: data.sessionDuration
      });
    });

    // Calculate statistics
    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isActive).length,
      uniqueDevices: new Set(sessions.map(s => `${s.deviceInfo.deviceType}-${s.deviceInfo.browser}-${s.deviceInfo.os}`)).size,
      averageSessionDuration: sessions
        .filter(s => s.sessionDuration)
        .reduce((acc, s) => acc + (s.sessionDuration || 0), 0) / 
        sessions.filter(s => s.sessionDuration).length || 0,
      mostUsedDevice: getMostFrequent(sessions.map(s => s.deviceInfo.deviceType)),
      mostUsedBrowser: getMostFrequent(sessions.map(s => s.deviceInfo.browser))
    };

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching login history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getMostFrequent(arr: string[]): string {
  if (arr.length === 0) return 'Unknown';
  
  const frequency: { [key: string]: number } = {};
  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
  });
  
  return Object.keys(frequency).reduce((a, b) => 
    frequency[a] > frequency[b] ? a : b
  );
}