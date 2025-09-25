import { NextRequest, NextResponse } from 'next/server';
import { storageService, StorageConfig } from '@/lib/services/unified-storage-service';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// Storage Configuration API
export async function GET() {
  try {
    const db = getFirebaseAdminDB();
    const configDoc = await db.collection('admin_config').doc('storage_config').get();
    
    if (!configDoc.exists) {
      // Return default configuration
      const defaultConfig: StorageConfig = {
        provider: 'firebase',
      };

      await db.collection('admin_config').doc('storage_config').set(defaultConfig);
      
      return NextResponse.json(defaultConfig);
    }

    const config = configDoc.data() as StorageConfig;
    
    // Don't expose sensitive credentials in GET response
    if (config.aws) {
      const sanitizedConfig = {
        ...config,
        aws: {
          ...config.aws,
          accessKeyId: config.aws.accessKeyId ? '***hidden***' : '',
          secretAccessKey: config.aws.secretAccessKey ? '***hidden***' : '',
        }
      };
      return NextResponse.json(sanitizedConfig);
    }

    return NextResponse.json(config);

  } catch (error) {
    console.error('Error fetching storage config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: StorageConfig = await request.json();
    
    // Validate configuration
    if (config.provider === 'aws-s3') {
      if (!config.aws || !config.aws.region || !config.aws.bucketName || 
          !config.aws.accessKeyId || !config.aws.secretAccessKey) {
        return NextResponse.json(
          { error: 'AWS S3 configuration is incomplete' },
          { status: 400 }
        );
      }
    }

    // Update configuration using the service
    await storageService.updateConfiguration(config);

    return NextResponse.json({
      success: true,
      message: 'Storage configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating storage config:', error);
    return NextResponse.json(
      { error: 'Failed to update storage configuration' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();
    
    const db = getFirebaseAdminDB();
    const configDoc = await db.collection('admin_config').doc('storage_config').get();
    
    let currentConfig: StorageConfig = { provider: 'firebase' };
    if (configDoc.exists) {
      currentConfig = configDoc.data() as StorageConfig;
    }

    const updatedConfig = { ...currentConfig, ...updates };
    
    // Update configuration using the service
    await storageService.updateConfiguration(updatedConfig);

    return NextResponse.json({
      success: true,
      message: 'Storage configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating storage config:', error);
    return NextResponse.json(
      { error: 'Failed to update storage configuration' },
      { status: 500 }
    );
  }
}