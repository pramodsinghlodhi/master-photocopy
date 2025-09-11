# **App Name**: Masterphoto Copy

## Core Features:

- Authentication: Email / Phone / Google Sign-Up & Login. Password reset via OTP or Email. Firebase Auth or custom JWT-based authentication
- Smart Order Upload + Grouping: Upload multiple PDF files in a single order. Drag & Drop file reordering with live preview. Auto file counter with thumbnails. Group files into print batches to apply settings per group or file. Merge grouped files into one for easy printing. Track upload & order status in real-time
- Admin Folder Mapping: Automatically create and manage folders on server based on user's name: `/MasterphotoCopy/Users/JohnDoe/Order_789/file1.pdf`. Admin can directly access files by customer folder. Great for repeat orders, record keeping, or reprinting requests. Ensures logical organization for backend processing. Tied into dashboard for quick order reference
- Print Settings (Per File / Per Group): Single-Side / Double-Side. Black & White / Color. Spiral binding options (plastic, metal, etc.). Page range selection per file or batch. Create and reuse Print Presets like: "Resume Pack", "Project Report", "College Thesis"
- Smart Pricing Engine: Real-time price calculation based on: `Pages × Color × Sides × Binding`. Discounts at file-level or group-level. Accept advance or full payments. Editable per-page pricing in admin panel
- Referral & Coupon System: Refer & Earn: ₹10 for both referrer & referee. Auto-convert referral credits into printable coupons. Apply promo codes at checkout (SAVE10, FREESPIRAL, etc.). In-app wallet to track & spend earned credits
- AI-Powered Document Analysis: Built-in Firebase ML Natural Language engine performs: Document Type Detection: Resume, Thesis, Contract, Report. Formatting Score: Rates document layout & structure (0–100). Improvement Suggestions: Offers feedback if formatting is weak. AI-Upsell Triggers: Smart in-app banners and Auto WhatsApp prompts for offers & feedback

## Style Guidelines:

- Splash Screen, Login / Signup / Forgot Password, Home Dashboard, New Order, Upload Files, Create File Groups, Apply Print Settings, Apply Coupons, View Real-Time Price Summary, Select Payment Mode, Order Status & History, Referral Program (Earn & Track ₹), AI Suggestions (Banner-based), In-App Wallet