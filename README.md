# 🚀 Masterphoto Copy - Smart Photocopy Order Management System

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Firebase-11.9.1-orange?style=for-the-badge&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4.1-cyan?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
</div>

<p align="center">
  <strong>A comprehensive Next.js application for managing photocopy orders with dual delivery options, AI-powered document analysis, and seamless integrations.</strong>
</p>

---

© 2025 Metatag Solution. All rights reserved.  
Crafted with precision by **PramodSingh Lodhi**, CEO of Metatag Solution.  
This application and its documentation are intellectual property of Metatag Solution and are protected under applicable copyright and trademark laws.

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Installation Methods](#-installation-methods)
- [⚙️ Configuration](#️-configuration)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [📱 Application Structure](#-application-structure)
- [🤝 Contributing](#-contributing)

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Firebase CLI** - `npm install -g firebase-tools`
- **Git** - Version control

### 1-Minute Setup

```bash
# Clone the repository
git clone https://github.com/your-username/masterphotocopy.git
cd masterphotocopy

# Run the automated setup
chmod +x scripts/enhanced-setup.sh
./scripts/enhanced-setup.sh

# Start development environment
npm run dev
```

🎉 **Your app is live!** Visit the hosted application at:

### 📞 IMMEDIATE ACCESS
Since your application is currently running:
* 🏠 **Main Application:** https://master-photocopy--master-photocopy.us-central1.hosted.app
* 🛠️ **Installation Guide:** https://master-photocopy--master-photocopy.us-central1.hosted.app/install
* ⚙️ **Configuration:** https://master-photocopy--master-photocopy.us-central1.hosted.app/config
* 👨‍💼 **Admin Panel:** https://master-photocopy--master-photocopy.us-central1.hosted.app/admin
* ❤️ **Health Check:** https://master-photocopy--master-photocopy.us-central1.hosted.app/api/health

For local development, you can also run `npm run dev` and access `http://localhost:9002`.

## 📦 Installation Methods

### Method 1: Guided Installation (Recommended)

1. **Clone and Setup**
   ```bash
   git clone https://github.com/your-username/masterphotocopy.git
   cd masterphotocopy
   chmod +x scripts/enhanced-setup.sh
   ./scripts/enhanced-setup.sh
   ```

2. **Visit Installation Page**
   - Start the development server: `npm run dev` (for local development)
   - Or use the live app: `https://master-photocopy--master-photocopy.us-central1.hosted.app/install`
   - Follow the guided setup wizard

3. **Configuration Wizard**
   - Visit: `https://master-photocopy--master-photocopy.us-central1.hosted.app/config` (live)
   - Or locally: `http://localhost:9002/config` (if running dev server)
   - Configure all services and integrations

### Method 2: Manual Installation

1. **Install Dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Setup Firebase**
   ```bash
   firebase login
   firebase init
   ```

4. **Build and Start**
   ```bash
   npm run build
   npm run dev
   ```

### Method 3: Development with Emulators

```bash
# Install and setup
npm install
./scripts/enhanced-setup.sh

# Start Firebase emulators
npm run emulators

# In another terminal, start Next.js
npm run dev
```

## ✨ Features

### � **Authentication & User Management**
- Multi-provider authentication (Email, Phone, Google)
- Role-based access control (Customer, Agent, Admin)
- Password reset via OTP/Email
- User profile management

### 📄 **Smart Document Processing**
- Drag & drop multiple PDF upload
- Real-time file preview with thumbnails
- File grouping and batch processing
- Page range selection per file/group
- Document merge capabilities

### 🤖 **AI-Powered Analysis**
- Document type detection (Resume, Thesis, Contract, etc.)
- Formatting quality scoring (0-100)
- Improvement suggestions using Google AI & Genkit
- Smart upsell triggers

### 💰 **Dynamic Pricing Engine**
- Real-time price calculation: `Pages × Color × Sides × Binding`
- File-level and group-level discounts
- Editable pricing in admin panel
- Multiple payment modes (advance/full)

### 🎁 **Referral & Rewards System**
- Refer & Earn: ₹10 for both parties
- Auto-convert credits to coupons
- Promo code system (SAVE10, FREESPIRAL, etc.)
- In-app wallet integration

### � **Dual Delivery System**
- **Own Delivery Agents**: Local area coverage with OTP-based delivery
- **Shiprocket Integration**: Pan-India coverage with automated tracking

### 📱 **Multi-Channel Notifications**
- WhatsApp Business API integration
- Email notifications
- Push notifications
- SMS alerts

### 📊 **Advanced Analytics**
- Google Analytics integration
- Custom dashboard metrics
- Order analytics
- Revenue tracking

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15.5.2** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component library
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### **Backend & Database**
- **Firebase** - Authentication, Firestore, Storage, Functions
- **Node.js** - Runtime environment
- **Express.js** - API framework
- **TypeScript** - Server-side type safety

### **AI & ML**
- **Google AI** - Document analysis and insights
- **Genkit** - AI workflow management
- **Firebase ML** - Machine learning capabilities

### **Integrations**
- **WhatsApp Business API** - Customer communication
- **Razorpay** - Payment processing
- **Shiprocket** - Logistics and delivery
- **Google Analytics** - Usage analytics

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Firebase Emulators** - Local development

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main user pages
│   ├── admin/             # Admin dashboard
│   ├── agent/             # Agent portal
│   └── api/               # API routes
├── components/
│   ├── admin/             # Admin components
│   ├── agent/             # Agent components
│   ├── auth/              # Authentication components
│   ├── order/             # Order management components
│   ├── shared/            # Shared components
│   └── ui/                # UI components
├── lib/                   # Utilities and configurations
└── hooks/                 # Custom React hooks

functions/
├── src/
│   ├── index.ts           # Main Cloud Functions entry
│   ├── webhookHandler.ts  # Webhook processing
│   ├── shiprocketService.ts # Shiprocket integration
│   ├── orderService.ts    # Order management logic
│   └── notificationService.ts # Messaging system
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Firebase CLI
- Firebase project with billing enabled

### 1. Clone and Install
```bash
git clone <repository-url>
cd masterphotocopy
npm install
```

### 2. Firebase Setup
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
# - Emulators
```

### 3. Environment Configuration

Create `.env.local` in the root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Shiprocket Configuration
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password

# WhatsApp Business API
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `functions/.env` for Cloud Functions:
```env
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### 4. Database Setup

Your database will be ready to use after running the setup scripts. No additional seeding is required.

### 5. Development

Start the development environment:
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start Next.js
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Firebase Emulators**: http://localhost:4000
- **Functions**: http://localhost:5001

## API Endpoints

### Webhook Endpoints
- `POST /webhooks/general` - General webhook handler
- `POST /webhooks/shiprocket` - Shiprocket status updates

### Order Management
- `POST /orders/assign` - Assign order to agent
- `POST /orders/update-status` - Update order status
- `POST /orders/validate-otp` - Validate delivery OTP

### Agent Management
- `POST /agents/onboard` - Agent onboarding
- `POST /agents/approve` - Approve agent registration

## User Workflows

### Customer Journey
1. Place order through main interface
2. Receive order confirmation
3. Get delivery updates via WhatsApp/SMS
4. Provide OTP to delivery agent
5. Receive delivery confirmation

### Agent Journey
1. Register through agent portal
2. Complete onboarding with documents
3. Wait for admin approval
4. Login with phone OTP
5. Receive order assignments
6. Update delivery status
7. Complete deliveries with customer OTP

### Admin Journey
1. Monitor orders in real-time
2. Approve/reject agents
3. Assign orders manually
4. Track delivery performance
5. Manage system settings

## Delivery Types

### Own Delivery
- Internal delivery agents
- Local area coverage
- Direct agent assignment
- OTP-based delivery confirmation

### Shiprocket Integration
- Third-party logistics
- Pan-India coverage
- Automated shipment creation
- Webhook-based tracking updates

## Security

- **Firebase Security Rules**: Role-based access control
- **Authentication**: Phone OTP for agents, Email/Password for admins
- **Data Validation**: Comprehensive input validation
- **API Security**: Function-level authorization

## Testing

### Local Testing
```bash
# Start emulators
firebase emulators:start

# Run tests
npm run test
```

### Webhook Testing
Use tools like ngrok to expose local endpoints for webhook testing:
```bash
ngrok http 5001
```

## Deployment

### Deploy to Firebase
```bash
# Build the application
npm run build

# Deploy to Firebase
firebase deploy
```

### Environment Variables for Production
Update Firebase Functions configuration:
```bash
firebase functions:config:set 
  shiprocket.email="your_email" 
  shiprocket.password="your_password" 
  whatsapp.api_key="your_key" 
  whatsapp.phone_number_id="your_id"
```

## Monitoring

- **Firebase Console**: Monitor functions, database, and authentication
- **Error Tracking**: Built-in Firebase error reporting
- **Performance**: Real-time database and function metrics

## Support

For setup issues or feature requests, please check:
1. Firebase console for any configuration issues
2. Function logs for runtime errors
3. Network panel for API call failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request

---

**Note**: This is a comprehensive order management system designed for photocopy shops with delivery requirements. The dual delivery system allows flexibility between local agents and third-party logistics based on order location and urgency.

---

## Features

### User-Facing Application
- **Smart Order Upload:** Upload multiple PDFs, drag-and-drop to create groups for batch printing.
- **Custom Print Settings:** Per-file or per-group settings for single/double-sided, color/B&W, and various binding options.
- **AI Document Analysis:** Leverages Genkit to analyze documents, score formatting quality, and provide improvement suggestions.
- **Real-Time Pricing:** Transparent pricing that updates instantly as you customize your print job.
- **User Authentication:** Secure login and sign-up using Firebase Authentication (Email/Password & Google).
- **Order History & Invoices:** View past orders and download PDF invoices.
- **Wallet System:** Users have a wallet for credits and can convert balances to coupon codes.
- **Referral System:** Earn rewards by referring friends.

### Admin Dashboard
- **Analytics:** View key metrics like revenue, orders, new customers, and sales charts.
- **Order Management:** View, track, and update the status of all customer orders.
- **Shipment Generation:** Create shipments via Shiprocket (or a mock service) and generate tracking IDs.
- **Customer Management:** View customer details, order history, and manage user status.
- **Content Management:** Edit legal pages like Terms of Service and Privacy Policy directly from the dashboard.
- **And much more:** Manage pricing, coupons, ad banners, support tickets, and staff accounts.

---

## Tech Stack

- **Framework:** Next.js (with App Router)
- **Styling:** Tailwind CSS with ShadCN UI components
- **Generative AI:** Google AI & Genkit
- **Backend & Database:** Firebase (Authentication, Firestore)
- **PDF Generation:** `pdf-lib`

---

## File Structure

Here is an overview of the key files and directories:

```
/
├── src/
│   ├── app/
│   │   ├── (auth)/         # Auth routes (login, signup)
│   │   ├── (main)/         # Main app routes after login (dashboard, order)
│   │   ├── admin/          # All admin dashboard routes
│   │   ├── api/            # API routes (if any)
│   │   ├── legal/          # Legal pages (terms, privacy)
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── ai/
│   │   ├── flows/          # Genkit AI flows for document analysis, etc.
│   │   └── genkit.ts       # Genkit configuration
│   ├── components/
│   │   ├── auth/           # Authentication forms
│   │   ├── dashboard/      # Components for the user dashboard
│   │   ├── order/          # Components for the order creation page
│   │   ├── shared/         # Reusable components (Header, Notifications)
│   │   └── ui/             # ShadCN UI components
│   ├── lib/
│   │   ├── firebase.ts     # Firebase initialization and configuration
│   │   ├── mock-db.ts      # Mock data for admin panel (can be replaced with API calls)
│   │   ├── types.ts        # TypeScript types for the application
│   │   └── utils.ts        # Utility functions
│   └── hooks/
│       └── use-toast.ts    # Toast notification hook
├── public/                 # Static assets
├── .env.example            # Example environment variables file
└── package.json
```

---

## Firebase Setup & Local Development (Step-by-Step Guide)

To run this project locally with all features (authentication, database, etc.) enabled, you need to connect it to a Firebase project.

### Step 1: Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the on-screen instructions to create a new project. Give it a name like "MasterphotoCopy".

### Step 2: Create a Web App

1.  Inside your new Firebase project, click the Web icon (`</>`) to create a new Web App.
2.  Give your app a nickname (e.g., "Masterphoto Web App").
3.  Click **"Register app"**. You do **NOT** need to add the SDK scripts.
4.  You will see a `firebaseConfig` object. This contains your project keys. Keep this page open.

### Step 3: Configure Your Local Environment

1.  In the project's root directory, find the `.env.example` file.
2.  Rename it to `.env`.
3.  Copy the values from the `firebaseConfig` object in the Firebase console and paste them into your `.env` file.

    **Where to find the values:**
    Your `firebaseConfig` object will look like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abcdef..."
    };
    ```

    **What to change in `.env`:**
    You need to copy each value into the corresponding `NEXT_PUBLIC_` variable in your `.env` file. For example:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    # ... and so on for all the keys.
    ```
    **This is the only code change you need to make to connect to Firebase.**

### Step 4: Enable Firebase Services

1.  **Authentication:**
    *   In the Firebase Console, go to **Build > Authentication**.
    *   Click **"Get started"**.
    *   Under the **"Sign-in method"** tab, enable **"Email/Password"** and **"Google"**.

2.  **Firestore Database:**
    *   In the Firebase Console, go to **Build > Firestore Database**.
    *   Click **"Create database"**.
    *   Start in **Test mode** for easy local development. This allows open read/write access.
    *   Choose a location for your database.
    *   Click **"Enable"**.

### Step 5: Install Dependencies and Run

Now that your environment is configured, you can run the app.

1.  Open your terminal in the project's root directory.
2.  Install the necessary packages:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

Your application is now live at `https://master-photocopy--master-photocopy.us-central1.hosted.app` and fully connected to your Firebase project. You can sign up, log in, and place orders.

For local development, run `npm run dev` and access `http://localhost:9002`.

---

## 🚀 Deployment

This application is configured for **Firebase App Hosting** - Google's modern hosting solution with built-in SSR and automatic scaling.

### Quick Deploy Steps

1. **Connect to Firebase App Hosting:**
   ```bash
   firebase login
   firebase use your-project-id
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

3. **Automatic Deployment:**
   - Firebase App Hosting automatically builds and deploys from your GitHub repository
   - No manual build steps required
   - Automatic scaling based on traffic

### Manual Deploy (Functions only)
```bash
# Deploy Cloud Functions and database rules
npm run deploy:functions
```

### Features
✅ **Server-Side Rendering** - Full Next.js SSR support  
✅ **Automatic Scaling** - Zero to multiple instances  
✅ **Custom Domains** - Easy domain setup  
✅ **HTTPS** - Automatic SSL certificates  
✅ **Global CDN** - Worldwide content delivery

For detailed setup instructions, see [FIREBASE_APP_HOSTING.md](./FIREBASE_APP_HOSTING.md)


> Product Branding: Masterphoto Copy™ by Metatag Solution  
> Author: PramodSingh Lodhi  
> Website: [https://metatagsolution.com](https://metatagsolution.com)  
> Email: hello@metatagsolution.com
---
# master-photocopy
