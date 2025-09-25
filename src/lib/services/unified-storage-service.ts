import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getFirebaseAdminDB } from '../firebase-admin';

interface StorageConfig {
  provider: 'firebase' | 'aws-s3';
  aws?: {
    region: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
}

class UnifiedStorageService {
  private s3Client: S3Client | null = null;
  private currentConfig: StorageConfig | null = null;

  constructor() {
    this.loadConfiguration();
  }

  private async loadConfiguration(): Promise<StorageConfig> {
    try {
      const db = getFirebaseAdminDB();
      const configDoc = await db.collection('admin_config').doc('storage_config').get();
      
      if (configDoc.exists) {
        const config = configDoc.data() as StorageConfig;
        this.currentConfig = config;
        
        if (config.provider === 'aws-s3' && config.aws) {
          this.s3Client = new S3Client({
            region: config.aws.region,
            credentials: {
              accessKeyId: config.aws.accessKeyId,
              secretAccessKey: config.aws.secretAccessKey,
            },
            ...(config.aws.endpoint && { endpoint: config.aws.endpoint }),
          });
        }
        
        return config;
      }
      
      // Default configuration
      const defaultConfig: StorageConfig = {
        provider: 'firebase'
      };
      
      await db.collection('admin_config').doc('storage_config').set(defaultConfig);
      this.currentConfig = defaultConfig;
      
      return defaultConfig;
    } catch (error) {
      console.error('Error loading storage configuration:', error);
      return { provider: 'firebase' };
    }
  }

