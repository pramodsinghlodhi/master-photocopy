// Sample agent data for testing
export const sampleAgents = [
  {
    agentId: "agent1",
    first_name: "Rahul",
    last_name: "Kumar", 
    phone: "+91-9876543210",
    email: "rahul.kumar@example.com",
    status: "active",
    vehicle: {
      type: "motorcycle",
      number: "DL-12-AB-1234"
    },
    onboarding: {
      idProofUrl: "https://example.com/id-proof.jpg",
      addressProofUrl: "https://example.com/address-proof.jpg",
      vehicleProofUrl: "https://example.com/vehicle-proof.jpg"
    },
    createdAt: new Date("2025-09-01"),
    updatedAt: new Date("2025-09-10")
  },
  {
    agentId: "agent2", 
    first_name: "Priya",
    last_name: "Sharma",
    phone: "+91-9876543211",
    email: "priya.sharma@example.com",
    status: "pending",
    vehicle: {
      type: "bicycle",
      number: "BIC-001"
    },
    onboarding: {
      idProofUrl: "https://example.com/id-proof2.jpg",
      addressProofUrl: "https://example.com/address-proof2.jpg",
      vehicleProofUrl: ""
    },
    createdAt: new Date("2025-09-05"),
    updatedAt: new Date("2025-09-10")
  },
  {
    agentId: "agent3",
    first_name: "Amit", 
    last_name: "Singh",
    phone: "+91-9876543212",
    email: "amit.singh@example.com",
    status: "suspended",
    vehicle: {
      type: "scooter",
      number: "UP-14-CD-5678"
    },
    onboarding: {
      idProofUrl: "https://example.com/id-proof3.jpg",
      addressProofUrl: "https://example.com/address-proof3.jpg",
      vehicleProofUrl: "https://example.com/vehicle-proof3.jpg"
    },
    createdAt: new Date("2025-08-15"),
    updatedAt: new Date("2025-09-08")
  }
];

