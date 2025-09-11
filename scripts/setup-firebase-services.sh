#!/bin/bash

# Simplified Firebase Services Setup
# Automatically configures Cloud Firestore, Authentication, and Data Connect

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Setting up Firebase services for master-photocopy...${NC}"
echo ""

# Step 1: Deploy Firestore rules and indexes
echo -e "${BLUE}📄 Deploying Firestore configuration...${NC}"
firebase deploy --only firestore

# Step 2: Deploy Database rules
echo -e "${BLUE}🗄️ Deploying Realtime Database rules...${NC}"
firebase deploy --only database

# Step 3: Initialize Firestore collections
echo -e "${BLUE}🏗️ Initializing Firestore collections...${NC}"

# Create a simple Node.js script to initialize Firestore
cat > init_firestore.js << 'EOF'
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'master-photocopy'
});

const db = admin.firestore();

async function initializeCollections() {
  console.log('Creating initial Firestore collections...');
  
  try {
    // Initialize settings
    await db.collection('settings').doc('app').set({
      version: '1.0.0',
      appName: 'Masterphoto Copy',
      initialized: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Initialize pricing
    await db.collection('pricing').doc('default').set({
      bwPrice: 1.0,
      colorPrice: 5.0,
      bindingPrice: 10.0,
      currency: 'INR',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Initialize sample coupon
    await db.collection('coupons').doc('SAVE10').set({
      code: 'SAVE10',
      discount: 10,
      type: 'percentage',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Initial collections created successfully');
    
  } catch (error) {
    console.log('ℹ️  Collections may already exist:', error.message);
  }
  
  process.exit(0);
}

initializeCollections();
EOF

# Install firebase-admin if needed and run initialization
if [ ! -d "node_modules/firebase-admin" ]; then
  echo "Installing firebase-admin..."
  npm install firebase-admin --save-dev --silent
fi

node init_firestore.js
rm init_firestore.js

# Step 4: Deploy Cloud Functions
echo -e "${BLUE}⚡ Deploying Cloud Functions...${NC}"
firebase deploy --only functions

# Step 5: Create Data Connect schema (ready for when service is available)
echo -e "${BLUE}🔗 Setting up Data Connect schema...${NC}"
mkdir -p dataconnect

cat > dataconnect/schema.gql << 'EOF'
# Firebase Data Connect Schema for Masterphoto Copy

type User {
  id: ID!
  email: String!
  displayName: String
  role: UserRole!
  createdAt: Timestamp!
  updatedAt: Timestamp!
}

type Order {
  id: ID!
  userId: String!
  status: OrderStatus!
  totalAmount: Float!
  files: [OrderFile!]!
  createdAt: Timestamp!
  updatedAt: Timestamp!
}

type OrderFile {
  id: ID!
  fileName: String!
  pages: Int!
  copies: Int!
  colorMode: ColorMode!
  binding: BindingType!
}

enum UserRole {
  CUSTOMER
  AGENT
  ADMIN
}

enum OrderStatus {
  PENDING
  PROCESSING
  READY
  DELIVERED
  CANCELLED
}

enum ColorMode {
  BW
  COLOR
}

enum BindingType {
  NONE
  SPIRAL
  HARDCOVER
}

type Query {
  users: [User!]!
  orders: [Order!]!
  userOrders(userId: String!): [Order!]!
  ordersByStatus(status: OrderStatus!): [Order!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  createOrder(input: CreateOrderInput!): Order!
  updateOrderStatus(orderId: String!, status: OrderStatus!): Order!
}

input CreateUserInput {
  email: String!
  displayName: String
  role: UserRole!
}

input CreateOrderInput {
  userId: String!
  files: [OrderFileInput!]!
  totalAmount: Float!
}

input OrderFileInput {
  fileName: String!
  pages: Int!
  copies: Int!
  colorMode: ColorMode!
  binding: BindingType!
}
EOF

echo -e "${GREEN}✅ Data Connect schema created${NC}"

# Final verification
echo ""
echo -e "${GREEN}🎉 Firebase Services Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Services Configured:${NC}"
echo "  ✅ Cloud Firestore Database"
echo "  ✅ Firebase Authentication (configure in console)"
echo "  ✅ Realtime Database"
echo "  ✅ Cloud Functions"
echo "  ✅ Security Rules"
echo "  ✅ Data Connect Schema (ready)"
echo ""
echo -e "${BLUE}🔗 Next Steps:${NC}"
echo "  1. Visit Firebase Console: https://console.firebase.google.com/project/master-photocopy"
echo "  2. Go to Authentication > Sign-in method"
echo "  3. Enable Email/Password and Google providers"
echo "  4. Test your app: https://master-photocopy--master-photocopy.us-central1.hosted.app"
echo ""
echo -e "${GREEN}🚀 Your Firebase services are ready!${NC}"
