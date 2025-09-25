import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  FirebaseStorage
} from 'firebase/storage';
import { 
  getDatabase, 
  ref as dbRef, 
  set, 
  get, 
  push, 
  remove,
  onValue,
  off,
  Database
} from 'firebase/database';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { getFunctions, httpsCallable, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { app } from '@/lib/firebase';

// Firebase Services Configuration
export interface FirebaseServiceConfig {
  appHosting: boolean;
  authentication: boolean;
  firestore: boolean;
  storage: boolean;
  realtimeDatabase: boolean;
  dataConnect: boolean;
  appCheck: boolean;
  analytics: boolean;
  functions: boolean;
  remoteConfig: boolean;
  messaging: boolean;
}

export interface CommunicationConfig {
  email: {
    enabled: boolean;
    provider: 'firebase' | 'sendgrid' | 'mailgun' | 'ses';
    apiKey?: string;
    from?: string;
  };
  sms: {
    enabled: boolean;
    provider: 'firebase' | 'twilio' | 'fast2sms' | 'textlocal';
    apiKey?: string;
    from?: string;
  };
  otp: {
    enabled: boolean;
    provider: 'firebase' | 'custom';
    length: number;
    expiry: number; // minutes
  };
  push: {
    enabled: boolean;
    vapidKey?: string;
  };
}

class FirebaseServicesManager {
  private serviceConfig: FirebaseServiceConfig;
  private communicationConfig: CommunicationConfig;
  private analytics?: Analytics;
  private realtimeDb?: Database;
  private functions?: Functions;
  private auth: Auth;
  private firestore: Firestore;
  private storage: FirebaseStorage;

  constructor() {
    // Initialize Firebase services
    if (!app) {
      throw new Error('Firebase app not initialized');
    }

    this.auth = getAuth(app);
    this.firestore = getFirestore(app);
    this.storage = getStorage(app);

    // Default configuration
    this.serviceConfig = {
      appHosting: true,
      authentication: true,
      firestore: true,
      storage: true,
      realtimeDatabase: false,
      dataConnect: false,
      appCheck: false,
      analytics: true,
      functions: true,
      remoteConfig: false,
      messaging: false
    };

    this.communicationConfig = {
      email: {
        enabled: true,
        provider: 'firebase',
        from: 'support@masterphotocopy.com'
      },
      sms: {
        enabled: true,
        provider: 'firebase',
      },
      otp: {
        enabled: true,
        provider: 'firebase',
        length: 6,
        expiry: 10
      },
      push: {
        enabled: false
      }
    };

    this.initializeServices();
  }

  // Initialize Firebase services based on configuration
  private async initializeServices() {
    try {
      // Analytics
      if (this.serviceConfig.analytics && typeof window !== 'undefined') {
        this.analytics = getAnalytics(app);
      }

      // Realtime Database
      if (this.serviceConfig.realtimeDatabase) {
        this.realtimeDb = getDatabase(app);
      }

      // Functions
      if (this.serviceConfig.functions) {
        this.functions = getFunctions(app);
        
        // Connect to emulator in development
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
          connectFunctionsEmulator(this.functions, 'localhost', 5001);
        }
      }

    } catch (error) {
      console.error('Error initializing Firebase services:', error);
    }
  }

  // Configuration Management
  async updateServiceConfig(config: Partial<FirebaseServiceConfig>) {
    this.serviceConfig = { ...this.serviceConfig, ...config };
    
    // Save to Firestore
    if (this.serviceConfig.firestore) {
      try {
        await setDoc(doc(this.firestore, 'system_config', 'firebase_services'), {
          config: this.serviceConfig,
          updatedAt: serverTimestamp(),
          updatedBy: 'admin'
        });
      } catch (error) {
        console.error('Error saving service config:', error);
      }
    }
    
    // Re-initialize services
    await this.initializeServices();
  }

  async updateCommunicationConfig(config: Partial<CommunicationConfig>) {
    this.communicationConfig = { ...this.communicationConfig, ...config };
    
    // Save to Firestore
    if (this.serviceConfig.firestore) {
      try {
        await setDoc(doc(this.firestore, 'system_config', 'communication'), {
          config: this.communicationConfig,
          updatedAt: serverTimestamp(),
          updatedBy: 'admin'
        });
      } catch (error) {
        console.error('Error saving communication config:', error);
      }
    }
  }

  // Load configuration from Firestore
  async loadConfiguration() {
    if (!this.serviceConfig.firestore) return;

    try {
      const [servicesDoc, communicationDoc] = await Promise.all([
        getDoc(doc(this.firestore, 'system_config', 'firebase_services')),
        getDoc(doc(this.firestore, 'system_config', 'communication'))
      ]);

      if (servicesDoc.exists()) {
        this.serviceConfig = { ...this.serviceConfig, ...servicesDoc.data().config };
      }

      if (communicationDoc.exists()) {
        this.communicationConfig = { ...this.communicationConfig, ...communicationDoc.data().config };
      }

      await this.initializeServices();
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  // Authentication Services
  async createUser(email: string, password: string, userData: any) {
    if (!this.serviceConfig.authentication) {
      throw new Error('Authentication service is disabled');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Send email verification if enabled
      if (this.communicationConfig.email.enabled) {
        await sendEmailVerification(user);
      }

      // Save user data to Firestore
      if (this.serviceConfig.firestore) {
        await setDoc(doc(this.firestore, 'users', user.uid), {
          ...userData,
          email,
          createdAt: serverTimestamp(),
          emailVerified: user.emailVerified
        });
      }

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async signInUser(email: string, password: string) {
    if (!this.serviceConfig.authentication) {
      throw new Error('Authentication service is disabled');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Log analytics event
      if (this.analytics) {
        logEvent(this.analytics, 'login', { method: 'email' });
      }

      return userCredential.user;
    } catch (error) {
      console.error('Error signing in user:', error);
      throw error;
    }
  }

  async resetPassword(email: string) {
    if (!this.serviceConfig.authentication) {
      throw new Error('Authentication service is disabled');
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Phone Authentication
  async initiatePhoneAuth(phoneNumber: string, recaptchaContainer: string) {
    if (!this.serviceConfig.authentication || !this.communicationConfig.sms.enabled) {
      throw new Error('Phone authentication is disabled');
    }

    try {
      const recaptchaVerifier = new RecaptchaVerifier(this.auth, recaptchaContainer, {
        size: 'invisible',
      });

      const provider = new PhoneAuthProvider(this.auth);
      const verificationId = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
      
      return verificationId;
    } catch (error) {
      console.error('Error initiating phone auth:', error);
      throw error;
    }
  }

  async verifyPhoneOTP(verificationId: string, otp: string) {
    if (!this.serviceConfig.authentication) {
      throw new Error('Authentication service is disabled');
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(this.auth, credential);
      
      return userCredential.user;
    } catch (error) {
      console.error('Error verifying phone OTP:', error);
      throw error;
    }
  }

  // Firestore Operations
  async createDocument(collectionName: string, data: any, id?: string) {
    if (!this.serviceConfig.firestore) {
      throw new Error('Firestore service is disabled');
    }

    try {
      if (id) {
        await setDoc(doc(this.firestore, collectionName, id), {
          ...data,
          createdAt: serverTimestamp()
        });
        return id;
      } else {
        const docRef = await addDoc(collection(this.firestore, collectionName), {
          ...data,
          createdAt: serverTimestamp()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, id: string, data: any) {
    if (!this.serviceConfig.firestore) {
      throw new Error('Firestore service is disabled');
    }

    try {
      await updateDoc(doc(this.firestore, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async getDocument(collectionName: string, id: string) {
    if (!this.serviceConfig.firestore) {
      throw new Error('Firestore service is disabled');
    }

    try {
      const docSnap = await getDoc(doc(this.firestore, collectionName, id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  async queryDocuments(collectionName: string, conditions: any[] = [], orderByField?: string, limitCount?: number) {
    if (!this.serviceConfig.firestore) {
      throw new Error('Firestore service is disabled');
    }

    try {
      let queryRef: any = collection(this.firestore, collectionName);

      // Apply where conditions
      conditions.forEach(condition => {
        queryRef = query(queryRef, where(condition.field, condition.operator, condition.value));
      });

      // Apply ordering
      if (orderByField) {
        queryRef = query(queryRef, orderBy(orderByField, 'desc'));
      }

      // Apply limit
      if (limitCount) {
        queryRef = query(queryRef, limit(limitCount));
      }

      const querySnapshot = await getDocs(queryRef);
      return querySnapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data() 
      }));
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  // Storage Operations
  async uploadFile(path: string, file: File | Blob, metadata?: any) {
    if (!this.serviceConfig.storage) {
      throw new Error('Storage service is disabled');
    }

    try {
      const storageRef = ref(this.storage, path);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        downloadURL,
        fullPath: snapshot.metadata.fullPath,
        size: snapshot.metadata.size,
        contentType: snapshot.metadata.contentType
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(path: string) {
    if (!this.serviceConfig.storage) {
      throw new Error('Storage service is disabled');
    }

    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async listFiles(path: string) {
    if (!this.serviceConfig.storage) {
      throw new Error('Storage service is disabled');
    }

    try {
      const storageRef = ref(this.storage, path);
      const result = await listAll(storageRef);
      
      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          const downloadURL = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            downloadURL
          };
        })
      );

      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Realtime Database Operations
  async setRealtimeData(path: string, data: any) {
    if (!this.serviceConfig.realtimeDatabase || !this.realtimeDb) {
      throw new Error('Realtime Database service is disabled');
    }

    try {
      await set(dbRef(this.realtimeDb, path), data);
      return true;
    } catch (error) {
      console.error('Error setting realtime data:', error);
      throw error;
    }
  }

  async getRealtimeData(path: string) {
    if (!this.serviceConfig.realtimeDatabase || !this.realtimeDb) {
      throw new Error('Realtime Database service is disabled');
    }

    try {
      const snapshot = await get(dbRef(this.realtimeDb, path));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting realtime data:', error);
      throw error;
    }
  }

  listenToRealtimeData(path: string, callback: (data: any) => void) {
    if (!this.serviceConfig.realtimeDatabase || !this.realtimeDb) {
      throw new Error('Realtime Database service is disabled');
    }

    const reference = dbRef(this.realtimeDb, path);
    onValue(reference, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });

    return () => off(reference);
  }

  // Analytics
  trackEvent(eventName: string, parameters?: any) {
    if (!this.analytics || !this.serviceConfig.analytics) {
      return;
    }

    logEvent(this.analytics, eventName, parameters);
  }

  // Functions
  async callFunction(functionName: string, data?: any) {
    if (!this.serviceConfig.functions || !this.functions) {
      throw new Error('Functions service is disabled');
    }

    try {
      const callable = httpsCallable(this.functions, functionName);
      const result = await callable(data);
      return result.data;
    } catch (error) {
      console.error('Error calling function:', error);
      throw error;
    }
  }

  // Getters
  getServiceConfig() {
    return this.serviceConfig;
  }

  getCommunicationConfig() {
    return this.communicationConfig;
  }

  getAuth() {
    return this.auth;
  }

  getFirestore() {
    return this.firestore;
  }

  getStorage() {
    return this.storage;
  }
}

// Export singleton instance
export const firebaseServices = new FirebaseServicesManager();
export default firebaseServices;