// Sample order data for testing
export const sampleOrders = [
  {
    orderId: "ORD-2025-001",
    customer: {
      first_name: "Rajesh",
      last_name: "Gupta",
      phone_number: "+91-9876543220",
      email: "rajesh.gupta@example.com",
      address: "123 Main Street, Connaught Place, New Delhi, 110001"
    },
    items: [
      {
        name: "Document Photocopy (A4)",
        quantity: 50,
        price: 2,
        specifications: {
          paper_size: "A4",
          color: "black_white",
          binding: "none"
        }
      }
    ],
    status: "Pending",
    payment: {
      method: "COD",
      status: "Pending"
    },
    delivery: {
      type: "own",
      address: "123 Main Street, Connaught Place, New Delhi, 110001"
    },
    totals: {
      subtotal: 100,
      delivery_fee: 50,
      total: 150
    },
    total: 150,
    urgent: false,
    createdAt: new Date("2025-09-10T10:30:00"),
    date: "2025-09-10T10:30:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-10T10:30:00"),
        note: "Order placed by customer"
      }
    ]
  },
  {
    orderId: "ORD-2025-002", 
    customer: {
      first_name: "Meera",
      last_name: "Shah",
      phone_number: "+91-9876543221",
      email: "meera.shah@example.com",
      address: "456 Park Avenue, Karol Bagh, New Delhi, 110005"
    },
    items: [
      {
        name: "Color Printing (A4)",
        quantity: 25,
        price: 5,
        specifications: {
          paper_size: "A4", 
          color: "color",
          binding: "spiral"
        }
      }
    ],
    status: "Processing",
    payment: {
      method: "Prepaid",
      status: "Paid"
    },
    delivery: {
      type: "shiprocket",
      address: "456 Park Avenue, Karol Bagh, New Delhi, 110005",
      tracking_url: "https://shiprocket.in/tracking/12345"
    },
    assignedAgentId: "agent1",
    totals: {
      subtotal: 125,
      delivery_fee: 75,
      total: 200
    },
    total: 200,
    urgent: true,
    createdAt: new Date("2025-09-09T14:15:00"),
    date: "2025-09-09T14:15:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer", 
        ts: new Date("2025-09-09T14:15:00"),
        note: "Order placed by customer"
      },
      {
        action: "payment_confirmed",
        actor: "System",
        ts: new Date("2025-09-09T14:16:00"),
        note: "Payment confirmed via Razorpay"
      },
      {
        action: "agent_assigned",
        actor: "Admin",
        ts: new Date("2025-09-09T15:00:00"),
        note: "Assigned to Rahul Kumar"
      }
    ]
  },
  {
    orderId: "ORD-2025-003",
    customer: {
      first_name: "Vikram",
      last_name: "Patel",
      phone_number: "+91-9876543222", 
      email: "vikram.patel@example.com",
      address: "789 Business Center, Lajpat Nagar, New Delhi, 110024"
    },
    items: [
      {
        name: "Document Binding",
        quantity: 3,
        price: 50,
        specifications: {
          paper_size: "A4",
          color: "black_white",
          binding: "hardcover"
        }
      },
      {
        name: "Lamination (A4)",
        quantity: 10,
        price: 10,
        specifications: {
          paper_size: "A4",
          lamination_type: "thick"
        }
      }
    ],
    status: "Delivered",
    payment: {
      method: "COD", 
      status: "Paid"
    },
    delivery: {
      type: "own",
      address: "789 Business Center, Lajpat Nagar, New Delhi, 110024"
    },
    assignedAgentId: "agent2",
    totals: {
      subtotal: 250,
      delivery_fee: 30,
      total: 280
    },
    total: 280,
    urgent: false,
    createdAt: new Date("2025-09-08T09:45:00"),
    date: "2025-09-08T09:45:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-08T09:45:00"),
        note: "Order placed by customer"
      },
      {
        action: "agent_assigned", 
        actor: "Admin",
        ts: new Date("2025-09-08T10:00:00"),
        note: "Assigned to Priya Sharma"
      },
      {
        action: "order_picked_up",
        actor: "Agent",
        ts: new Date("2025-09-08T11:30:00"),
        note: "Order picked up by agent"
      },
      {
        action: "order_delivered",
        actor: "Agent", 
        ts: new Date("2025-09-08T15:20:00"),
        note: "Order delivered successfully"
      }
    ]
  },
  {
    orderId: "ORD-2025-004",
    customer: {
      first_name: "Anita",
      last_name: "Krishnan",
      phone_number: "+91-9876543223",
      email: "anita.krishnan@example.com", 
      address: "321 Tech Park, Sector 18, Noida, 201301"
    },
    items: [
      {
        name: "Poster Printing (A3)",
        quantity: 5,
        price: 25,
        specifications: {
          paper_size: "A3",
          color: "color",
          paper_type: "glossy"
        }
      }
    ],
    status: "Shipped",
    payment: {
      method: "Prepaid",
      status: "Paid"
    },
    delivery: {
      type: "shiprocket",
      address: "321 Tech Park, Sector 18, Noida, 201301",
      shiprocket_shipment_id: "SH12345",
      tracking_url: "https://shiprocket.in/tracking/SH12345"
    },
    totals: {
      subtotal: 125,
      delivery_fee: 100,
      total: 225
    },
    total: 225,
    urgent: true,
    createdAt: new Date("2025-09-07T16:20:00"),
    date: "2025-09-07T16:20:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-07T16:20:00"),
        note: "Order placed by customer"
      },
      {
        action: "payment_confirmed",
        actor: "System",
        ts: new Date("2025-09-07T16:21:00"),
        note: "Payment confirmed via Razorpay"
      },
      {
        action: "shipment_created",
        actor: "System",
        ts: new Date("2025-09-08T09:00:00"),
        note: "Shiprocket shipment created"
      }
    ]
  },
  {
    orderId: "ORD-2025-005",
    customer: {
      first_name: "Suresh",
      last_name: "Reddy",
      phone_number: "+91-9876543224",
      email: "suresh.reddy@example.com",
      address: "654 Residential Complex, Dwarka, New Delhi, 110075"
    },
    items: [
      {
        name: "Thesis Printing & Binding",
        quantity: 1,
        price: 500,
        specifications: {
          paper_size: "A4",
          color: "black_white",
          binding: "hardcover",
          pages: 200
        }
      }
    ],
    status: "Cancelled",
    payment: {
      method: "COD",
      status: "Refunded"
    },
    delivery: {
      type: "own",
      address: "654 Residential Complex, Dwarka, New Delhi, 110075"
    },
    totals: {
      subtotal: 500,
      delivery_fee: 50,
      total: 550
    },
    total: 550,
    urgent: false,
    createdAt: new Date("2025-09-06T11:10:00"),
    date: "2025-09-06T11:10:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-06T11:10:00"),
        note: "Order placed by customer"
      },
      {
        action: "order_cancelled",
        actor: "Customer",
        ts: new Date("2025-09-06T12:30:00"),
        note: "Order cancelled by customer request"
      }
    ]
  }
];

