'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AdBannerUpload } from '@/components/ui/image-upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, BarChart3, Calendar, Target } from 'lucide-react';

interface AdBanner {
  id: string;
  title: string;
  imageURL: string;
  redirectURL: string;
  width: number;
  height: number;
  isActive: boolean;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  clickCount: number;
  impressionCount: number;
  targetAudience?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const AD_SIZES = [
  { label: 'Banner (728x90)', width: 728, height: 90 },
  { label: 'Leaderboard (970x90)', width: 970, height: 90 },
  { label: 'Medium Rectangle (300x250)', width: 300, height: 250 },
  { label: 'Large Rectangle (336x280)', width: 336, height: 280 },
  { label: 'Wide Skyscraper (160x600)', width: 160, height: 600 },
  { label: 'Square (300x300)', width: 300, height: 300 },
  { label: 'Mobile Banner (320x50)', width: 320, height: 50 },
  { label: 'Mobile Large (320x100)', width: 320, height: 100 }
];

const TARGET_AUDIENCES = [
  'All Users',
  'New Customers',
  'Returning Customers',
  'Premium Users',
  'Mobile Users',
  'Desktop Users',
  'Students',
  'Professionals'
];

export default function AdManagementPage() {
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdBanner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    imageURL: '',
    redirectURL: '',
    width: 728,
    height: 90,
    isActive: true,
    priority: 1,
    startDate: '',
    endDate: '',
    targetAudience: [] as string[]
  });

  // Fetch ads
  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ads');
      const result = await response.json();
      
      if (result.success) {
        setAds(result.data);
      } else {
        console.error('Failed to load ad banners');
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      console.error('Failed to load ad banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.imageURL || !formData.redirectURL) {
      console.error('Please fill in all required fields');
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    
    try {
      const url = editingAd ? '/api/ads' : '/api/ads';
      const method = editingAd ? 'PUT' : 'POST';
      const payload = editingAd 
        ? { id: editingAd.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        console.log(editingAd ? 'Ad updated successfully!' : 'Ad created successfully!');
        alert(editingAd ? 'Ad updated successfully!' : 'Ad created successfully!');
        setDialogOpen(false);
        resetForm();
        fetchAds();
      } else {
        console.error(result.error || 'Operation failed');
        alert(result.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      console.error('Failed to save ad banner');
      alert('Failed to save ad banner');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/ads?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        console.log('Ad deleted successfully!');
        alert('Ad deleted successfully!');
        fetchAds();
      } else {
        console.error(result.error || 'Failed to delete ad');
        alert(result.error || 'Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      console.error('Failed to delete ad banner');
      alert('Failed to delete ad banner');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      imageURL: '',
      redirectURL: '',
      width: 728,
      height: 90,
      isActive: true,
      priority: 1,
      startDate: '',
      endDate: '',
      targetAudience: []
    });
    setEditingAd(null);
  };

  // Handle edit
  const handleEdit = (ad: AdBanner) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      imageURL: ad.imageURL,
      redirectURL: ad.redirectURL,
      width: ad.width,
      height: ad.height,
      isActive: ad.isActive,
      priority: ad.priority,
      startDate: ad.startDate ? ad.startDate.toISOString().split('T')[0] : '',
      endDate: ad.endDate ? ad.endDate.toISOString().split('T')[0] : '',
      targetAudience: ad.targetAudience || []
    });
    setDialogOpen(true);
  };

  // Handle image upload success
  const handleImageUpload = (imageUrl: string) => {
    setFormData({ ...formData, imageURL: imageUrl });
  };

  // Handle size selection
  const handleSizeSelect = (size: typeof AD_SIZES[0]) => {
    setFormData({ 
      ...formData, 
      width: size.width, 
      height: size.height 
    });
  };

  // Calculate CTR
  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0.00%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ad Banner Management</h1>
          <p className="text-muted-foreground">Manage promotional banners and track performance</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ad Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAd ? 'Edit Ad Banner' : 'Create New Ad Banner'}
              </DialogTitle>
              <DialogDescription>
                {editingAd ? 'Update the ad banner details below.' : 'Fill in the details to create a new ad banner.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter ad title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="redirectURL">Redirect URL *</Label>
                  <Input
                    id="redirectURL"
                    value={formData.redirectURL}
                    onChange={(e) => setFormData({ ...formData, redirectURL: e.target.value })}
                    placeholder="https://example.com or /products"
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Ad Image *</Label>
                <AdBannerUpload
                  onUpload={handleImageUpload}
                  currentImageURL={formData.imageURL}
                />
                {formData.imageURL && (
                  <p className="text-sm text-muted-foreground">
                    Current image: {formData.imageURL.split('/').pop()}
                  </p>
                )}
              </div>

              {/* Dimensions */}
              <div className="space-y-4">
                <Label>Ad Dimensions</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select onValueChange={(value) => {
                    const size = AD_SIZES[parseInt(value)];
                    if (size) handleSizeSelect(size);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select standard size" />
                    </SelectTrigger>
                    <SelectContent>
                      {AD_SIZES.map((size, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground pt-2">
                    Or set custom dimensions below
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 0 })}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="100"
                  />
                  <p className="text-sm text-muted-foreground">Higher numbers show first</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <Label>Schedule (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label>Target Audience (Optional)</Label>
                <Select onValueChange={(value) => {
                  const audiences = [...formData.targetAudience];
                  if (!audiences.includes(value)) {
                    audiences.push(value);
                    setFormData({ ...formData, targetAudience: audiences });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_AUDIENCES.map((audience) => (
                      <SelectItem key={audience} value={audience}>
                        {audience}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.targetAudience.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.targetAudience.map((audience) => (
                      <Badge 
                        key={audience} 
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          const audiences = formData.targetAudience.filter(a => a !== audience);
                          setFormData({ ...formData, targetAudience: audiences });
                        }}
                      >
                        {audience} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingAd ? 'Update Ad' : 'Create Ad')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ads Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.length}</div>
            <p className="text-xs text-muted-foreground">
              {ads.filter(ad => ad.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ads.reduce((sum, ad) => sum + ad.clickCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ads.reduce((sum, ad) => sum + ad.impressionCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const totalClicks = ads.reduce((sum, ad) => sum + ad.clickCount, 0);
                const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressionCount, 0);
                return calculateCTR(totalClicks, totalImpressions);
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>All Ad Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ad banners created yet.</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                Create Your First Ad
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div key={ad.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{ad.title}</h3>
                        <Badge variant={ad.isActive ? "default" : "secondary"}>
                          {ad.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Priority: {ad.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ad.width} × {ad.height}px • Redirects to: {ad.redirectURL}
                      </p>
                      {ad.targetAudience && ad.targetAudience.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ad.targetAudience.map((audience) => (
                            <Badge key={audience} variant="outline" className="text-xs">
                              {audience}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(ad)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Ad Banner</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{ad.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(ad.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <img 
                      src={ad.imageURL} 
                      alt={ad.title}
                      className="w-32 h-20 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                    <div className="grid grid-cols-3 gap-6 flex-1">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{ad.clickCount}</div>
                        <div className="text-sm text-muted-foreground">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{ad.impressionCount}</div>
                        <div className="text-sm text-muted-foreground">Impressions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {calculateCTR(ad.clickCount, ad.impressionCount)}
                        </div>
                        <div className="text-sm text-muted-foreground">CTR</div>
                      </div>
                    </div>
                  </div>

                  {(ad.startDate || ad.endDate) && (
                    <div className="text-sm text-muted-foreground border-t pt-2">
                      Schedule: 
                      {ad.startDate && ` Starts ${new Date(ad.startDate).toLocaleDateString()}`}
                      {ad.endDate && ` • Ends ${new Date(ad.endDate).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
