import { NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import JSZip from 'jszip';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    // Get Firebase Admin instances
    const db = getFirebaseAdminDB();
    const storage = getStorage();
    
    // Fetch files for the order
    const filesSnapshot = await db.collection('orderFiles')
      .where('orderId', '==', orderId)
      .get();
    
    const files: OrderFile[] = [];
    filesSnapshot.forEach((doc: any) => {
      const data = doc.data();
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
        url: data.url
      });
    });
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files found for this order' }, { status: 404 });
    }
    
    // Create ZIP file
    const zip = new JSZip();
    const bucket = storage.bucket();
    
    // Download all files and add to ZIP
    for (const file of files) {
      try {
        const fileRef = bucket.file(file.path);
        const [exists] = await fileRef.exists();
        
        if (exists) {
          const [buffer] = await fileRef.download();
          
          // Organize files by group in ZIP
          const folderName = file.groupName || 'Ungrouped';
          zip.folder(folderName)?.file(file.name, buffer);
        } else {
          console.warn(`File not found in storage: ${file.path}`);
        }
      } catch (fileError) {
        console.error(`Error downloading file ${file.name}:`, fileError);
        // Continue with other files even if one fails
      }
    }
    
    // Generate ZIP content
    const zipContent = await zip.generateAsync({ 
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Return ZIP file
    return new NextResponse(zipContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="order-${orderId}-files.zip"`,
        'Content-Length': zipContent.length.toString(),
      },
    });
    
  } catch (error: any) {
    console.error('Error in bulk download:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create bulk download',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}