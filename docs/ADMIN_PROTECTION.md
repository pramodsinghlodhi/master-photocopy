# Admin Route Protection

This document explains the admin route protection system implemented for `/config` and `/install` pages.

## Protected Routes

The following routes now require administrator authentication:

- **`/config`** - System configuration wizard (Firebase, APIs, integrations)
- **`/install`** - System installation and setup wizard

## How It Works

### 1. Component-Level Protection
- Both routes use the `AdminProtectedRoute` component
- Automatically checks user authentication status
- Verifies admin role from Firestore user document
- Shows appropriate error messages for unauthorized access

### 2. Role-Based Access Control
- Users must have `role: "admin"` or `role: "Admin"` in their Firestore user document
- Authentication state is managed through Firebase Auth
- User role data is fetched from the `users` collection in Firestore

### 3. Access States

#### ✅ **Authorized Access**
- User is authenticated with Firebase Auth
- User has admin role in Firestore
- Full access to protected pages

#### ⚠️ **Unauthorized Access States**

1. **Not Authenticated**
   - Redirects to `/login` with return URL
   - Shows authentication required message

2. **Authenticated but Not Admin**
   - Shows "Access Denied" message
   - Provides navigation options to dashboard/home

3. **Authentication Error**
   - Shows error message with retry option
   - Handles Firebase connection issues

4. **Loading State**
   - Shows verification spinner
   - Prevents flash of unauthorized content

## Setting Up Admin Users

### Option 1: Automated Script (Recommended)
```bash
# Run the admin user creation script
./scripts/create-admin-user.sh
```

### Option 2: Manual Setup
1. Create user in Firebase Console → Authentication
2. Add user document to Firestore:
```javascript
// users/{userId}
{
  uid: "user-id",
  email: "admin@company.com", 
  name: "Administrator",
  role: "admin",
  permissions: ["read", "write", "delete", "manage_users", "manage_system"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## Security Features

### 1. Client-Side Protection
- React components verify authentication
- Real-time auth state monitoring
- Graceful error handling

### 2. Server-Side Headers
- Middleware adds `x-admin-protected` header
- Route-level protection markers

### 3. Database Security
- Firestore rules enforce admin-only access
- User role verification at database level

## User Experience

### Admin Users
- Seamless access to protected pages
- No additional login prompts
- Full configuration capabilities

### Non-Admin Users
- Clear access denied messages
- Helpful navigation options
- No exposure to admin functionality

### Unauthenticated Users
- Automatic redirect to login
- Return URL preservation
- Clear authentication prompts

## Customization

### Custom Error Messages
```tsx
<AdminProtectedRoute fallbackMessage="Custom message here">
  <YourComponent />
</AdminProtectedRoute>
```

### Additional Protected Routes
1. Wrap component with `AdminProtectedRoute`
2. Add route to middleware matcher (optional)
3. Update Firestore security rules if needed

## Testing

### Test Admin Access
1. Login with admin credentials
2. Navigate to `/config` or `/install`
3. Should see full page content

### Test Non-Admin Access
1. Login with regular user credentials
2. Navigate to `/config` or `/install`
3. Should see "Access Denied" message

### Test Unauthenticated Access
1. Logout from application
2. Navigate to `/config` or `/install`
3. Should redirect to login page

## Security Considerations

- **Never rely solely on client-side protection**
- **Always implement server-side validation**
- **Use Firestore security rules for data protection**
- **Regularly audit admin user access**
- **Monitor authentication logs**

## Troubleshooting

### Common Issues

1. **"Access Denied" for Admin User**
   - Check user document in Firestore
   - Verify `role` field is set to "admin"
   - Ensure user is properly authenticated

2. **Infinite Loading State**
   - Check Firebase connection
   - Verify environment variables
   - Check browser console for errors

3. **Redirect Loop**
   - Clear browser cache/cookies
   - Check Firebase Auth configuration
   - Verify login page functionality
