'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, Trash2, List } from 'lucide-react';

const StorageTestPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');
  const [deletePath, setDeletePath] = useState('');
  const [listPrefix, setListPrefix] = useState('');
  const [files, setFiles] = useState<any[]>([]);

  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'test-uploads');
      formData.append('metadata', JSON.stringify({ 
        description: 'Test upload from admin panel',
        uploadedBy: 'admin' 
      }));

      const response = await fetch('/api/storage/files', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `File uploaded successfully to ${result.data.provider}`,
        });
        setFile(null);
        
        // Clear the file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to upload file",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadPath) {
      toast({
        title: "Error",
        description: "Please enter a file path",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/storage/files?path=${encodeURIComponent(downloadPath)}&action=url`);
      
      if (response.ok) {
        const result = await response.json();
        
        // Open the signed URL in a new tab
        window.open(result.data.url, '_blank');
        
        toast({
          title: "Success",
          description: `File URL generated from ${result.data.provider}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to get file URL",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error getting file URL:', error);
      toast({
        title: "Error",
        description: "Failed to get file URL",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!deletePath) {
      toast({
        title: "Error",
        description: "Please enter a file path",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/storage/files?path=${encodeURIComponent(deletePath)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `File deleted from ${result.data.provider}`,
        });
        setDeletePath('');
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete file",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const handleListFiles = async () => {
    try {
      const response = await fetch(`/api/storage/list?prefix=${encodeURIComponent(listPrefix || '')}&maxResults=20`);

      if (response.ok) {
        const result = await response.json();
        setFiles(result.data.files);
        toast({
          title: "Success",
          description: `Found ${result.data.files.length} files from ${result.data.provider}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to list files",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error listing files:', error);
      toast({
        title: "Error",
        description: "Failed to list files",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Storage Test Panel</h2>
        <p className="text-muted-foreground">Test file upload, download, and management</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <CardTitle>Upload File</CardTitle>
            </div>
            <CardDescription>Upload a test file to storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-input">Select File</Label>
              <Input
                id="file-input"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button 
              onClick={handleFileUpload} 
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
          </CardContent>
        </Card>

        {/* Download */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <CardTitle>Get File URL</CardTitle>
            </div>
            <CardDescription>Get a signed URL for a file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="download-path">File Path</Label>
              <Input
                id="download-path"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                placeholder="test-uploads/filename.jpg"
              />
            </div>
            <Button onClick={handleDownload} className="w-full">
              Get URL
            </Button>
          </CardContent>
        </Card>

        {/* Delete */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5" />
              <CardTitle>Delete File</CardTitle>
            </div>
            <CardDescription>Delete a file from storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="delete-path">File Path</Label>
              <Input
                id="delete-path"
                value={deletePath}
                onChange={(e) => setDeletePath(e.target.value)}
                placeholder="test-uploads/filename.jpg"
              />
            </div>
            <Button onClick={handleDelete} variant="destructive" className="w-full">
              Delete File
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <List className="w-5 h-5" />
              <CardTitle>List Files</CardTitle>
            </div>
            <CardDescription>List files with optional prefix filter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="list-prefix">Prefix (Optional)</Label>
              <Input
                id="list-prefix"
                value={listPrefix}
                onChange={(e) => setListPrefix(e.target.value)}
                placeholder="test-uploads/"
              />
            </div>
            <Button onClick={handleListFiles} className="w-full">
              List Files
            </Button>
          </CardContent>
        </Card>
      </div>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Files List</CardTitle>
            <CardDescription>{files.length} files found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Size: {(file.size / 1024).toFixed(2)} KB | 
                      Modified: {new Date(file.lastModified).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDownloadPath(file.name)}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StorageTestPanel;