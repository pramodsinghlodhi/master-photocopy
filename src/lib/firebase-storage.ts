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

export class FirebaseStorageService {
  private storage = storage;

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
    
    // Validate file type
    this.validateFile(file, type);
    
    // Generate unique filename
    const fileName = this.generateFileName(file, type, userId);
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
   * Validate file based on type
   */
  private validateFile(file: File, type: UploadType): void {
    const maxSizes = {
      ads: 5 * 1024 * 1024, // 5MB for ad images
      profiles: 2 * 1024 * 1024, // 2MB for profile images
      documents: 10 * 1024 * 1024, // 10MB for documents
      orders: 50 * 1024 * 1024, // 50MB for order files
    };

    const allowedTypes = {
      ads: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      profiles: ['image/jpeg', 'image/png', 'image/webp'],
      documents: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      orders: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    // Check file size
    if (file.size > maxSizes[type]) {
      throw new Error(`File size must be less than ${this.formatFileSize(maxSizes[type])}`);
    }

    // Check file type
    if (!allowedTypes[type].includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed for ${type}`);
    }
  }

  /**
   * Generate unique filename
   */
  private generateFileName(file: File, type: UploadType, userId?: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    
    const prefix = userId ? `${userId}_` : '';
    return `${prefix}${timestamp}_${randomId}.${extension}`;
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