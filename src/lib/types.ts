import type { AnalyzeDocumentOutput } from '@/ai/flows/document-analysis';
import type { FormattingSuggestionsOutput } from '@/ai/flows/formatting-suggestions';
import type { AiUpsellTriggersOutput } from '@/ai/flows/ai-upsell-triggers';


export type PrintFile = {
  id: string;
  file: File;
  totalPages: number;
  settings: {
    sides: 'single' | 'double';
    colorMode: 'bw' | 'color';
    binding: 'none' | 'plastic-spiral' | 'metal-spiral' | 'staple';
    quantity: number;
  };
  analysis?: AnalyzeDocumentOutput;
  suggestions?: FormattingSuggestionsOutput;
  upsells?: AiUpsellTriggersOutput;
  status: 'queued' | 'analyzing' | 'ready' | 'error';
  error?: string;
  price: number;
  groupId?: string;
};

export type FileGroup = {
  id: string;
  name: string;
  files: PrintFile[];
  settings: Omit<PrintFile['settings'], 'pageRange'>;
  price: number;
};

export type UpsellOffer = AiUpsellTriggersOutput['upsellOffers'][0];

export type OrderItem = {
    name: string;
    totalPages: number;
    settings: PrintFile['settings'];
    price: number;
    quantity?: number;
    sku?: string;
    groupName?: string;
    folderName?: string;
    uploadOrder?: number;
    fileId?: string;
}

export type PaymentDetails = {
    status: 'Paid' | 'Pending';
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
}

// Enhanced Order Management Types
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Not Delivered' | 'Cancelled' | 'Returned';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded';
export type PaymentMethod = 'COD' | 'Prepaid';
export type DeliveryType = 'own' | 'shiprocket';

export type Customer = {
  uid?: string;
  phone_number: string;
  phone?: string; // For backward compatibility
  first_name: string;
  last_name: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  language_code?: string;
};

export type OrderTimeline = {
  ts: any; // Firestore timestamp
  actor: string;
  action: string;
  note?: string;
};

export type DeliveryInfo = {
  type: DeliveryType;
  shiprocket_shipment_id?: string;
  tracking_url?: string;
  tracking_number?: string;
  estimated_delivery?: string;
};

export type Order = {
  id: string;
  orderId: string;
  clientId?: string;
  date: string; // ISO string
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  status: OrderStatus;
  customer: Customer;
  items: OrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount?: number;
    total: number;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };
  delivery: DeliveryInfo;
  urgent: boolean;
  assignedAgentId?: string;
  timeline: OrderTimeline[];
  userId?: string; // For backward compatibility
  total: number; // For backward compatibility
  itemCount: number; // For backward compatibility
  paymentMethod?: 'online' | 'cod'; // For backward compatibility
  isUrgent?: boolean; // For backward compatibility
  paymentDetails?: PaymentDetails; // For backward compatibility
  groupName?: string; // Group organization
  folderName?: string; // Folder organization
  fileCount?: number; // Number of files in order
};

// Agent Management Types
export type AgentStatus = 'pending' | 'active' | 'suspended' | 'deleted';

export type Agent = {
  agentId: string;
  userRef: string;
  uid: string;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  vehicle: {
    type: 'bike' | 'car' | 'bicycle';
    number: string;
  };
  status: AgentStatus;
  credentials?: {
    username: string;
    password: string;
    createdAt: any; // Firestore timestamp
    updatedAt?: any; // Firestore timestamp
    updatedBy?: string;
  };
  onboarding: {
    idProofUrl?: string;
    addressProofUrl?: string;
    vehicleProofUrl?: string;
    completed: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
    lastUpdated: any; // Firestore timestamp
  };
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
};

// User Management Types
export type UserRole = 'admin' | 'client' | 'agent' | 'customer';

export type User = {
  uid: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  country?: string;
  language_code?: string;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  meta: {
    verifiedPhone: boolean;
  };
};

// Webhook Types
export type WebhookPayload = {
  contact?: {
    status: 'existing' | 'updated' | 'new';
    phone_number: string;
    uid?: string;
    first_name: string;
    last_name: string;
    email: string;
    language_code: string;
    country: string;
  };
  message?: {
    whatsapp_business_phone_number_id?: string;
    whatsapp_message_id?: string;
    replied_to_whatsapp_message_id?: string;
    is_new_message: boolean;
    body?: string;
    status?: string;
    media?: {
      type: string;
      link: string;
      caption?: string;
      mime_type?: string;
      file_name?: string;
      original_filename?: string;
    };
  };
  whatsapp_webhook_payload?: any;
};

export type Webhook = {
  webhookId: string;
  rawPayload: WebhookPayload;
  source: string;
  receivedAt: any; // Firestore timestamp
  processed: boolean;
  mappedToOrderId?: string;
};

// Template Types
export type MessageTemplate = {
  name: string;
  language: string;
  header_image?: string;
  fields: string[];
  bodyTemplate: string;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
};

// Settings Types
export type ClientSettings = {
  clientId: string;
  shiprocket?: {
    apiKey: string;
    secret: string;
    baseUrl: string;
  };
  whatsapp?: {
    apiKey: string;
    phoneNumberId: string;
  };
  defaults: {
    deliveryType: DeliveryType;
    shippingCost: number;
    taxRate: number;
  };
};

// Delivery OTP Types
export type DeliveryOTP = {
  orderId: string;
  otp: string;
  hashedOtp: string;
  agentId: string;
  customerPhone: string;
  expiresAt: any; // Firestore timestamp
  used: boolean;
  createdAt: any; // Firestore timestamp
};

export type LegalContent = {
    terms: string;
    privacy: string;
    refund: string;
}

export type UserData = {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
    referralCode?: string;
    usedReferralCode?: string;
    createdAt: any;
}

// Order File Management Types
export type OrderFile = {
  id: string;
  name: string;
  path?: string;
  url: string;
  size: number;
  type: string;
  uploadedAt?: string | Date;
  order: number;
  groupName?: string;
};

// Referral System Types
export type ReferralData = {
  userId: string;
  code: string;
  totalReferrals: number;
  createdAt: any;
  lastReferralAt?: any;
};

export type WalletData = {
  userId: string;
  balance: number;
  createdAt: any;
  lastUpdated: any;
};

export type TransactionData = {
  userId: string;
  amount: number;
  type: 'referral_bonus' | 'order_payment' | 'wallet_topup' | 'withdrawal';
  description: string;
  createdAt: any;
};
