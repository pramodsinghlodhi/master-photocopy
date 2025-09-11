import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample data
const sampleOrders = [
  {
    orderId: 'ORD001',
    clientId: 'client1',
    customer: {
      phone_number: '+919876543210',
      first_name: 'Rahul',
      last_name: 'Sharma',
      email: 'rahul@example.com',
      address: '123 Main Street, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    items: [
      {
        name: 'Document Printing',
        totalPages: 10,
        settings: { sides: 'single', colorMode: 'bw', binding: 'none', quantity: 1 },
        price: 50,
        quantity: 1,
        sku: 'DOC-PRINT-001'
      }
    ],
    totals: {
      subtotal: 50,
      shipping: 20,
      tax: 7,
      total: 77
    },
    payment: {
      method: 'COD',
      status: 'Pending'
    },
    delivery: {
      type: 'own'
    },
    status: 'Pending',
    urgent: false,
    timeline: [
      {
        ts: new Date(),
        actor: 'customer',
        action: 'order_created',
        note: 'Order created by customer'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    orderId: 'ORD002',
    clientId: 'client1',
    customer: {
      phone_number: '+919876543211',
      first_name: 'Priya',
      last_name: 'Patel',
      email: 'priya@example.com',
      address: '456 Park Avenue, Delhi',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    items: [
      {
        name: 'Photo Printing',
        totalPages: 20,
        settings: { sides: 'single', colorMode: 'color', binding: 'none', quantity: 1 },
        price: 200,
        quantity: 1,
        sku: 'PHOTO-PRINT-001'
      }
    ],
    totals: {
      subtotal: 200,
      shipping: 30,
      tax: 23,
      total: 253
    },
    payment: {
      method: 'Prepaid',
      status: 'Paid'
    },
    delivery: {
      type: 'shiprocket'
    },
    status: 'Processing',
    urgent: true,
    timeline: [
      {
        ts: new Date(Date.now() - 86400000), // 1 day ago
        actor: 'customer',
        action: 'order_created',
        note: 'Order created by customer'
      },
      {
        ts: new Date(),
        actor: 'admin',
        action: 'status_update',
        note: 'Order moved to processing'
      }
    ],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date()
  }
];

const sampleAgents = [
  {
    uid: 'agent1',
    userRef: 'agent1',
    phone: '+919876543212',
    first_name: 'Amit',
    last_name: 'Kumar',
    email: 'amit.agent@example.com',
    vehicle: {
      type: 'bike',
      number: 'MH01AB1234'
    },
    status: 'active',
    onboarding: {
      idProofUrl: 'https://example.com/documents/id_proof.jpg',
      addressProofUrl: 'https://example.com/documents/address_proof.jpg',
      vehicleProofUrl: 'https://example.com/documents/vehicle_proof.jpg',
      completed: true
    },
    createdAt: new Date(Date.now() - 7 * 86400000), // 7 days ago
    updatedAt: new Date()
  },
  {
    uid: 'agent2',
    userRef: 'agent2',
    phone: '+919876543213',
    first_name: 'Sunita',
    last_name: 'Singh',
    email: 'sunita.agent@example.com',
    vehicle: {
      type: 'car',
      number: 'DL02XY5678'
    },
    status: 'pending',
    onboarding: {
      idProofUrl: 'https://example.com/documents/id_proof2.jpg',
      addressProofUrl: 'https://example.com/documents/address_proof2.jpg',
      completed: true
    },
    createdAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
    updatedAt: new Date()
  }
];

const sampleUsers = [
  {
    uid: 'admin1',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    phone: '+919876543214',
    email: 'admin@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    meta: {
      verifiedPhone: true
    }
  },
  {
    uid: 'agent1',
    role: 'agent',
    first_name: 'Amit',
    last_name: 'Kumar',
    phone: '+919876543212',
    email: 'amit.agent@example.com',
    createdAt: new Date(Date.now() - 7 * 86400000),
    updatedAt: new Date(),
    meta: {
      verifiedPhone: true
    }
  }
];

const sampleTemplates = [
  {
    name: 'order_assigned',
    language: 'en',
    fields: ['first_name', 'orderId'],
    bodyTemplate: 'Hi {first_name}, you have been assigned a new order {orderId}. Please check your agent portal for details.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'delivery_otp',
    language: 'en',
    fields: ['first_name', 'orderId', 'copy_code'],
    bodyTemplate: 'Hi {first_name}, your delivery code for order {orderId} is {copy_code}. Please share this with the delivery agent.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'order_delivered',
    language: 'en',
    fields: ['first_name', 'orderId'],
    bodyTemplate: 'Hi {first_name}, your order {orderId} has been successfully delivered. Thank you for your business!',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'order_shipped',
    language: 'en',
    fields: ['first_name', 'orderId', 'tracking_url'],
    bodyTemplate: 'Hi {first_name}, your order {orderId} has been shipped. Track it here: {tracking_url}',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleSettings = {
  clientId: 'client1',
  shiprocket: {
    apiKey: 'your-shiprocket-email@example.com',
    secret: 'your-shiprocket-password',
    baseUrl: 'https://apiv2.shiprocket.in/v1/external'
  },
  whatsapp: {
    apiKey: 'your-whatsapp-api-key',
    phoneNumberId: 'your-phone-number-id'
  },
  defaults: {
    deliveryType: 'own',
    shippingCost: 25,
    taxRate: 0.1
  }
};

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Seed orders
    console.log('Seeding orders...');
    for (const order of sampleOrders) {
      await setDoc(doc(db, 'orders', order.orderId), order);
    }

    // Seed agents
    console.log('Seeding agents...');
    for (const agent of sampleAgents) {
      await setDoc(doc(db, 'agents', agent.uid), agent);
    }

    // Seed users
    console.log('Seeding users...');
    for (const user of sampleUsers) {
      await setDoc(doc(db, 'users', user.uid), user);
    }

    // Seed templates
    console.log('Seeding templates...');
    for (const template of sampleTemplates) {
      await setDoc(doc(db, 'templates', `${template.name}_${template.language}`), template);
    }

    // Seed settings
    console.log('Seeding settings...');
    await setDoc(doc(db, 'settings', sampleSettings.clientId), sampleSettings);

    console.log('Database seeding completed successfully!');
    console.log('\nSample data created:');
    console.log(`- ${sampleOrders.length} orders`);
    console.log(`- ${sampleAgents.length} agents`);
    console.log(`- ${sampleUsers.length} users`);
    console.log(`- ${sampleTemplates.length} templates`);
    console.log('- 1 client settings');

    console.log('\nYou can now:');
    console.log('1. Access the admin panel to manage orders and agents');
    console.log('2. Use the agent portal at /agent to test agent login');
    console.log('3. Test webhook endpoints with the sample customer data');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seeding script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Seeding script failed:', error);
    process.exit(1);
  });
}

export { seedDatabase };