  async uploadFile(
    file: Buffer | Uint8Array | string,
    fileName: string,
    options?: {
      contentType?: string;
      folder?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<{ url: string; path: string; provider: string }> {
    const config = this.currentConfig || await this.loadConfiguration();
    const filePath = options?.folder ? `${options.folder}/${fileName}` : fileName;

    if (config.provider === 'aws-s3' && config.aws && this.s3Client) {
      return this.uploadToS3(file, filePath, options, config.aws);
    } else {
      return this.uploadToFirebase(file, filePath, options);
    }
  }

  private async uploadToS3(
    file: Buffer | Uint8Array | string,
    filePath: string,
    options?: {
      contentType?: string;
      folder?: string;
      metadata?: Record<string, string>;
    },
    awsConfig?: StorageConfig['aws']
  ): Promise<{ url: string; path: string; provider: string }> {
    if (!this.s3Client || !awsConfig) {
      throw new Error('AWS S3 not configured');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: awsConfig.bucketName,
        Key: filePath,
        Body: file,
        ContentType: options?.contentType || 'application/octet-stream',
        Metadata: options?.metadata,
      });

      await this.s3Client.send(command);
      
      const url = `https://${awsConfig.bucketName}.s3.${awsConfig.region}.amazonaws.com/${filePath}`;
      
      return {
        url,
        path: filePath,
        provider: 'aws-s3'
      };
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  private async uploadToFirebase(
    file: Buffer | Uint8Array | string,
    filePath: string,
    options?: {
      contentType?: string;
      folder?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<{ url: string; path: string; provider: string }> {
    try {
      // Simplified Firebase implementation - would need proper Firebase Admin SDK setup
      const uploadResult = {
        url: `https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/${encodeURIComponent(filePath)}?alt=media`,
        path: filePath,
        provider: 'firebase'
      };

      return uploadResult;
    } catch (error) {
      console.error('Error uploading to Firebase:', error);
      throw new Error('Failed to upload file to Firebase Storage');
    }
  }

  async getFile(filePath: string): Promise<{ buffer: Buffer; metadata?: any; provider: string }> {
    const config = this.currentConfig || await this.loadConfiguration();

    if (config.provider === 'aws-s3' && config.aws && this.s3Client) {
      return this.getFileFromS3(filePath, config.aws);
    } else {
      return this.getFileFromFirebase(filePath);
    }
  }

  private async getFileFromS3(
    filePath: string,
    awsConfig: StorageConfig['aws']
  ): Promise<{ buffer: Buffer; metadata?: any; provider: string }> {
    if (!this.s3Client || !awsConfig) {
      throw new Error('AWS S3 not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: awsConfig.bucketName,
        Key: filePath,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('File not found');
      }

      const buffer = await response.Body.transformToByteArray();
      
      return {
        buffer: Buffer.from(buffer),
        metadata: response.Metadata,
        provider: 'aws-s3'
      };
    } catch (error) {
      console.error('Error getting file from S3:', error);
      throw new Error('Failed to get file from S3');
    }
  }

  private async getFileFromFirebase(filePath: string): Promise<{ buffer: Buffer; metadata?: any; provider: string }> {
    try {
      // Simplified Firebase implementation
      throw new Error('Firebase Storage get file not implemented - use S3 instead');
    } catch (error) {
      console.error('Error getting file from Firebase:', error);
      throw new Error('Failed to get file from Firebase Storage');
    }
  }

  async deleteFile(filePath: string): Promise<{ success: boolean; provider: string }> {
    const config = this.currentConfig || await this.loadConfiguration();

    if (config.provider === 'aws-s3' && config.aws && this.s3Client) {
      return this.deleteFileFromS3(filePath, config.aws);
    } else {
      return this.deleteFileFromFirebase(filePath);
    }
  }

  private async deleteFileFromS3(
    filePath: string,
    awsConfig: StorageConfig['aws']
  ): Promise<{ success: boolean; provider: string }> {
    if (!this.s3Client || !awsConfig) {
      throw new Error('AWS S3 not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: awsConfig.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
      
      return {
        success: true,
        provider: 'aws-s3'
      };
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  private async deleteFileFromFirebase(filePath: string): Promise<{ success: boolean; provider: string }> {
    try {
      // Simplified Firebase implementation
      return {
        success: true,
        provider: 'firebase'
      };
    } catch (error) {
      console.error('Error deleting file from Firebase:', error);
      throw new Error('Failed to delete file from Firebase Storage');
    }
  }

  async listFiles(options?: {
    prefix?: string;
    maxResults?: number;
  }): Promise<{ files: Array<{ name: string; size: number; lastModified: Date }>; provider: string }> {
    const config = this.currentConfig || await this.loadConfiguration();

    if (config.provider === 'aws-s3' && config.aws && this.s3Client) {
      return this.listFilesFromS3(options, config.aws);
    } else {
      return this.listFilesFromFirebase(options);
    }
  }

  private async listFilesFromS3(
    options?: {
      prefix?: string;
      maxResults?: number;
    },
    awsConfig?: StorageConfig['aws']
  ): Promise<{ files: Array<{ name: string; size: number; lastModified: Date }>; provider: string }> {
    if (!this.s3Client || !awsConfig) {
      throw new Error('AWS S3 not configured');
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: awsConfig.bucketName,
        Prefix: options?.prefix,
        MaxKeys: options?.maxResults || 1000,
      });

      const response = await this.s3Client.send(command);
      
      const files = (response.Contents || []).map((obj: any) => ({
        name: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
      }));

      return {
        files,
        provider: 'aws-s3'
      };
    } catch (error) {
      console.error('Error listing files from S3:', error);
      throw new Error('Failed to list files from S3');
    }
  }

  private async listFilesFromFirebase(options?: {
    prefix?: string;
    maxResults?: number;
  }): Promise<{ files: Array<{ name: string; size: number; lastModified: Date }>; provider: string }> {
    try {
      // Simplified Firebase implementation
      return {
        files: [],
        provider: 'firebase'
      };
    } catch (error) {
      console.error('Error listing files from Firebase:', error);
      throw new Error('Failed to list files from Firebase Storage');
    }
  }

  async getSignedUrl(
    filePath: string,
    operation: 'read' | 'write' = 'read',
    expiresIn: number = 3600
  ): Promise<{ url: string; provider: string }> {
    const config = this.currentConfig || await this.loadConfiguration();

    if (config.provider === 'aws-s3' && config.aws && this.s3Client) {
      return this.getS3SignedUrl(filePath, operation, expiresIn, config.aws);
    } else {
      return this.getFirebaseSignedUrl(filePath, operation, expiresIn);
    }
  }

  private async getS3SignedUrl(
    filePath: string,
    operation: 'read' | 'write',
    expiresIn: number,
    awsConfig: StorageConfig['aws']
  ): Promise<{ url: string; provider: string }> {
    if (!this.s3Client || !awsConfig) {
      throw new Error('AWS S3 not configured');
    }

    try {
      const command = operation === 'read' 
        ? new GetObjectCommand({ Bucket: awsConfig.bucketName, Key: filePath })
        : new PutObjectCommand({ Bucket: awsConfig.bucketName, Key: filePath });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      return {
        url,
        provider: 'aws-s3'
      };
    } catch (error) {
      console.error('Error generating S3 signed URL:', error);
      throw new Error('Failed to generate S3 signed URL');
    }
  }

  private async getFirebaseSignedUrl(
    filePath: string,
    operation: 'read' | 'write',
    expiresIn: number
  ): Promise<{ url: string; provider: string }> {
    try {
      // Simplified Firebase implementation
      const url = `https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/${encodeURIComponent(filePath)}?alt=media`;
      
      return {
        url,
        provider: 'firebase'
      };
    } catch (error) {
      console.error('Error generating Firebase signed URL:', error);
      throw new Error('Failed to generate Firebase signed URL');
    }
  }

  async updateConfiguration(config: StorageConfig): Promise<void> {
    try {
      const db = getFirebaseAdminDB();
      await db.collection('admin_config').doc('storage_config').set(config);
      
      this.currentConfig = config;
      
      // Reinitialize S3 client if needed
      if (config.provider === 'aws-s3' && config.aws) {
        this.s3Client = new S3Client({
          region: config.aws.region,
          credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
          },
          ...(config.aws.endpoint && { endpoint: config.aws.endpoint }),
        });
      } else {
        this.s3Client = null;
      }
    } catch (error) {
      console.error('Error updating storage configuration:', error);
      throw new Error('Failed to update storage configuration');
    }
  }

  getCurrentProvider(): string {
    return this.currentConfig?.provider || 'firebase';
  }
}

export const storageService = new UnifiedStorageService();
export type { StorageConfig };