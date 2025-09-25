import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/services/unified-storage-service';

// List Files API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix');
    const maxResults = searchParams.get('maxResults');

    const result = await storageService.listFiles({
      prefix: prefix || undefined,
      maxResults: maxResults ? parseInt(maxResults) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}