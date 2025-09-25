'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import Image from 'next/image';

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  fileUrl: string;
}

export default function FileViewer({ isOpen, onClose, filename, fileUrl }: FileViewerProps) {
  const [imageError, setImageError] = useState(false);
  
  const fileExtension = filename.split('.').pop()?.toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  const handleImageError = () => {
    const errorDetails = {
      filename,
      fileUrl,
      fileType: fileExtension,
      timestamp: new Date().toISOString(),
      error: 'Failed to load image'
    };
    
    console.error('FileViewer - Image loading error:', errorDetails);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {filename}
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[calc(80vh-200px)] overflow-auto">
          {isImage && !imageError ? (
            <div className="flex justify-center">
              <Image
                src={fileUrl}
                alt={filename}
                width={800}
                height={600}
                className="max-w-full h-auto"
                onError={handleImageError}
                onLoad={handleImageLoad}
                priority
              />
            </div>
          ) : imageError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Failed to load image</h3>
              <p className="text-gray-600 mb-4">
                The image could not be displayed. Please try downloading the file instead.
              </p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          ) : isPdf ? (
            <div className="w-full h-[600px]">
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title={filename}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">File Preview Not Available</h3>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed. Please download to view.
              </p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}