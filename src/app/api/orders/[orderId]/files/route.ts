import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

// GET /api/orders/[id]/files - Get files for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdminDB();
    const { id: orderId } = params;

    // Check if order exists
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get files from Firestore database
    const filesSnapshot = await db.collection('orderFiles')
      .where('orderId', '==', orderId)
      .orderBy('order', 'asc')
      .get();

    const orderFiles = await Promise.all(
      filesSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Generate a fresh signed URL for download
        const bucket = getStorage().bucket();
        const file = bucket.file(data.storagePath);
        
        try {
          const [downloadUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          });

          return {
            id: doc.id,
            name: data.name,
            size: data.size,
            type: data.type,
            url: downloadUrl,
            uploadedAt: data.uploadedAt,
            groupName: data.groupName || 'Default Group',
            order: data.order || 1,
          };
        } catch (error) {
          console.error('Error generating signed URL for file:', data.name, error);
          return {
            id: doc.id,
            name: data.name,
            size: data.size,
            type: data.type,
            url: '',
            uploadedAt: data.uploadedAt,
            groupName: data.groupName || 'Default Group',
            order: data.order || 1,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: orderFiles
    });

  } catch (error: any) {
    console.error('Error fetching order files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch order files',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/orders/[id]/files - Upload files for an order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdminDB();
    const { id: orderId } = params;

    // Check if order exists
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const groupName = formData.get('groupName') as string || 'Default Group';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const bucket = getStorage().bucket();
    const uploadPromises = files.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `orders/${orderId}/${Date.now()}_${file.name}`;
      const fileRef = bucket.file(fileName);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            groupName,
            order: (index + 1).toString(),
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            orderId,
          },
        },
      });

      const [downloadUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      const fileData = {
        id: fileName,
        name: file.name,
        size: file.size,
        type: file.type,
        url: downloadUrl,
        uploadedAt: new Date().toISOString(),
        groupName,
        order: index + 1,
        storagePath: fileName,
        orderId,
      };

      // Store file metadata in Firestore
      await db.collection('orderFiles').add(fileData);

      return fileData;
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Update order with file count
    const currentData = orderDoc.data();
    const currentFileCount = currentData?.fileCount || 0;
    await db.collection('orders').doc(orderId).update({
      fileCount: currentFileCount + files.length,
      lastFileUpload: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: uploadedFiles,
      message: `Successfully uploaded ${files.length} file(s)`
    });

  } catch (error: any) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload files',
        details: error.message 
      },
      { status: 500 }
    );
  }
}