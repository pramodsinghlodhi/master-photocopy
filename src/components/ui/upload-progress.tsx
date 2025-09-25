'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  fileName: string;
  progress: number;
  isUploading: boolean;
  uploadSpeed?: number; // bytes per second
  timeRemaining?: number; // seconds
  size?: number; // file size in bytes
  error?: string;
  onCancel?: () => void;
  className?: string;
}

export function UploadProgress({
  fileName,
  progress,
  isUploading,
  uploadSpeed,
  timeRemaining,
  size,
  error,
  onCancel,
  className
}: UploadProgressProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* File info header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Upload className={cn(
                "h-4 w-4 flex-shrink-0",
                error ? "text-destructive" : isUploading ? "text-primary animate-pulse" : "text-green-500"
              )} />
              <span className="text-sm font-medium truncate" title={fileName}>
                {fileName}
              </span>
              {size && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  ({formatFileSize(size)})
                </span>
              )}
            </div>
            {onCancel && isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className={cn(
                "h-2",
                error && "bg-destructive/20"
              )}
            />
            
            {/* Progress details */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-medium",
                  error && "text-destructive"
                )}>
                  {error ? "Failed" : `${Math.round(progress)}%`}
                </span>
                
                {uploadSpeed && isUploading && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>{formatSpeed(uploadSpeed)}</span>
                  </div>
                )}
              </div>
              
              {timeRemaining && isUploading && !error && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status text */}
          <div className="text-xs">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : isUploading ? (
              <span className="text-muted-foreground">
                Uploading... {progress < 100 ? `${Math.round(progress)}%` : 'Processing'}
              </span>
            ) : progress >= 100 ? (
              <span className="text-green-600">Upload complete</span>
            ) : (
              <span className="text-muted-foreground">Ready to upload</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Multi-file upload progress component
interface MultiUploadProgressProps {
  uploads: Array<{
    id: string;
    fileName: string;
    progress: number;
    isUploading: boolean;
    uploadSpeed?: number;
    timeRemaining?: number;
    size?: number;
    error?: string;
  }>;
  onCancel?: (id: string) => void;
  onCancelAll?: () => void;
  className?: string;
}

export function MultiUploadProgress({
  uploads,
  onCancel,
  onCancelAll,
  className
}: MultiUploadProgressProps) {
  const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0) / uploads.length;
  const activeUploads = uploads.filter(upload => upload.isUploading);
  const completedUploads = uploads.filter(upload => upload.progress >= 100 && !upload.error);
  const failedUploads = uploads.filter(upload => upload.error);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Overall progress header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">
                Uploading {uploads.length} file{uploads.length === 1 ? '' : 's'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {completedUploads.length} completed, {activeUploads.length} in progress
                {failedUploads.length > 0 && `, ${failedUploads.length} failed`}
              </p>
            </div>
            {onCancelAll && activeUploads.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelAll}
              >
                Cancel All
              </Button>
            )}
          </div>

          {/* Overall progress bar */}
          <div className="space-y-2">
            <Progress value={totalProgress} className="h-2" />
            <div className="text-center text-xs text-muted-foreground">
              {Math.round(totalProgress)}% overall progress
            </div>
          </div>

          {/* Individual file progress */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploads.map((upload) => (
              <UploadProgress
                key={upload.id}
                fileName={upload.fileName}
                progress={upload.progress}
                isUploading={upload.isUploading}
                uploadSpeed={upload.uploadSpeed}
                timeRemaining={upload.timeRemaining}
                size={upload.size}
                error={upload.error}
                onCancel={onCancel ? () => onCancel(upload.id) : undefined}
                className="border-0 shadow-none bg-muted/50"
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}