// Sample orders specifically assigned to test agent
export const testAgentOrders = [
  {
    orderId: "ORD-TEST-001",
    customer: {
      first_name: "John",
      last_name: "Doe",
      phone_number: "+91-9876543230",
      email: "john.doe@example.com",
      address: "123 Test Street, Test Area, New Delhi, 110001"
    },
    items: [
      {
        name: "Document Photocopy (A4)",
        quantity: 20,
        price: 2,
        specifications: {
          paper_size: "A4",
          color: "black_white",
          binding: "none"
        }
      }
    ],
    status: "Processing",
    payment: {
      method: "COD",
      status: "Pending"
    },
    delivery: {
      type: "own",
      address: "123 Test Street, Test Area, New Delhi, 110001"
    },
    assignedAgentId: "test-agent-1",
    totals: {
      subtotal: 40,
      delivery_fee: 30,
      total: 70
    },
    total: 70,
    urgent: false,
    createdAt: new Date("2025-09-10T09:00:00"),
    date: "2025-09-10T09:00:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-10T09:00:00"),
        note: "Order placed by customer"
      },
      {
        action: "agent_assigned",
        actor: "Admin",
        ts: new Date("2025-09-10T09:15:00"),
        note: "Assigned to Test Agent"
      }
    ]
  },
  {
    orderId: "ORD-TEST-002",
    customer: {
      first_name: "Sarah",
      last_name: "Wilson",
      phone_number: "+91-9876543231",
      email: "sarah.wilson@example.com",
      address: "456 Demo Road, Sample Colony, New Delhi, 110002"
    },
    items: [
      {
        name: "Color Printing (A4)",
        quantity: 15,
        price: 5,
        specifications: {
          paper_size: "A4",
          color: "color",
          binding: "spiral"
        }
      }
    ],
    status: "Out for Delivery",
    payment: {
      method: "Prepaid",
      status: "Paid"
    },
    delivery: {
      type: "own",
      address: "456 Demo Road, Sample Colony, New Delhi, 110002"
    },
    assignedAgentId: "test-agent-1",
    totals: {
      subtotal: 75,
      delivery_fee: 25,
      total: 100
    },
    total: 100,
    urgent: true,
    createdAt: new Date("2025-09-10T08:30:00"),
    date: "2025-09-10T08:30:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-10T08:30:00"),
        note: "Order placed by customer"
      },
      {
        action: "agent_assigned",
        actor: "Admin",
        ts: new Date("2025-09-10T08:45:00"),
        note: "Assigned to Test Agent"
      },
      {
        action: "status_update",
        actor: "Test Agent",
        ts: new Date("2025-09-10T10:00:00"),
        note: "Order picked up for delivery"
      }
    ]
  },
  {
    orderId: "ORD-TEST-003",
    customer: {
      first_name: "Mike",
      last_name: "Johnson",
      phone_number: "+91-9876543232",
      email: "mike.johnson@example.com",
      address: "789 Example Lane, Demo Sector, Gurgaon, 122001"
    },
    items: [
      {
        name: "Business Card Printing",
        quantity: 100,
        price: 1,
        specifications: {
          paper_size: "Business Card",
          color: "color",
          paper_type: "glossy"
        }
      }
    ],
    status: "Processing",
    payment: {
      method: "COD",
      status: "Pending"
    },
    delivery: {
      type: "own",
      address: "789 Example Lane, Demo Sector, Gurgaon, 122001"
    },
    assignedAgentId: "test-agent-1",
    totals: {
      subtotal: 100,
      delivery_fee: 40,
      total: 140
    },
    total: 140,
    urgent: false,
    createdAt: new Date("2025-09-10T11:30:00"),
    date: "2025-09-10T11:30:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-10T11:30:00"),
        note: "Order placed by customer"
      },
      {
        action: "agent_assigned",
        actor: "Admin",
        ts: new Date("2025-09-10T11:45:00"),
        note: "Assigned to Test Agent"
      }
    ]
  },
  {
    orderId: "ORD-TEST-004",
    customer: {
      first_name: "Lisa",
      last_name: "Chen",
      phone_number: "+91-9876543233",
      email: "lisa.chen@example.com",
      address: "321 Mock Street, Test Plaza, Noida, 201301"
    },
    items: [
      {
        name: "Poster Printing (A3)",
        quantity: 5,
        price: 25,
        specifications: {
          paper_size: "A3",
          color: "color",
          paper_type: "matte"
        }
      }
    ],
    status: "Out for Delivery",
    payment: {
      method: "Prepaid",
      status: "Paid"
    },
    delivery: {
      type: "own",
      address: "321 Mock Street, Test Plaza, Noida, 201301"
    },
    assignedAgentId: "test-agent-1",
    totals: {
      subtotal: 125,
      delivery_fee: 35,
      total: 160
    },
    total: 160,
    urgent: true,
    createdAt: new Date("2025-09-10T07:45:00"),
    date: "2025-09-10T07:45:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-10T07:45:00"),
        note: "Order placed by customer"
      },
      {
        action: "agent_assigned",
        actor: "Admin",
        ts: new Date("2025-09-10T08:00:00"),
        note: "Assigned to Test Agent"
      },
      {
        action: "status_update",
        actor: "Test Agent",
        ts: new Date("2025-09-10T09:30:00"),
        note: "Order picked up for delivery"
      }
    ]
  },
  {
    orderId: "ORD-TEST-005",
    customer: {
      first_name: "David",
      last_name: "Brown",
      phone_number: "+91-9876543234",
      email: "david.brown@example.com",
      address: "654 Sample Avenue, Mock City, Faridabad, 121001"
    },
    items: [
      {
        name: "Thesis Binding",
        quantity: 1,
        price: 150,
        specifications: {
          paper_size: "A4",
          color: "black_white",
          binding: "hardcover",
          pages: 120
        }
      }
    ],
    status: "Processing",
    payment: {
      method: "Prepaid",
      status: "Paid"
    },
    delivery: {
      type: "own",
      address: "654 Sample Avenue, Mock City, Faridabad, 121001"
    },
    assignedAgentId: "test-agent-1",
    totals: {
      subtotal: 150,
      delivery_fee: 45,
      total: 195
    },
    total: 195,
    urgent: false,
    createdAt: new Date("2025-09-10T06:15:00"),
    date: "2025-09-10T06:15:00",
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: new Date("2025-09-10T06:15:00"),
        note: "Order placed by customer"
      },
      {
        action: "payment_confirmed",
        actor: "System",
        ts: new Date("2025-09-10T06:16:00"),
        note: "Payment confirmed via Razorpay"
      },
      {
        action: "agent_assigned",
        actor: "Admin",
        ts: new Date("2025-09-10T06:30:00"),
        note: "Assigned to Test Agent"
      }
    ]
  }
];

