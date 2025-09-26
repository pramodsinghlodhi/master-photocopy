'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Sparkles, UserCircle, Upload, FileText, Image, ShoppingCart, Save, RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { SafeHydrate } from '@/components/shared/safe-hydrate';

interface FileUploadSettings {
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

export default function SettingsPage() {
  const { toast } = useToast();
  const [uploadSettings, setUploadSettings] = useState<FileUploadSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUploadSettings();
  }, []);

  const loadUploadSettings = async () => {
    try {
      const response = await fetch('/api/admin/upload-settings');
      if (response.ok) {
        const settings = await response.json();
        setUploadSettings(settings);
      } else {
        toast({
          title: "Error",
          description: "Failed to load upload settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading upload settings:', error);
      toast({
        title: "Error",
        description: "Failed to load upload settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveUploadSettings = async () => {
    if (!uploadSettings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/upload-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadSettings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Upload settings saved successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving upload settings:', error);
      toast({
        title: "Error",
        description: "Failed to save upload settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTypeSettings = (type: keyof Omit<FileUploadSettings, 'general'>, field: string, value: any) => {
    if (!uploadSettings) return;
    
    setUploadSettings({
      ...uploadSettings,
      [type]: {
        ...uploadSettings[type],
        [field]: value
      }
    });
  };

  const updateGeneralSettings = (field: string, value: any) => {
    if (!uploadSettings) return;
    
    setUploadSettings({
      ...uploadSettings,
      general: {
        ...uploadSettings.general,
        [field]: value
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const convertMBToBytes = (mb: number): number => mb * 1024 * 1024;
  const convertBytesToMB = (bytes: number): number => bytes / (1024 * 1024);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SafeHydrate>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your application settings and configurations</p>
          </div>
          <Button onClick={saveUploadSettings} disabled={saving || !uploadSettings}>
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="uploads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="uploads" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Uploads
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploads" className="space-y-6">
            {uploadSettings && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Image className="h-5 w-5 text-blue-600" />
                          <CardTitle>Ad Images</CardTitle>
                        </div>
                        <Switch
                          checked={uploadSettings.ads.enabled}
                          onCheckedChange={(checked) => updateTypeSettings('ads', 'enabled', checked)}
                        />
                      </div>
                      <CardDescription>Configuration for advertisement banner uploads</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Maximum File Size</Label>
                        <div className="flex items-center space-x-4 mt-2">
                          <Slider
                            value={[convertBytesToMB(uploadSettings.ads.maxSize)]}
                            onValueChange={([value]) => updateTypeSettings('ads', 'maxSize', convertMBToBytes(value))}
                            max={20}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="min-w-[80px]">
                            {formatFileSize(uploadSettings.ads.maxSize)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label>Allowed Types</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadSettings.ads.allowedTypes.map((type, index) => (
                            <Badge key={index} variant="secondary">
                              {type.split('/')[1]?.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserCircle className="h-5 w-5 text-green-600" />
                          <CardTitle>Profile Images</CardTitle>
                        </div>
                        <Switch
                          checked={uploadSettings.profiles.enabled}
                          onCheckedChange={(checked) => updateTypeSettings('profiles', 'enabled', checked)}
                        />
                      </div>
                      <CardDescription>Configuration for user and agent profile photos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Maximum File Size</Label>
                        <div className="flex items-center space-x-4 mt-2">
                          <Slider
                            value={[convertBytesToMB(uploadSettings.profiles.maxSize)]}
                            onValueChange={([value]) => updateTypeSettings('profiles', 'maxSize', convertMBToBytes(value))}
                            max={10}
                            min={1}
                            step={0.5}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="min-w-[80px]">
                            {formatFileSize(uploadSettings.profiles.maxSize)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label>Allowed Types</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadSettings.profiles.allowedTypes.map((type, index) => (
                            <Badge key={index} variant="secondary">
                              {type.split('/')[1]?.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <CardTitle>Documents</CardTitle>
                        </div>
                        <Switch
                          checked={uploadSettings.documents.enabled}
                          onCheckedChange={(checked) => updateTypeSettings('documents', 'enabled', checked)}
                        />
                      </div>
                      <CardDescription>Configuration for general document uploads</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Maximum File Size</Label>
                        <div className="flex items-center space-x-4 mt-2">
                          <Slider
                            value={[convertBytesToMB(uploadSettings.documents.maxSize)]}
                            onValueChange={([value]) => updateTypeSettings('documents', 'maxSize', convertMBToBytes(value))}
                            max={50}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="min-w-[80px]">
                            {formatFileSize(uploadSettings.documents.maxSize)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label>Allowed Types</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadSettings.documents.allowedTypes.map((type, index) => (
                            <Badge key={index} variant="secondary">
                              {type.split('/')[1]?.toUpperCase() || type.split('/')[0]?.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="h-5 w-5 text-purple-600" />
                          <CardTitle>Order Files</CardTitle>
                        </div>
                        <Switch
                          checked={uploadSettings.orders.enabled}
                          onCheckedChange={(checked) => updateTypeSettings('orders', 'enabled', checked)}
                        />
                      </div>
                      <CardDescription>Configuration for customer order file uploads</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Maximum File Size</Label>
                        <div className="flex items-center space-x-4 mt-2">
                          <Slider
                            value={[convertBytesToMB(uploadSettings.orders.maxSize)]}
                            onValueChange={([value]) => updateTypeSettings('orders', 'maxSize', convertMBToBytes(value))}
                            max={100}
                            min={1}
                            step={5}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="min-w-[80px]">
                            {formatFileSize(uploadSettings.orders.maxSize)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label>Allowed Types</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadSettings.orders.allowedTypes.map((type, index) => (
                            <Badge key={index} variant="secondary">
                              {type.split('/')[1]?.toUpperCase() || type.split('/')[0]?.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5" />
                      <span>General Upload Settings</span>
                    </CardTitle>
                    <CardDescription>Global settings that apply to all file uploads</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <Label>Image Compression Quality</Label>
                        <div className="flex items-center space-x-4 mt-2">
                          <Slider
                            value={[uploadSettings.general.compressionQuality * 100]}
                            onValueChange={([value]) => updateGeneralSettings('compressionQuality', value / 100)}
                            max={100}
                            min={10}
                            step={5}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="min-w-[60px]">
                            {Math.round(uploadSettings.general.compressionQuality * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Higher values = better quality, larger file sizes
                        </p>
                      </div>
                      
                      <div>
                        <Label>Maximum Filename Length</Label>
                        <Input
                          type="number"
                          min="10"
                          max="255"
                          value={uploadSettings.general.maxFileNameLength}
                          onChange={(e) => updateGeneralSettings('maxFileNameLength', parseInt(e.target.value) || 100)}
                          className="mt-2"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Characters (including extension)
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="compression"
                          checked={uploadSettings.general.enableCompression}
                          onCheckedChange={(checked) => updateGeneralSettings('enableCompression', checked)}
                        />
                        <Label htmlFor="compression">Enable Image Compression</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="virus-scan"
                          checked={uploadSettings.general.enableVirusScan}
                          onCheckedChange={(checked) => updateGeneralSettings('enableVirusScan', checked)}
                        />
                        <Label htmlFor="virus-scan">Enable Virus Scanning</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCircle className="h-6 w-6" />
                  <span>General Settings</span>
                </CardTitle>
                <CardDescription>Basic application configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input id="app-name" placeholder="Master PhotoCopy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-url">Application URL</Label>
                  <Input id="app-url" placeholder="https://masterphotocopy.com" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SafeHydrate>
  );
}
