'use client';

import { useState, useCallback } from 'react';

export interface UploadState {
  id: string;
  fileName: string;
  progress: number;
  isUploading: boolean;
  uploadSpeed?: number;
  timeRemaining?: number;
  size: number;
  error?: string;
  startTime?: number;
  uploadedBytes?: number;
}

export interface UseFileUploadOptions {
  onUploadComplete?: (id: string, response: any) => void;
  onUploadError?: (id: string, error: string) => void;
  onAllUploadsComplete?: () => void;
  chunkSize?: number;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploads, setUploads] = useState<Map<string, UploadState>>(new Map());
  const [abortControllers, setAbortControllers] = useState<Map<string, AbortController>>(new Map());

  const updateUpload = useCallback((id: string, updates: Partial<UploadState>) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(id);
      if (existing) {
        newMap.set(id, { ...existing, ...updates });
      }
      return newMap;
    });
  }, []);

  const calculateSpeed = useCallback((startTime: number, uploadedBytes: number): number => {
    const elapsedTime = (Date.now() - startTime) / 1000; // seconds
    return elapsedTime > 0 ? uploadedBytes / elapsedTime : 0;
  }, []);

  const calculateTimeRemaining = useCallback((speed: number, remainingBytes: number): number => {
    return speed > 0 ? remainingBytes / speed : 0;
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    url: string,
    formDataBuilder?: (file: File) => FormData
  ): Promise<any> => {
    const id = `${file.name}-${Date.now()}-${Math.random()}`;
    const abortController = new AbortController();
    
    // Add to abort controllers
    setAbortControllers(prev => new Map(prev).set(id, abortController));
    
    // Initialize upload state
    const uploadState: UploadState = {
      id,
      fileName: file.name,
      progress: 0,
      isUploading: true,
      size: file.size,
      startTime: Date.now(),
      uploadedBytes: 0,
    };
    
    setUploads(prev => new Map(prev).set(id, uploadState));

    try {
      // Build form data
      let formData: FormData;
      if (formDataBuilder) {
        formData = formDataBuilder(file);
      } else {
        formData = new FormData();
        formData.append('file', file);
      }

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Handle abort
        abortController.signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            const currentTime = Date.now();
            const startTime = uploadState.startTime || currentTime;
            
            // Calculate upload speed and time remaining
            const uploadSpeed = calculateSpeed(startTime, event.loaded);
            const remainingBytes = event.total - event.loaded;
            const timeRemaining = calculateTimeRemaining(uploadSpeed, remainingBytes);
            
            updateUpload(id, {
              progress,
              uploadSpeed,
              timeRemaining: timeRemaining > 0 ? timeRemaining : undefined,
              uploadedBytes: event.loaded,
            });
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            updateUpload(id, {
              progress: 100,
              isUploading: false,
              uploadSpeed: undefined,
              timeRemaining: undefined,
            });
            
            try {
              const response = JSON.parse(xhr.responseText);
              options.onUploadComplete?.(id, response);
              resolve(response);
            } catch (parseError) {
              const error = 'Invalid response format';
              updateUpload(id, { error, isUploading: false });
              options.onUploadError?.(id, error);
              reject(new Error(error));
            }
          } else {
            let errorMessage = `Upload failed (${xhr.status})`;
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage = errorResponse.error || errorMessage;
            } catch {
              // Use default error message
            }
            
            updateUpload(id, { error: errorMessage, isUploading: false });
            options.onUploadError?.(id, errorMessage);
            reject(new Error(errorMessage));
          }
        });

        // Handle network errors
        xhr.addEventListener('error', () => {
          const error = 'Network error occurred';
          updateUpload(id, { error, isUploading: false });
          options.onUploadError?.(id, error);
          reject(new Error(error));
        });

        // Handle timeout
        xhr.addEventListener('timeout', () => {
          const error = 'Upload timeout';
          updateUpload(id, { error, isUploading: false });
          options.onUploadError?.(id, error);
          reject(new Error(error));
        });

        // Start the upload
        xhr.open('POST', url);
        xhr.timeout = 5 * 60 * 1000; // 5 minutes timeout
        xhr.send(formData);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateUpload(id, { error: errorMessage, isUploading: false });
      options.onUploadError?.(id, errorMessage);
      throw error;
    } finally {
      // Clean up abort controller
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
  }, [updateUpload, calculateSpeed, calculateTimeRemaining, options]);

  const uploadFiles = useCallback(async (
    files: File[],
    url: string,
    formDataBuilder?: (files: File[]) => FormData
  ): Promise<any[]> => {
    if (formDataBuilder) {
      // Upload all files as one request
      const formData = formDataBuilder(files);
      const id = `batch-${Date.now()}-${Math.random()}`;
      const abortController = new AbortController();
      
      setAbortControllers(prev => new Map(prev).set(id, abortController));
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const fileName = files.length === 1 ? files[0].name : `${files.length} files`;
      
      const uploadState: UploadState = {
        id,
        fileName,
        progress: 0,
        isUploading: true,
        size: totalSize,
        startTime: Date.now(),
        uploadedBytes: 0,
      };
      
      setUploads(prev => new Map(prev).set(id, uploadState));

      try {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          abortController.signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Upload cancelled'));
          });

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              const currentTime = Date.now();
              const startTime = uploadState.startTime || currentTime;
              
              const uploadSpeed = calculateSpeed(startTime, event.loaded);
              const remainingBytes = event.total - event.loaded;
              const timeRemaining = calculateTimeRemaining(uploadSpeed, remainingBytes);
              
              updateUpload(id, {
                progress,
                uploadSpeed,
                timeRemaining: timeRemaining > 0 ? timeRemaining : undefined,
                uploadedBytes: event.loaded,
              });
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              updateUpload(id, {
                progress: 100,
                isUploading: false,
                uploadSpeed: undefined,
                timeRemaining: undefined,
              });
              
              try {
                const response = JSON.parse(xhr.responseText);
                options.onUploadComplete?.(id, response);
                resolve([response]);
              } catch (parseError) {
                const error = 'Invalid response format';
                updateUpload(id, { error, isUploading: false });
                options.onUploadError?.(id, error);
                reject(new Error(error));
              }
            } else {
              let errorMessage = `Upload failed (${xhr.status})`;
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMessage = errorResponse.error || errorMessage;
              } catch {
                // Use default error message
              }
              
              updateUpload(id, { error: errorMessage, isUploading: false });
              options.onUploadError?.(id, errorMessage);
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener('error', () => {
            const error = 'Network error occurred';
            updateUpload(id, { error, isUploading: false });
            options.onUploadError?.(id, error);
            reject(new Error(error));
          });

          xhr.open('POST', url);
          xhr.timeout = 10 * 60 * 1000; // 10 minutes for batch upload
          xhr.send(formData);
        });
      } finally {
        setAbortControllers(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }
    } else {
      // Upload files individually
      const results = await Promise.allSettled(
        files.map(file => uploadFile(file, url))
      );
      
      options.onAllUploadsComplete?.();
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          throw new Error(`Upload failed for ${files[index].name}: ${result.reason.message}`);
        }
      });
    }
  }, [uploadFile, updateUpload, calculateSpeed, calculateTimeRemaining, options]);

  const cancelUpload = useCallback((id: string) => {
    const controller = abortControllers.get(id);
    if (controller) {
      controller.abort();
    }
    
    updateUpload(id, {
      error: 'Upload cancelled',
      isUploading: false,
      uploadSpeed: undefined,
      timeRemaining: undefined,
    });
  }, [abortControllers, updateUpload]);

  const cancelAllUploads = useCallback(() => {
    abortControllers.forEach((controller, id) => {
      controller.abort();
      updateUpload(id, {
        error: 'Upload cancelled',
        isUploading: false,
        uploadSpeed: undefined,
        timeRemaining: undefined,
      });
    });
    setAbortControllers(new Map());
  }, [abortControllers, updateUpload]);

  const clearCompleted = useCallback(() => {
    setUploads(prev => {
      const newMap = new Map();
      prev.forEach((upload, id) => {
        if (upload.isUploading || upload.error) {
          newMap.set(id, upload);
        }
      });
      return newMap;
    });
  }, []);

  const clearAll = useCallback(() => {
    cancelAllUploads();
    setUploads(new Map());
  }, [cancelAllUploads]);

  return {
    uploads: Array.from(uploads.values()),
    uploadFile,
    uploadFiles,
    cancelUpload,
    cancelAllUploads,
    clearCompleted,
    clearAll,
    isUploading: Array.from(uploads.values()).some(upload => upload.isUploading),
    hasErrors: Array.from(uploads.values()).some(upload => upload.error),
    completedCount: Array.from(uploads.values()).filter(upload => upload.progress >= 100 && !upload.error).length,
    totalCount: uploads.size,
  };
}