// Function to generate random test orders for agents
export function generateRandomTestOrder(agentId: string) {
  const customers = [
    { first_name: "Alex", last_name: "Smith", phone: "+91-9876543240", address: "101 Random St, Test City, Delhi, 110003" },
    { first_name: "Emma", last_name: "Davis", phone: "+91-9876543241", address: "202 Sample Rd, Mock Town, Gurgaon, 122002" },
    { first_name: "Ryan", last_name: "Wilson", phone: "+91-9876543242", address: "303 Demo Ave, Example Area, Noida, 201302" },
    { first_name: "Sophia", last_name: "Taylor", phone: "+91-9876543243", address: "404 Test Blvd, Sample Sector, Faridabad, 121002" },
    { first_name: "James", last_name: "Miller", phone: "+91-9876543244", address: "505 Mock Lane, Demo Colony, Delhi, 110004" }
  ];

  const items = [
    { name: "Document Photocopy (A4)", price: 2, quantity: Math.floor(Math.random() * 50) + 10 },
    { name: "Color Printing (A4)", price: 5, quantity: Math.floor(Math.random() * 30) + 5 },
    { name: "Business Card Printing", price: 1, quantity: Math.floor(Math.random() * 200) + 50 },
    { name: "Poster Printing (A3)", price: 25, quantity: Math.floor(Math.random() * 10) + 1 },
    { name: "Document Binding", price: 50, quantity: Math.floor(Math.random() * 5) + 1 },
    { name: "Lamination (A4)", price: 10, quantity: Math.floor(Math.random() * 20) + 5 }
  ];

  const statuses = ["Processing", "Out for Delivery"];
  const paymentMethods = ["COD", "Prepaid"];
  const urgent = Math.random() > 0.7; // 30% chance of being urgent

  const customer = customers[Math.floor(Math.random() * customers.length)];
  const item = items[Math.floor(Math.random() * items.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  
  const subtotal = item.price * item.quantity;
  const deliveryFee = Math.floor(Math.random() * 50) + 20;
  const total = subtotal + deliveryFee;

  const orderId = `ORD-TEST-${Date.now().toString().slice(-6)}`;
  const orderTime = new Date(Date.now() - Math.random() * 86400000); // Random time in last 24 hours

  return {
    orderId,
    customer: {
      ...customer,
      phone_number: customer.phone,
      email: `${customer.first_name.toLowerCase()}.${customer.last_name.toLowerCase()}@example.com`
    },
    items: [item],
    status,
    payment: {
      method: paymentMethod,
      status: paymentMethod === "Prepaid" ? "Paid" : "Pending"
    },
    delivery: {
      type: "own",
      address: customer.address
    },
    assignedAgentId: agentId,
    totals: {
      subtotal,
      delivery_fee: deliveryFee,
      total
    },
    total,
    urgent,
    createdAt: orderTime,
    date: orderTime.toISOString(),
    timeline: [
      {
        action: "order_placed",
        actor: "Customer",
        ts: orderTime,
        note: "Order placed by customer"
      },
      {
        action: "agent_assigned",
        actor: "Admin",
        ts: new Date(orderTime.getTime() + 15 * 60000), // 15 minutes later
        note: `Assigned to agent ${agentId}`
      },
      ...(status === "Out for Delivery" ? [{
        action: "status_update",
        actor: "Test Agent",
        ts: new Date(orderTime.getTime() + 60 * 60000), // 1 hour later
        note: "Order picked up for delivery"
      }] : [])
    ]
  };
}

// Function to seed test agent orders
export async function seedTestAgentOrders() {
  if (typeof window === 'undefined') return;
  
  try {
    const { db } = await import('@/lib/firebase');
    if (!db) return;
    
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    for (const order of testAgentOrders) {
      // Convert Date objects to Firestore Timestamps
      const orderWithTimestamps = {
        ...order,
        createdAt: Timestamp.fromDate(new Date(order.createdAt)),
        timeline: order.timeline?.map(event => ({
          ...event,
          ts: Timestamp.fromDate(new Date(event.ts))
        }))
      };
      
      await addDoc(collection(db, 'orders'), orderWithTimestamps);
    }
    
    console.log('Test agent orders seeded successfully');
  } catch (error) {
    console.error('Error seeding test agent orders:', error);
  }
}

// Function to add random test orders for specific agent
export async function addRandomTestOrders(agentId: string, count: number = 2) {
  if (typeof window === 'undefined') return;
  
  try {
    const { db } = await import('@/lib/firebase');
    if (!db) return;
    
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    for (let i = 0; i < count; i++) {
      const randomOrder = generateRandomTestOrder(agentId);
      
      // Convert Date objects to Firestore Timestamps
      const orderWithTimestamps = {
        ...randomOrder,
        createdAt: Timestamp.fromDate(new Date(randomOrder.createdAt)),
        timeline: randomOrder.timeline?.map(event => ({
          ...event,
          ts: Timestamp.fromDate(new Date(event.ts))
        }))
      };
      
      await addDoc(collection(db, 'orders'), orderWithTimestamps);
    }
    
    console.log(`${count} random test orders added for agent ${agentId}`);
  } catch (error) {
    console.error('Error adding random test orders:', error);
  }
}

// Function to seed data into Firebase emulator
export async function seedAgentData() {
  if (typeof window === 'undefined') return;
  
  try {
    const { db } = await import('@/lib/firebase');
    if (!db) return;
    
    const { collection, addDoc } = await import('firebase/firestore');
    
    for (const agent of sampleAgents) {
      await addDoc(collection(db, 'agents'), agent);
    }
    
    console.log('Sample agent data seeded successfully');
  } catch (error) {
    console.error('Error seeding agent data:', error);
  }
}

// Function to seed order data into Firebase emulator
export async function seedOrderData() {
  if (typeof window === 'undefined') return;
  
  try {
    const { db } = await import('@/lib/firebase');
    if (!db) return;
    
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    for (const order of sampleOrders) {
      // Convert Date objects to Firestore Timestamps
      const orderWithTimestamps = {
        ...order,
        createdAt: Timestamp.fromDate(new Date(order.createdAt)),
        timeline: order.timeline?.map(event => ({
          ...event,
          ts: Timestamp.fromDate(new Date(event.ts))
        }))
      };
      
      await addDoc(collection(db, 'orders'), orderWithTimestamps);
    }
    
    console.log('Sample order data seeded successfully');
  } catch (error) {
    console.error('Error seeding order data:', error);
  }
}

// Function to seed all sample data
export async function seedAllData() {
  await seedAgentData();
  await seedOrderData();
  await seedTestAgentOrders();
}
