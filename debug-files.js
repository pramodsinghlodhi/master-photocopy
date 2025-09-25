// Debug script to check Firestore data
const { getFirebaseAdminDB } = require('./src/lib/firebase-admin');

async function debugFiles() {
  try {
    const db = getFirebaseAdminDB();
    const orderId = 'Wk1VKTdtuXYTXXMtDlfV';
    
    console.log('Querying for files with orderId:', orderId);
    
    // Check all documents in orderFiles collection
    const allFilesSnapshot = await db.collection('orderFiles').get();
    console.log('Total documents in orderFiles collection:', allFilesSnapshot.size);
    
    allFilesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Document ID:', doc.id);
      console.log('Document data:', JSON.stringify(data, null, 2));
    });
    
    // Now query for specific orderId
    const filesSnapshot = await db.collection('orderFiles')
      .where('orderId', '==', orderId)
      .get();
    
    console.log('Documents found for orderId', orderId, ':', filesSnapshot.size);
    
    const files = [];
    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      files.push({
        id: doc.id,
        orderId: data.orderId,
        name: data.name,
        path: data.storagePath || data.path,
        type: data.type,
        size: data.size,
        uploadedAt: data.uploadedAt,
        order: data.order,
        groupName: data.groupName,
        url: data.url
      });
    });
    
    console.log('Final files array:', JSON.stringify(files, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugFiles();