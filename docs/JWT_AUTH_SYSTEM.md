# JWT Authentication System

This project implements a comprehensive JWT-based authentication system with session management for Master Photocopy. The system provides secure user authentication, role-based access control, and prevents unauthorized access.

## Features

- 🔐 **JWT Token Authentication** - Secure token-based authentication
- 🍪 **HTTP-Only Cookies** - Secure token storage using HTTP-only cookies
- 🔄 **Automatic Token Refresh** - Seamless token renewal
- 👥 **Role-Based Access Control** - Admin and user roles with middleware protection
- 🛡️ **Session Management** - Server-side session tracking
- 🚫 **Route Protection** - Middleware-based route protection
- 🔧 **Firebase Integration** - Compatible with existing Firebase setup

## Architecture

### Authentication Flow

1. **Login/Register** → JWT tokens generated → Stored in HTTP-only cookies
2. **Request** → Middleware checks tokens → Verifies user → Sets headers
3. **Auto-refresh** → Tokens refreshed automatically before expiration
4. **Logout** → Tokens cleared → Session destroyed

### Components

#### Backend Components

- **`/lib/auth.ts`** - JWT utilities (generate, verify, hash passwords)
- **`/lib/session.ts`** - Session management (create, update, destroy)
- **`/middleware.ts`** - Route protection middleware
- **`/api/auth/*`** - Authentication endpoints

#### Frontend Components

- **`/contexts/AuthContext.tsx`** - React context for auth state
- **`/components/auth/protected-route.tsx`** - Route protection wrapper
- **`/components/auth/login-form.tsx`** - Login form component
- **`/components/auth/signup-form.tsx`** - Registration form component
- **`/components/auth/logout-button.tsx`** - Logout functionality
- **`/components/auth/user-info.tsx`** - User information display

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/refresh` | POST | Token refresh |
| `/api/auth/me` | GET | Get current user |

### Request/Response Examples

#### Login
```javascript
// Request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "accessToken": "jwt_token_here"
}
```

#### Register
```javascript
// Request
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "user"
}

// Response
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "accessToken": "jwt_token_here"
}
```

## Usage

### Setting Up Authentication

1. **Install Dependencies**
   ```bash
   npm install jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs js-cookie @types/js-cookie
   ```

2. **Environment Variables**
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
   ```

3. **Wrap Your App with AuthProvider**
   ```tsx
   import { AuthProvider } from '@/contexts/AuthContext';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <AuthProvider>
             {children}
           </AuthProvider>
         </body>
       </html>
     );
   }
   ```

### Using Authentication in Components

#### Basic Auth Hook
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.name}!</div>;
}
```

#### Protected Routes
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>This content is protected!</div>
    </ProtectedRoute>
  );
}

// Admin-only route
function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div>Admin only content!</div>
    </ProtectedRoute>
  );
}
```

#### Using HOC Pattern
```tsx
import { withAuth } from '@/components/auth/protected-route';

const DashboardPage = withAuth(() => {
  return <div>Protected dashboard content</div>;
});

const AdminPage = withAuth(() => {
  return <div>Admin content</div>;
}, { requireAdmin: true });
```

#### Login Form
```tsx
import { LoginForm } from '@/components/auth/login-form';

function LoginPage() {
  return (
    <div className="max-w-md mx-auto">
      <LoginForm />
    </div>
  );
}
```

#### User Information
```tsx
import { UserInfo } from '@/components/auth/user-info';

function Header() {
  return (
    <header>
      <UserInfo compact={true} />
    </header>
  );
}
```

#### Logout Button
```tsx
import { LogoutButton } from '@/components/auth/logout-button';

function Navigation() {
  return (
    <nav>
      <LogoutButton variant="outline" />
    </nav>
  );
}
```

## Route Protection

The middleware automatically protects routes based on patterns:

### Protected Routes

- **Admin Routes**: `/admin/*`, `/config/*`, `/install/*`
- **User Routes**: `/dashboard/*`, `/orders/*`, `/profile/*`, `/agent/*`
- **Auth Routes**: `/login`, `/register`, `/auth/*` (redirect if authenticated)

### Middleware Behavior

1. **Admin Routes**: Requires authentication + admin role
2. **User Routes**: Requires authentication (any role)
3. **Auth Routes**: Redirects if already authenticated
4. **Public Routes**: No restrictions

## Security Features

### Token Security
- **Access Token**: 15-minute expiration
- **Refresh Token**: 7-day expiration
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Flag**: HTTPS-only in production
- **SameSite**: CSRF protection

### Password Security
- **bcrypt Hashing**: 12 salt rounds
- **Minimum Length**: 6+ characters (configurable)

### Session Management
- **In-Memory Store**: Session tracking (use Redis in production)
- **Auto Cleanup**: Expired sessions removed automatically
- **Session Validation**: Server-side session verification

## Error Handling

The system provides comprehensive error handling:

### Authentication Errors
- Invalid credentials
- Expired tokens
- Missing permissions
- Account disabled
- Rate limiting

### API Error Responses
```javascript
{
  "error": "Invalid email or password",
  "success": false
}
```

## Production Considerations

### Security
1. **Strong Secrets**: Use cryptographically strong JWT secrets
2. **HTTPS**: Enable HTTPS in production
3. **Rate Limiting**: Implement rate limiting for auth endpoints
4. **Session Store**: Use Redis for session storage

### Environment Variables
```env
# Required
JWT_SECRET=your-256-bit-secret-key
JWT_REFRESH_SECRET=your-256-bit-refresh-secret

# Optional (with defaults)
NODE_ENV=production
```

### Redis Session Store (Recommended for Production)
```typescript
// Replace in-memory session store with Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

class RedisSessionManager {
  async createSession(sessionId: string, user: UserPayload) {
    await redis.setex(
      `session:${sessionId}`, 
      24 * 60 * 60, // 24 hours
      JSON.stringify(user)
    );
  }
  
  async getSession(sessionId: string) {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

## Troubleshooting

### Common Issues

1. **"Authentication Required" on every page**
   - Check if AuthProvider is wrapping your app
   - Verify JWT_SECRET is set in environment

2. **Infinite redirect loops**
   - Check middleware matcher patterns
   - Verify protected route configurations

3. **Token refresh fails**
   - Check JWT_REFRESH_SECRET environment variable
   - Verify cookie settings (secure flag in production)

4. **Firebase integration issues**
   - Both systems work independently
   - Firebase handles user creation, JWT handles sessions
   - Firestore stores additional user data

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=auth:*
```

## Migration from Firebase Auth

If migrating from Firebase Auth only:

1. **Keep Firebase** for user creation and management
2. **Add JWT system** for session management
3. **Update components** to use new auth context
4. **Test thoroughly** with existing user data

The system is designed to work alongside Firebase, not replace it entirely.