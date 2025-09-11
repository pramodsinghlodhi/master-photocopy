'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

export function FileUploader({ onFilesAdded }: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesAdded(acceptedFiles);
    }
    setIsDragActive(false);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
        isDragActive
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50 hover:bg-secondary'
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="w-12 h-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">
        Drag & drop files here, or click to select
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">PDF files only</p>
    </div>
  );
}
