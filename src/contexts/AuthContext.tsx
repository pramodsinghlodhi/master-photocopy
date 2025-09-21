'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Get Firebase ID token and store it in a cookie for middleware
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Store token in cookie for middleware access
          document.cookie = `firebase_token=${idToken}; path=/; max-age=3600; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
          
          // Get user role from custom claims or set default for admin
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const role = (idTokenResult.claims.role as string) || 
            (firebaseUser.email === 'admin@masterphotocopy.com' ? 'admin' : 'user');
          
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role
          };
          
          setUser(userData);
        } catch (error) {
          console.error('Error getting ID token:', error);
          setUser(null);
        }
      } else {
        // Clear token cookie when user signs out
        document.cookie = 'firebase_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Firebase Auth not initialized' };
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (email: string, password: string, name: string, role = 'user'): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Firebase Auth not initialized' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }

      // TODO: Set custom claims for role (requires Firebase Admin SDK)
      // For now, role will be determined in the auth state listener
      
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  // Auto-refresh Firebase ID token periodically
  useEffect(() => {
    if (!firebaseUser) return;

    const interval = setInterval(async () => {
      try {
        const idToken = await firebaseUser.getIdToken(true); // Force refresh
        // Update token cookie
        document.cookie = `firebase_token=${idToken}; path=/; max-age=3600; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, user might need to re-authenticate
      }
    }, 50 * 60 * 1000); // Refresh every 50 minutes (tokens expire after 1 hour)

    return () => clearInterval(interval);
  }, [firebaseUser]);

  const logout = async () => {
    if (!auth) return;
    
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}