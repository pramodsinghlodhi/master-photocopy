// Authentication Debug Tool - Add this to browser console to check auth state
// Run this in your browser console when on the admin page

console.log('🔍 Firebase Authentication Debug Tool');
console.log('=====================================');

// Check if Firebase is available
if (typeof firebase === 'undefined') {
  console.log('❌ Firebase not loaded');
} else {
  console.log('✅ Firebase loaded');
}

// Check authentication state
if (typeof auth !== 'undefined' && auth.currentUser) {
  const user = auth.currentUser;
  console.log('👤 Current User:', {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified
  });
  
  // Get ID token to check custom claims
  user.getIdTokenResult().then(idTokenResult => {
    console.log('🎫 Custom Claims:', idTokenResult.claims);
    console.log('🔐 Admin Status:', idTokenResult.claims.admin || false);
    console.log('🏷️ Role:', idTokenResult.claims.role || 'none');
    
    // Check token expiration
    console.log('⏰ Token Expiration:', new Date(idTokenResult.expirationTime));
    console.log('🆕 Auth Time:', new Date(idTokenResult.authTime));
    
    // Check if token is fresh
    const tokenAge = Date.now() - new Date(idTokenResult.authTime).getTime();
    console.log('🕐 Token Age (minutes):', Math.round(tokenAge / 60000));
    
    if (tokenAge > 3600000) { // 1 hour
      console.log('⚠️ Token is old, may need refresh');
    }
  }).catch(error => {
    console.error('❌ Error getting ID token:', error);
  });
  
} else {
  console.log('❌ No user logged in');
}

// Check localStorage for auth data
const authData = localStorage.getItem('firebase:authUser:AIzaSyA8HYKjwg20P5zqUBwZaFM8VqPsxJX4rfA:[DEFAULT]');
if (authData) {
  try {
    const parsed = JSON.parse(authData);
    console.log('💾 LocalStorage Auth Data:', {
      uid: parsed.uid,
      email: parsed.email,
      stsTokenManager: parsed.stsTokenManager ? 'Present' : 'Missing'
    });
  } catch (e) {
    console.log('❌ Error parsing localStorage auth data');
  }
} else {
  console.log('❌ No auth data in localStorage');
}

// Function to force token refresh
window.refreshAuthToken = async () => {
  if (auth.currentUser) {
    try {
      console.log('🔄 Refreshing token...');
      await auth.currentUser.getIdToken(true); // Force refresh
      console.log('✅ Token refreshed successfully');
      
      // Get new token with claims
      const newToken = await auth.currentUser.getIdTokenResult();
      console.log('🆕 New Custom Claims:', newToken.claims);
      
      return true;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return false;
    }
  } else {
    console.log('❌ No user to refresh token for');
    return false;
  }
};

console.log('');
console.log('🛠️ Quick Actions:');
console.log('- Run refreshAuthToken() to refresh your token');
console.log('- Check browser Network tab for 400 errors');
console.log('- Verify you are logged in as: pramodlodhi2003born@gmail.com');