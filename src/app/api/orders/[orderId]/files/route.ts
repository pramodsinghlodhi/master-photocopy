import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

interface OrderFile {
  id: string;
  orderId: string;
  name: string;
  path: string;
  type: string;
  size: number;
  uploadedAt: Date | string;
  order: number;
  groupName?: string;
  url?: string;
}

// GET /api/orders/[orderId]/files - Get files for an order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const action = searchParams.get('action'); // 'download' or 'view'
    
    const { orderId } = await params;
    
    // Get Firebase Admin instances
    const db = getFirebaseAdminDB();
    const storage = getStorage();
    
    // Fetch files for the order
    console.log('Querying orderFiles collection for orderId:', orderId);
    const filesSnapshot = await db.collection('orderFiles')
      .where('orderId', '==', orderId)
      .get();
    
    console.log('Query completed. Number of documents found:', filesSnapshot.size);
    
    const files: OrderFile[] = [];
    filesSnapshot.forEach((doc: any) => {
      const data = doc.data();
      console.log('Processing document:', doc.id, 'with data:', data);
      files.push({
        id: doc.id,
        orderId: data.orderId,
        name: data.name,
        path: data.storagePath || data.path, // Handle both old and new field names
        type: data.type,
        size: data.size,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        order: data.order,
        groupName: data.groupName,
        url: data.url // This will be the public URL from storage
      });
    });
    
    console.log('Final files array:', files);
    
    // If requesting a specific file for download/view
    if (fileId && action) {
      const file = files.find(f => f.id === fileId);
      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      
      try {
        // Make the file publicly accessible and return public URL
        const bucket = storage.bucket();
        const fileRef = bucket.file(file.path);
        
        // Check if file exists
        const [exists] = await fileRef.exists();
        if (!exists) {
          return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
        }
        
        // Try to generate signed URL with better error handling
        try {
          const [url] = await fileRef.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
          });
          
          return NextResponse.json({ url });
        } catch (signedUrlError: any) {
          console.warn('Signed URL generation failed:', signedUrlError?.message || signedUrlError);
          
          // Alternative: Make file public and return public URL
          try {
            await fileRef.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.path}`;
            
            return NextResponse.json({ url: publicUrl });
          } catch (publicError) {
            console.error('Failed to make file public:', publicError);
            
            // Last resort: Return the stored URL if available
            if (file.url) {
              return NextResponse.json({ url: file.url });
            }
            
            return NextResponse.json({ 
              error: 'Unable to generate file access URL. Please contact support.',
              details: 'File access configuration issue'
            }, { status: 500 });
          }
        }
      } catch (error) {
        console.error('Error accessing file:', error);
        return NextResponse.json({ 
          error: 'File access error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error in GET /api/orders/[orderId]/files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// POST /api/orders/[orderId]/files - Upload files for an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  let step = '';
  try {
    step = 'Getting orderId from params';
    console.log('File upload API called');
    const { orderId } = await params;
    console.log('Order ID:', orderId);
    
    step = 'Initializing Firebase Admin DB';
    const db = getFirebaseAdminDB();
    console.log('Firebase Admin DB initialized');

    // Check if order exists
    step = 'Checking if order exists';
    console.log('Checking if order exists...');
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      console.log('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    console.log('Order exists');

    step = 'Parsing form data';
    console.log('Parsing form data...');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const groupName = formData.get('groupName') as string || 'Default Group';
    
    console.log('Files received:', files.length);
    console.log('Group name:', groupName);
    console.log('File details:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

    if (!files || files.length === 0) {
      console.log('No files provided');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    step = 'Getting Firebase Storage bucket';
    console.log('Getting Firebase Storage bucket...');
    const bucket = getStorage().bucket();
    console.log('Storage bucket obtained:', bucket.name);

    // Test basic upload with just one file first
    step = 'Processing first file';
    const firstFile = files[0];
    console.log(`Processing first file: ${firstFile.name} (${firstFile.size} bytes)`);
    
    const buffer = Buffer.from(await firstFile.arrayBuffer());
    console.log('File converted to buffer, size:', buffer.length);
    
    const fileName = `orders/${orderId}/${Date.now()}_${firstFile.name}`;
    const fileRef = bucket.file(fileName);
    
    console.log('Uploading to storage path:', fileName);
    
    step = 'Saving file to storage';
    await fileRef.save(buffer, {
      metadata: {
        contentType: firstFile.type,
        metadata: {
          groupName,
          order: '1',
          originalName: firstFile.name,
          uploadedAt: new Date().toISOString(),
          orderId,
        },
      },
    });
    
    console.log('First file saved to storage successfully');
    
    step = 'Generating download URL';
    console.log('Generating download URL...');

    // For development, skip signed URL generation if client_email is not available
    // and use the public URL format instead
    let downloadUrl = '';
    try {
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });
      downloadUrl = signedUrl;
      console.log('Signed URL generated successfully');
    } catch (signError: any) {
      console.warn('Could not generate signed URL, using public URL:', signError.message);
      // Fallback to public URL (works if the bucket has public read access)
      downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
      console.log('Using public URL:', downloadUrl);
    }

    const fileData = {
      id: fileName,
      name: firstFile.name,
      size: firstFile.size,
      type: firstFile.type,
      url: downloadUrl,
      uploadedAt: new Date().toISOString(),
      groupName,
      order: 1,
      storagePath: fileName,
      orderId,
    };

    // Store file metadata in Firestore
    step = 'Saving metadata to Firestore';
    console.log('Saving file metadata to Firestore...');
    await db.collection('orderFiles').add(fileData);
    console.log('File metadata saved successfully');

    // For now, just handle the first file to identify the issue
    step = 'Updating order document';
    console.log('Updating order with file count...');
    const currentData = orderDoc.data();
    const currentFileCount = currentData?.fileCount || 0;
    await db.collection('orders').doc(orderId).update({
      fileCount: currentFileCount + 1,
      lastFileUpload: new Date(),
      updatedAt: new Date(),
    });
    console.log('Order updated successfully');

    console.log('Upload complete, returning response');
    return NextResponse.json({
      success: true,
      data: [fileData],
      message: `Successfully uploaded 1 file (testing mode - processing only first file)`
    });

  } catch (error: any) {
    console.error(`Error during step "${step}":`, error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let userMessage = `Failed to upload files at step: ${step}`;
    let statusCode = 500;
    
    if (error.message?.includes('permission-denied') || error.code === 'permission-denied') {
      userMessage = 'Firebase permissions error. Please check Firebase configuration.';
      statusCode = 403;
    } else if (error.message?.includes('not found') || error.code === 'not-found') {
      userMessage = 'Firebase project or storage bucket not found.';
      statusCode = 404;
    } else if (error.message?.includes('unauthenticated') || error.code === 'unauthenticated') {
      userMessage = 'Firebase authentication error. Please check service account configuration.';
      statusCode = 401;
    } else if (error.message?.includes('quota-exceeded')) {
      userMessage = 'Storage quota exceeded. Please contact support.';
      statusCode = 507;
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        step: step,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code || 'unknown'
      },
      { status: statusCode }
    );
  }
}