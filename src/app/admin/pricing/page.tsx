// src/app/admin/pricing/page.tsx
'use client';

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IndianRupee, PlusCircle, Trash2, Edit, Save, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PricingSettings {
  // Per-page pricing
  bwSingle: number;
  bwDouble: number;
  colorSingle: number;
  colorDouble: number;
  
  // Binding options
  plasticSpiral: number;
  metalSpiral: number;
  staple: number;
  
  // Additional charges
  urgentFee: number;
  deliveryFee: number; // Default fee
  codMin: number;
  codFee: number;
  giftCouponMin: number;
  giftCouponMax: number;
  shopAddress: string;
}

interface DeliveryTier {
  id: string;
  distance: number; // in km
  price: number;
}

interface PrintPreset {
  id: string;
  name: string;
  colorMode: 'bw' | 'color';
  sides: 'single' | 'double';
  binding: 'none' | 'plastic-spiral' | 'metal-spiral' | 'staple';
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

const defaultSettings: PricingSettings = {
  bwSingle: 2,
  bwDouble: 3,
  colorSingle: 10,
  colorDouble: 15,
  plasticSpiral: 50,
  metalSpiral: 70,
  staple: 20,
  urgentFee: 25,
  deliveryFee: 50,
  codMin: 100,
  codFee: 10,
  giftCouponMin: 10,
  giftCouponMax: 500,
  shopAddress: '' // New field for shop address
};

export default function PricingPage() {
  const [settings, setSettings] = useState<PricingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Delivery tiers state
  const [deliveryTiers, setDeliveryTiers] = useState<DeliveryTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [tierForm, setTierForm] = useState({ distance: '', price: '' });

  // Preset management states
  const [presets, setPresets] = useState<PrintPreset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PrintPreset | null>(null);
  const [presetForm, setPresetForm] = useState<Partial<PrintPreset>>({
    name: '',
    colorMode: 'bw',
    sides: 'single',
    binding: 'none',
    description: ''
  });

  // Load pricing settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'settings', 'pricing');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as PricingSettings;
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (error) {
        console.error('Error loading pricing settings:', error);
        toast({
          title: "Error",
          description: "Failed to load pricing settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Load presets and delivery tiers on component mount
  useEffect(() => {
    loadPresets();
    loadDeliveryTiers();
  }, []);

  // Load delivery tiers from Firebase
  const loadDeliveryTiers = async () => {
    if (!db) {
      setTiersLoading(false);
      return;
    }
    setTiersLoading(true);
    try {
      const tiersCollection = collection(db, 'deliveryTiers');
      const tiersSnapshot = await getDocs(tiersCollection);
      const tiersData = tiersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as DeliveryTier))
        .sort((a, b) => a.distance - b.distance);
      setDeliveryTiers(tiersData);
    } catch (error) {
      console.error('Error loading delivery tiers:', error);
      toast({ title: "Error", description: "Failed to load delivery tiers", variant: "destructive" });
    } finally {
      setTiersLoading(false);
    }
  };

  // Add a new delivery tier
  const addDeliveryTier = async () => {
    const distance = parseFloat(tierForm.distance);
    const price = parseFloat(tierForm.price);

    if (!db || isNaN(distance) || isNaN(price) || distance <= 0 || price < 0) {
      toast({ title: "Error", description: "Please enter valid distance and price", variant: "destructive" });
      return;
    }

    try {
      await addDoc(collection(db, 'deliveryTiers'), { distance, price });
      toast({ title: "Success", description: "Delivery tier added" });
      setTierForm({ distance: '', price: '' });
      loadDeliveryTiers(); // Refresh list
    } catch (error) {
      console.error('Error adding delivery tier:', error);
      toast({ title: "Error", description: "Failed to add delivery tier", variant: "destructive" });
    }
  };

  // Delete a delivery tier
  const deleteDeliveryTier = async (tierId: string) => {
    if (!db) return;

    try {
      await deleteDoc(doc(db, 'deliveryTiers', tierId));
      toast({ title: "Success", description: "Delivery tier deleted" });
      loadDeliveryTiers(); // Refresh list
    } catch (error) {
      console.error('Error deleting delivery tier:', error);
      toast({ title: "Error", description: "Failed to delete delivery tier", variant: "destructive" });
    }
  };

  // Load presets from Firebase
  const loadPresets = async () => {
    if (!db) {
      setPresetsLoading(false);
      return;
    }

    try {
      const presetsCollection = collection(db, 'printPresets');
      const presetsSnapshot = await getDocs(presetsCollection);
      const presetsData = presetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrintPreset[];
      
      setPresets(presetsData);
    } catch (error) {
      console.error('Error loading presets:', error);
      toast({
        title: "Error",
        description: "Failed to load print presets",
        variant: "destructive",
      });
    } finally {
      setPresetsLoading(false);
    }
  };

  // Create or update preset
  const savePreset = async () => {
    if (!db || !presetForm.name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    try {
      const presetData = {
        name: presetForm.name.trim(),
        colorMode: presetForm.colorMode || 'bw',
        sides: presetForm.sides || 'single',
        binding: presetForm.binding || 'none',
        description: presetForm.description?.trim() || '',
        updatedAt: new Date()
      };

      if (editingPreset) {
        // Update existing preset
        await updateDoc(doc(db, 'printPresets', editingPreset.id), presetData);
        toast({
          title: "Success",
          description: "Preset updated successfully",
        });
      } else {
        // Create new preset
        await addDoc(collection(db, 'printPresets'), {
          ...presetData,
          createdAt: new Date()
        });
        toast({
          title: "Success",
          description: "Preset created successfully",
        });
      }

      // Reset form and close dialog
      resetPresetForm();
      setPresetDialogOpen(false);
      
      // Reload presets
      loadPresets();
    } catch (error) {
      console.error('Error saving preset:', error);
      toast({
        title: "Error",
        description: "Failed to save preset",
        variant: "destructive",
      });
    }
  };

  // Delete preset
  const deletePreset = async (presetId: string) => {
    if (!db) return;

    try {
      await deleteDoc(doc(db, 'printPresets', presetId));
      toast({
        title: "Success",
        description: "Preset deleted successfully",
      });
      
      // Reload presets
      loadPresets();
    } catch (error) {
      console.error('Error deleting preset:', error);
      toast({
        title: "Error",
        description: "Failed to delete preset",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const editPreset = (preset: PrintPreset) => {
    setEditingPreset(preset);
    setPresetForm({
      name: preset.name,
      colorMode: preset.colorMode,
      sides: preset.sides,
      binding: preset.binding,
      description: preset.description || ''
    });
    setPresetDialogOpen(true);
  };

  // Reset form
  const resetPresetForm = () => {
    setEditingPreset(null);
    setPresetForm({
      name: '',
      colorMode: 'bw',
      sides: 'single',
      binding: 'none',
      description: ''
    });
  };

  // Format preset settings for display
  const formatPresetSettings = (preset: PrintPreset) => {
    const colorText = preset.colorMode === 'bw' ? 'B&W' : 'Color';
    const sidesText = preset.sides === 'single' ? 'Single-Sided' : 'Double-Sided';
    const bindingText = preset.binding === 'none' ? 'No Binding' : 
                       preset.binding === 'plastic-spiral' ? 'Plastic Spiral' :
                       preset.binding === 'metal-spiral' ? 'Metal Spiral' : 'Staple';
    
    return `${colorText}, ${sidesText}, ${bindingText}`;
  };

  // Update a specific setting
  const updateSetting = (key: keyof PricingSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save settings to Firebase
  const saveSettings = async () => {
    if (!db) {
      toast({
        title: "Error",
        description: "Database not available",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'pricing');
      await setDoc(docRef, settings, { merge: true });
      
      toast({
        title: "Success",
        description: "Pricing settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving pricing settings:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading pricing settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pricing & Options</h1>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Column 1: Core Pricing */}
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Per-Page Pricing</CardTitle>
                    <CardDescription>Set the base cost for printing individual pages.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4 p-4 border rounded-lg">
                            <h4 className="font-semibold">Black & White</h4>
                             <div className="space-y-2">
                                <Label htmlFor="bw-single">Single-Sided Price</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      id="bw-single" 
                                      type="number" 
                                      value={settings.bwSingle} 
                                      onChange={(e) => updateSetting('bwSingle', Number(e.target.value))}
                                      className="pl-8" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bw-double">Double-Sided Price</Label>
                                <div className="relative">
                                     <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      id="bw-double" 
                                      type="number" 
                                      value={settings.bwDouble} 
                                      onChange={(e) => updateSetting('bwDouble', Number(e.target.value))}
                                      className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                         <div className="flex flex-col gap-4 p-4 border rounded-lg">
                            <h4 className="font-semibold">Color</h4>
                             <div className="space-y-2">
                                <Label htmlFor="color-single">Single-Sided Price</Label>
                                <div className="relative">
                                     <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      id="color-single" 
                                      type="number" 
                                      value={settings.colorSingle} 
                                      onChange={(e) => updateSetting('colorSingle', Number(e.target.value))}
                                      className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color-double">Double-Sided Price</Label>
                                 <div className="relative">
                                     <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      id="color-double" 
                                      type="number" 
                                      value={settings.colorDouble} 
                                      onChange={(e) => updateSetting('colorDouble', Number(e.target.value))}
                                      className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Binding Options</CardTitle>
                    <CardDescription>Set the prices for different binding types.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="binding-plastic">Plastic Spiral</Label>
                         <div className="relative">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="binding-plastic" 
                              type="number" 
                              value={settings.plasticSpiral} 
                              onChange={(e) => updateSetting('plasticSpiral', Number(e.target.value))}
                              className="pl-8"
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="binding-metal">Metal Spiral</Label>
                         <div className="relative">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="binding-metal" 
                              type="number" 
                              value={settings.metalSpiral} 
                              onChange={(e) => updateSetting('metalSpiral', Number(e.target.value))}
                              className="pl-8"
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="binding-staple">Staple (per set)</Label>
                         <div className="relative">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="binding-staple" 
                              type="number" 
                              value={settings.staple} 
                              onChange={(e) => updateSetting('staple', Number(e.target.value))}
                              className="pl-8"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Additional Charges</CardTitle>
                    <CardDescription>Set prices for additional services and fees.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="urgent-fee">Urgent Delivery Fee</Label>
                         <div className="relative">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="urgent-fee" 
                              type="number" 
                              value={settings.urgentFee} 
                              onChange={(e) => updateSetting('urgentFee', Number(e.target.value))}
                              className="pl-8"
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
    <Label htmlFor="delivery-fee">Own Delivery Fee</Label>
    <div className="relative">
        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
            id="delivery-fee"
            type="number"
            value={settings.deliveryFee}
            onChange={(e) => updateSetting('deliveryFee', Number(e.target.value))}
            className="pl-8"
        />
    </div>
    <p className="text-xs text-muted-foreground">Default delivery fee. Will be overridden by dynamic pricing if applicable.</p>
</div>
                     <div className="space-y-2">
                        <Label htmlFor="cod-min">Cash on Delivery Min. ₹</Label>
                         <div className="relative">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="cod-min" 
                              type="number" 
                              value={settings.codMin} 
                              onChange={(e) => updateSetting('codMin', Number(e.target.value))}
                              className="pl-8"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Minimum order value required for Cash on Delivery.</p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="cod-fee">COD Processing Fee</Label>
                         <div className="relative">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="cod-fee" 
                              type="number" 
                              value={settings.codFee} 
                              onChange={(e) => updateSetting('codFee', Number(e.target.value))}
                              className="pl-8"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Additional fee for Cash on Delivery orders.</p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gift-coupon-min">Gift Coupon Min. Amount ₹</Label>
                         <div className="relative">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="gift-coupon-min" 
                              type="number" 
                              value={settings.giftCouponMin} 
                              onChange={(e) => updateSetting('giftCouponMin', Number(e.target.value))}
                              className="pl-8"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Minimum amount for gift coupon conversion.</p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gift-coupon-max">Gift Coupon Max. Amount ₹</Label>
                         <div className="relative">
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="gift-coupon-max" 
                              type="number" 
                              value={settings.giftCouponMax} 
                              onChange={(e) => updateSetting('giftCouponMax', Number(e.target.value))}
                              className="pl-8"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Maximum amount for gift coupon conversion.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Shop Location</CardTitle>
                    <CardDescription>Set your business address for distance calculations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label htmlFor="shop-address">Shop Address</Label>
                    <Textarea
                        id="shop-address"
                        placeholder="Enter your full shop address"
                        value={settings.shopAddress}
                        onChange={(e) => updateSetting('shopAddress', e.target.value)}
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-2">This address will be used as the starting point for calculating delivery distances.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dynamic Delivery Pricing</CardTitle>
                    <CardDescription>Set delivery fees based on distance for your own delivery service.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="tier-distance">Max Distance (km)</Label>
                            <Input 
                                id="tier-distance" 
                                type="number" 
                                placeholder="e.g., 10"
                                value={tierForm.distance}
                                onChange={(e) => setTierForm({...tierForm, distance: e.target.value})}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="tier-price">Price</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="tier-price" 
                                    type="number" 
                                    placeholder="e.g., 25"
                                    value={tierForm.price}
                                    onChange={(e) => setTierForm({...tierForm, price: e.target.value})}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="self-end">
                            <Button onClick={addDeliveryTier}><PlusCircle className="mr-2 h-4 w-4"/> Add Tier</Button>
                        </div>
                    </div>
                    <Separator />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Max Distance (km)</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tiersLoading ? (
                                <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                            ) : deliveryTiers.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center">No delivery tiers set.</TableCell></TableRow>
                            ) : (
                                deliveryTiers.map(tier => (
                                    <TableRow key={tier.id}>
                                        <TableCell>{tier.distance} km</TableCell>
                                        <TableCell>₹{tier.price}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => deleteDeliveryTier(tier.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>

        {/* Column 2: Presets */}
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Print Presets</CardTitle>
                    <CardDescription>Create and manage reusable print setting templates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {presetsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            <span>Loading presets...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : presets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                        No presets configured yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                presets.map((preset: PrintPreset) => (
                                    <TableRow key={preset.id}>
                                        <TableCell>
                                            <div className="font-medium">{preset.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatPresetSettings(preset)}
                                            </div>
                                            {preset.description && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {preset.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-1 justify-end">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => editPreset(preset)}
                                                >
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => deletePreset(preset.id)}
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                            resetPresetForm();
                            setPresetDialogOpen(true);
                        }}
                    >
                        <PlusCircle className="mr-2 h-4 w-4"/> Add New Preset
                    </Button>
                </CardContent>
            </Card>

            {/* Current Settings Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Settings Preview</CardTitle>
                    <CardDescription>Current pricing configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span>COD Minimum:</span>
                        <span className="font-medium">₹{settings.codMin}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span>COD Fee:</span>
                        <span className="font-medium">₹{settings.codFee}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                        <span>B&W Single:</span>
                        <span className="font-medium">₹{settings.bwSingle}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span>Color Single:</span>
                        <span className="font-medium">₹{settings.colorSingle}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                        <span>Urgent Fee:</span>
                        <span className="font-medium">₹{settings.urgentFee}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                        <span>Gift Coupon Min:</span>
                        <span className="font-medium">₹{settings.giftCouponMin}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span>Gift Coupon Max:</span>
                        <span className="font-medium">₹{settings.giftCouponMax}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Preset Dialog */}
        <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingPreset ? 'Edit Preset' : 'Add New Preset'}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="preset-name">Preset Name</Label>
                        <Input
                            id="preset-name"
                            value={presetForm.name}
                            onChange={(e) => setPresetForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter preset name..."
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="color-mode">Color Mode</Label>
                        <Select 
                            value={presetForm.colorMode} 
                            onValueChange={(value: 'bw' | 'color') => 
                                setPresetForm(prev => ({ ...prev, colorMode: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select color mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bw">Black & White</SelectItem>
                                <SelectItem value="color">Color</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sides">Sides</Label>
                        <Select 
                            value={presetForm.sides} 
                            onValueChange={(value: 'single' | 'double') => 
                                setPresetForm(prev => ({ ...prev, sides: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select sides" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Single-Sided</SelectItem>
                                <SelectItem value="double">Double-Sided</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="binding">Binding</Label>
                        <Select 
                            value={presetForm.binding} 
                            onValueChange={(value: 'none' | 'staple' | 'plastic-spiral' | 'metal-spiral') => 
                                setPresetForm(prev => ({ ...prev, binding: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select binding" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Binding</SelectItem>
                                <SelectItem value="staple">Staple</SelectItem>
                                <SelectItem value="plastic-spiral">Plastic Spiral</SelectItem>
                                <SelectItem value="metal-spiral">Metal Spiral</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={presetForm.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPresetForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter preset description..."
                            rows={3}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setPresetDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={savePreset}>
                        {editingPreset ? 'Update' : 'Create'} Preset
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
