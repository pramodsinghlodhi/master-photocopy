# 🚀 Firebase App Hosting Deployment Guide

## Quick Setup for Firebase App Hosting

Firebase App Hosting provides a modern hosting solution with built-in server-side rendering and automatic scaling for Next.js applications.

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project with App Hosting enabled
- GitHub repository connected to Firebase

### 1. Initial Setup

```bash
# Clone and install dependencies
git clone <your-repo-url>
cd masterphotocopy
npm install

# Setup Firebase
firebase login
firebase use <your-project-id>
```

### 2. Environment Configuration

Create `.env.local` with your Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Add other service configurations as needed
RAZORPAY_KEY_ID=your_razorpay_key
WHATSAPP_API_TOKEN=your_whatsapp_token
SHIPROCKET_API_KEY=your_shiprocket_key
```

### 3. Local Development

```bash
# Start development server
npm run dev

# Start Firebase emulators (optional)
npm run emulators
```

### 4. Deployment

Firebase App Hosting automatically deploys from your GitHub repository when you push to the main branch.

**Manual deployment:**
```bash
# Deploy Cloud Functions and Firestore rules
npm run deploy:functions

# App Hosting will automatically build and deploy the Next.js app
```

### 5. App Hosting Configuration

The `apphosting.yaml` file configures your hosting environment:

- **Auto-scaling:** 0-3 instances based on traffic
- **Resources:** 1 CPU, 1GB RAM per instance
- **Build:** Automatic npm install and build

### 6. Features Enabled

✅ **Server-Side Rendering** - Full Next.js SSR support  
✅ **Automatic Scaling** - Zero to multiple instances  
✅ **Custom Domains** - Easy domain setup  
✅ **HTTPS** - Automatic SSL certificates  
✅ **CDN** - Global content delivery  
✅ **Environment Variables** - Secure config management  

### 7. Monitoring

- **Firebase Console:** Real-time metrics and logs
- **Performance:** Built-in performance monitoring
- **Analytics:** Google Analytics integration

### 8. Costs

Firebase App Hosting pricing:
- **Free tier:** Generous limits for development
- **Pay-as-you-go:** Based on actual usage
- **Predictable:** No surprise charges

---

## Troubleshooting

### Build Issues
```bash
# Clean build cache
npm run clean
npm install
npm run build
```

### Environment Variables
- Set production environment variables in Firebase Console
- Check App Hosting settings for env var configuration

### Domain Setup
- Add custom domain in Firebase Console
- Update DNS records as provided
- SSL certificates are automatic

---

**🎉 Your Masterphoto Copy application is ready for Firebase App Hosting!**

For more details, visit the [Firebase App Hosting documentation](https://firebase.google.com/docs/app-hosting).
