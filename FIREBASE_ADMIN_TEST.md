# Firebase Admin SDK Test

This script tests the Firebase Admin SDK setup and API endpoints.

## Quick Test Commands

```bash
# Test dashboard analytics API
curl -X GET "http://localhost:9002/api/dashboard/analytics"

# Test agents API
curl -X GET "http://localhost:9002/api/agents?active=true"

# Test orders API
curl -X GET "http://localhost:9002/api/orders?page=1&limit=5"

# Test dashboard recent orders API
curl -X GET "http://localhost:9002/api/dashboard/recent-orders?limit=5"

# Test dashboard top customers API
curl -X GET "http://localhost:9002/api/dashboard/top-customers?limit=5"
```

## Expected Results

All endpoints should return either:
1. **Success**: JSON data with `success: true` and real Firebase data
2. **Fallback**: Error message about Firebase Admin SDK requiring service account credentials

## What We Fixed

1. **Dashboard APIs**: Updated to use Firebase Admin SDK
2. **Agents API**: Converted from Client SDK to Admin SDK
3. **Orders API**: Updated for server-side Firebase access
4. **Date Handling**: Fixed `.toDate()` errors in order components
5. **Authentication**: Set up Google Cloud application default credentials

## Next Steps for Production

For production deployment, you'll need to:
1. Generate Firebase service account key
2. Add `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
3. Deploy with proper Firebase Admin SDK credentials