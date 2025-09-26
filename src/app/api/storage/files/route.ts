import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/services/unified-storage-service';

// File Upload API
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const metadata = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse metadata if provided
    let parsedMetadata;
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error: any) {
      parsedMetadata = {};
    }

    // Upload file
    const result = await storageService.uploadFile(
      buffer,
      file.name,
      {
        contentType: file.type,
        folder: folder || 'uploads',
        metadata: {
          ...parsedMetadata,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Get File API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const action = searchParams.get('action'); // 'download' or 'url'

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    if (action === 'url') {
      // Get signed URL for direct access
      const result = await storageService.getSignedUrl(filePath, 'read', 3600);
      return NextResponse.json({
        success: true,
        data: result,
      });
    } else {
      // Download file content
      const result = await storageService.getFile(filePath);
      
      return new NextResponse(result.buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
        },
      });
    }

  } catch (error: any) {
    console.error('Error getting file:', error);
    return NextResponse.json(
      { error: 'Failed to get file' },
      { status: 500 }
    );
  }
}

// Delete File API
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    const result = await storageService.deleteFile(filePath);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}