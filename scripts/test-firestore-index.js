// Test script to verify Firestore index functionality
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJ4vvDDEh6-qT9D6WVpN3i3JGfWfULY9k",
  authDomain: "master-photocopy.firebaseapp.com",
  projectId: "master-photocopy",
  storageBucket: "master-photocopy.firebasestorage.app",
  messagingSenderId: "285542401885",
  appId: "1:285542401885:web:13af99a7b7b35b36f02eba",
  measurementId: "G-KF8VPTQPW6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testIndexQuery() {
  try {
    console.log('Testing Firestore index query...');
    
    // Test the exact same query that our component uses
    const testUserId = "test-user-123"; // This should be a test ID
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', testUserId),
      orderBy('createdAt', 'desc')
    );

    console.log('Query created successfully. Attempting to fetch data...');
    const querySnapshot = await getDocs(ordersQuery);
    
    console.log(`✅ Query executed successfully!`);
    console.log(`Found ${querySnapshot.size} orders for test user`);
    
    if (querySnapshot.size > 0) {
      querySnapshot.forEach(doc => {
        console.log('Order ID:', doc.id);
        console.log('Order data:', doc.data());
      });
    } else {
      console.log('No orders found for test user (this is expected if no test data exists)');
    }

    return true;
  } catch (error) {
    console.error("❌ Query failed:", error);
    
    if (error.message && error.message.includes('requires an index')) {
      console.log('\n📋 Index is still building. This is expected for a few minutes after deployment.');
      console.log('   The fallback query in the component should handle this gracefully.');
    }
    
    return false;
  }
}

// Test simple query without orderBy as fallback
async function testFallbackQuery() {
  try {
    console.log('\nTesting fallback query (without orderBy)...');
    
    const testUserId = "test-user-123";
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', testUserId)
    );

    const querySnapshot = await getDocs(ordersQuery);
    console.log(`✅ Fallback query executed successfully!`);
    console.log(`Found ${querySnapshot.size} orders for test user`);
    
    return true;
  } catch (error) {
    console.error("❌ Fallback query also failed:", error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🔍 Testing Firestore index functionality...\n');
  
  const indexTest = await testIndexQuery();
  const fallbackTest = await testFallbackQuery();
  
  console.log('\n📋 Test Results:');
  console.log(`- Composite index query: ${indexTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`- Fallback query: ${fallbackTest ? '✅ Working' : '❌ Failed'}`);
  
  if (indexTest) {
    console.log('\n🎉 Index is ready! Order history should work perfectly.');
  } else if (fallbackTest) {
    console.log('\n⏳ Index is still building, but fallback is working.');
    console.log('   Order history will work with client-side sorting.');
  } else {
    console.log('\n⚠️  Both queries failed. Check Firestore configuration.');
  }
}

// Run if called directly
if (process.argv[1].endsWith('test-firestore-index.js')) {
  runTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testIndexQuery, testFallbackQuery };
