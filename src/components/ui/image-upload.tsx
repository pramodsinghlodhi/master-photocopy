'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, FileText, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageService, UploadType, UploadProgress } from '@/lib/firebase-storage';
import Image from 'next/image';

interface ImageUploadProps {
  onUpload: (downloadURL: string) => void;
  onRemove?: (downloadURL: string) => void;
  currentImageURL?: string;
  uploadType: UploadType;
  userId?: string;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function ImageUpload({
  onUpload,
  onRemove,
  currentImageURL,
  uploadType,
  userId,
  maxWidth = 400,
  maxHeight = 300,
  className,
  placeholder = "Click to upload or drag and drop",
  accept = "image/*",
  multiple = false,
  disabled = false
}: ImageUploadProps) {
  const [progress, setProgress] = useState<UploadProgress>({ progress: 0, isUploading: false });
  const [dragOver, setDragOver] = useState(false);
  const [previewURL, setPreviewURL] = useState<string>(currentImageURL || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0]; // Take first file for single upload
    
    try {
      const downloadURL = await storageService.uploadFile(
        file,
        uploadType,
        userId,
        (progressData) => {
          setProgress(progressData);
          if (progressData.downloadURL) {
            setPreviewURL(progressData.downloadURL);
          }
        }
      );
      
      onUpload(downloadURL);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setProgress({ progress: 0, isUploading: false, error: error.message });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemove = async () => {
    if (previewURL && onRemove) {
      try {
        await storageService.deleteFile(previewURL);
        onRemove(previewURL);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    setPreviewURL('');
    setProgress({ progress: 0, isUploading: false });
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const getUploadIcon = () => {
    switch (uploadType) {
      case 'profiles': return <Camera className="w-8 h-8" />;
      case 'ads': return <ImageIcon className="w-8 h-8" />;
      case 'documents': return <FileText className="w-8 h-8" />;
      default: return <Upload className="w-8 h-8" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50",
          dragOver && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          previewURL && "border-solid border-border"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={previewURL ? undefined : openFileDialog}
      >
        <CardContent className="p-6">
          {previewURL ? (
            <div className="relative">
              <div className="relative" style={{ maxWidth, maxHeight }}>
                <Image
                  src={previewURL}
                  alt="Uploaded image"
                  width={maxWidth}
                  height={maxHeight}
                  className="rounded-lg object-cover w-full h-auto"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  disabled={progress.isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-muted-foreground">
                {getUploadIcon()}
              </div>
              <div>
                <p className="text-sm font-medium">{placeholder}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadType === 'profiles' && 'PNG, JPG, WEBP up to 2MB'}
                  {uploadType === 'ads' && 'PNG, JPG, WEBP, GIF up to 5MB'}
                  {uploadType === 'documents' && 'PNG, JPG, WEBP, PDF up to 10MB'}
                  {uploadType === 'orders' && 'Images, PDF, DOC up to 50MB'}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={disabled}>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {progress.isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>
      )}

      {/* Error Display */}
      {progress.error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <strong>Upload failed:</strong> {progress.error}
        </div>
      )}
    </div>
  );
}

// Specialized components for different use cases
export function ProfileImageUpload(props: Omit<ImageUploadProps, 'uploadType'>) {
  return (
    <ImageUpload
      {...props}
      uploadType="profiles"
      maxWidth={200}
      maxHeight={200}
      placeholder="Upload profile picture"
      className="max-w-xs"
    />
  );
}

export function AdBannerUpload(props: Omit<ImageUploadProps, 'uploadType'>) {
  return (
    <ImageUpload
      {...props}
      uploadType="ads"
      maxWidth={600}
      maxHeight={150}
      placeholder="Upload ad banner image"
      accept="image/*"
    />
  );
}

export function DocumentUpload(props: Omit<ImageUploadProps, 'uploadType'>) {
  return (
    <ImageUpload
      {...props}
      uploadType="documents"
      maxWidth={400}
      maxHeight={300}
      placeholder="Upload document or image"
      accept="image/*,application/pdf"
    />
  );
}