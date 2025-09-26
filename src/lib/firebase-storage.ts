// src/lib/firebase-storage.ts
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error?: string;
  downloadURL?: string;
}

export type UploadType = 'ads' | 'profiles' | 'documents' | 'orders';

export interface FileUploadSettings {
  ads: {
    maxSize: number;
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
    compressionQuality: number;
    enableCompression: boolean;
    enableVirusScan: boolean;
    maxFileNameLength: number;
  };
}

export class FirebaseStorageService {
  private storage = storage;
  private uploadSettings: FileUploadSettings | null = null;
  private settingsLastFetched: number = 0;
  private readonly SETTINGS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current upload settings from admin configuration
   */
  private async getUploadSettings(): Promise<FileUploadSettings> {
    const now = Date.now();
    
    // Use cached settings if they're still fresh
    if (this.uploadSettings && (now - this.settingsLastFetched) < this.SETTINGS_CACHE_DURATION) {
      return this.uploadSettings;
    }

    try {
      const response = await fetch('/api/admin/upload-settings');
      if (response.ok) {
        this.uploadSettings = await response.json();
        this.settingsLastFetched = now;
        return this.uploadSettings!;
      }
    } catch (error) {
      console.warn('Failed to fetch upload settings, using defaults:', error);
    }

    // Fallback to default settings
    return this.getDefaultSettings();
  }

  /**
   * Get default upload settings
   */
  private getDefaultSettings(): FileUploadSettings {
    return {
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
  }

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(
    file: File, 
    type: UploadType, 
    userId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    if (!file) throw new Error('No file provided');
    
    // Get current upload settings
    const settings = await this.getUploadSettings();
    
    // Validate file type and size with dynamic settings
    await this.validateFile(file, type, settings);
    
    // Generate unique filename
    const fileName = this.generateFileName(file, type, userId, settings.general.maxFileNameLength);
    const filePath = `${type}/${fileName}`;
    
    try {
      onProgress?.({ progress: 0, isUploading: true });
      
      // Create storage reference
      const storageRef = ref(this.storage!, filePath);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      onProgress?.({ progress: 50, isUploading: true });
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onProgress?.({ progress: 100, isUploading: false, downloadURL });
      
      return downloadURL;
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Upload failed';
      onProgress?.({ progress: 0, isUploading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  /**
   * Get upload limits for a specific type
   */
  async getUploadLimits(type: UploadType) {
    const settings = await this.getUploadSettings();
    return {
      maxSize: settings[type].maxSize,
      allowedTypes: settings[type].allowedTypes,
      enabled: settings[type].enabled,
      maxSizeFormatted: this.formatFileSize(settings[type].maxSize)
    };
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(downloadURL: string): Promise<void> {
    try {
      const fileRef = ref(this.storage!, downloadURL);
      await deleteObject(fileRef);
    } catch (error: any) {
      console.error('Error deleting file:', error);
      // Don't throw error for delete failures - file might already be deleted
    }
  }

  /**
   * Validate file based on type and dynamic settings
   */
  private async validateFile(file: File, type: UploadType, settings: FileUploadSettings): Promise<void> {
    const typeSettings = settings[type];
    
    // Check if upload is enabled for this type
    if (!typeSettings.enabled) {
      throw new Error(`${type} uploads are currently disabled`);
    }

    // Check file size
    if (file.size > typeSettings.maxSize) {
      throw new Error(`File size must be less than ${this.formatFileSize(typeSettings.maxSize)}`);
    }

    // Check file type
    if (!typeSettings.allowedTypes.includes(file.type)) {
      const allowedTypesReadable = typeSettings.allowedTypes
        .map(type => type.split('/')[1]?.toUpperCase())
        .filter(Boolean)
        .join(', ');
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypesReadable}`);
    }

    // Check filename length
    if (file.name.length > settings.general.maxFileNameLength) {
      throw new Error(`Filename must be less than ${settings.general.maxFileNameLength} characters`);
    }
  }

  /**
   * Generate unique filename with length validation
   */
  private generateFileName(file: File, type: UploadType, userId?: string, maxLength?: number): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop() || '';
    
    const prefix = userId ? `${userId}_` : '';
    let filename = `${prefix}${timestamp}_${randomId}.${extension}`;
    
    // Truncate if too long
    const maxLen = maxLength || 100;
    if (filename.length > maxLen) {
      const availableLength = maxLen - extension.length - 1; // -1 for the dot
      const baseFilename = filename.substring(0, availableLength);
      filename = `${baseFilename}.${extension}`;
    }
    
    return filename;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get optimized image URL for different sizes
   */
  getOptimizedImageURL(originalURL: string, width?: number, height?: number): string {
    if (!originalURL) return '';
    
    // For Firebase Storage URLs, we can add transform parameters
    // This is a basic implementation - in production, you might want to use a service like Cloudinary
    try {
      const url = new URL(originalURL);
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      return url.toString();
    } catch {
      return originalURL;
    }
  }
}

// Export singleton instance
export const storageService = new FirebaseStorageService();