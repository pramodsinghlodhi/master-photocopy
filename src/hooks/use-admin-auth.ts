import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserData {
  role?: string;
  permissions?: string[];
}

export function useAdminAuth() {
  const [user, loading, error] = useAuthState(auth!);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (user && db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            setIsAdmin(data.role === 'admin' || data.role === 'Admin');
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setUserLoading(false);
    }

    if (!loading) {
      fetchUserData();
    }
  }, [user, loading]);

  return {
    user,
    userData,
    isAdmin,
    loading: loading || userLoading,
    error
  };
}
