import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface FileUploadSettings {
  ads: {
    maxSize: number; // in bytes
    allowedTypes: string[];
    enabled: boolean;
  };
  profiles: {
    maxSize: number;
    allowedTypes: string[];
    enabled: boolean;
  };
  documents: {
    maxSize: number;
    allowedTypes: string[];
    enabled: boolean;
  };
  orders: {
    maxSize: number;
    allowedTypes: string[];
    enabled: boolean;
  };
  general: {
    compressionQuality: number; // 0.1 to 1.0
    enableCompression: boolean;
    enableVirusScan: boolean;
    maxFileNameLength: number;
  };
}

// Default settings
const defaultSettings: FileUploadSettings = {
  ads: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    enabled: true
  },
  profiles: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    enabled: true
  },
  documents: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    enabled: true
  },
  orders: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    enabled: true
  },
  general: {
    compressionQuality: 0.8,
    enableCompression: true,
    enableVirusScan: false,
    maxFileNameLength: 100
  }
};

// GET /api/admin/upload-settings - Fetch upload settings
export async function GET() {
  try {
    const db = getFirebaseAdminDB();
    const settingsDoc = await db.collection('admin_settings').doc('file_upload').get();

    if (!settingsDoc.exists) {
      // Create default settings if they don't exist
      await db.collection('admin_settings').doc('file_upload').set(defaultSettings);
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settingsDoc.data() as FileUploadSettings);
  } catch (error: any) {
    console.error('Error fetching upload settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/upload-settings - Update upload settings
export async function PUT(request: NextRequest) {
  try {
    const settings: Partial<FileUploadSettings> = await request.json();
    
    // Validate settings
    const validatedSettings = validateUploadSettings(settings);
    
    const db = getFirebaseAdminDB();
    await db.collection('admin_settings').doc('file_upload').set(validatedSettings, { merge: true });
    
    return NextResponse.json({
      success: true,
      message: 'Upload settings updated successfully',
      settings: validatedSettings
    });
  } catch (error: any) {
    console.error('Error updating upload settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update upload settings' },
      { status: 500 }
    );
  }
}

// Validation function
function validateUploadSettings(settings: Partial<FileUploadSettings>): FileUploadSettings {
  const validated = { ...defaultSettings, ...settings };
  
  // Validate max file sizes (minimum 1KB, maximum 100MB per type)
  const maxFileSize = 100 * 1024 * 1024; // 100MB
  const minFileSize = 1024; // 1KB
  
  Object.keys(validated).forEach(key => {
    if (key !== 'general' && validated[key as keyof FileUploadSettings]) {
      const typeSettings = validated[key as keyof Omit<FileUploadSettings, 'general'>];
      if (typeSettings && 'maxSize' in typeSettings) {
        if (typeSettings.maxSize > maxFileSize) {
          typeSettings.maxSize = maxFileSize;
        }
        if (typeSettings.maxSize < minFileSize) {
          typeSettings.maxSize = minFileSize;
        }
      }
    }
  });
  
  // Validate compression quality
  if (validated.general.compressionQuality > 1.0) {
    validated.general.compressionQuality = 1.0;
  }
  if (validated.general.compressionQuality < 0.1) {
    validated.general.compressionQuality = 0.1;
  }
  
  // Validate filename length
  if (validated.general.maxFileNameLength > 255) {
    validated.general.maxFileNameLength = 255;
  }
  if (validated.general.maxFileNameLength < 10) {
    validated.general.maxFileNameLength = 10;
  }
  
  return validated;
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}