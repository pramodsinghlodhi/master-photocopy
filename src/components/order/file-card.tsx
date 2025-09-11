

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { PrintFile, FileGroup } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Trash2, Palette, Copy, Zap, AlertCircle, GripVertical, MoveVertical, Loader, Package, Minus, Plus, IndianRupee } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';

interface FileCardProps {
  fileData: PrintFile;
  onRemove: (id: string) => void;
  onSettingsChange: (id: string, newSettings: PrintFile['settings'], newPrice: number) => void;
  onMoveToGroup: (fileId: string, groupId: string | null) => void;
  availableGroups: FileGroup[];
  isGrouped: boolean;
}

const PRICING = {
  bw_single: 2,
  bw_double: 3,
  color_single: 10,
  color_double: 15,
  binding_plastic: 50,
  binding_metal: 70,
  binding_staple: 20,
};

export function FileCard({ fileData, onRemove, onSettingsChange, onMoveToGroup, availableGroups, isGrouped }: FileCardProps) {
  const [settings, setSettings] = useState(fileData.settings);
  const [totalPages, setTotalPages] = useState(fileData.totalPages);

  useEffect(() => {
     if(fileData.totalPages > 0 && totalPages !== fileData.totalPages) {
         setTotalPages(fileData.totalPages);
     }
  }, [fileData.totalPages, totalPages]);
  
    const calculatePrice = useCallback(() => {
      let pageCost = 0;
      if (settings.colorMode === 'bw') {
        pageCost = settings.sides === 'single' ? PRICING.bw_single : PRICING.bw_double;
      } else {
        pageCost = settings.sides === 'single' ? PRICING.color_single : PRICING.color_double;
      }

      let bindingCost = 0;
      if (!isGrouped) { // Only add binding cost for ungrouped files
        if (settings.binding === 'plastic-spiral') bindingCost = PRICING.binding_plastic;
        if (settings.binding === 'metal-spiral') bindingCost = PRICING.binding_metal;
        if (settings.binding === 'staple') bindingCost = PRICING.binding_staple;
      }
      
      const price = (totalPages * pageCost * settings.quantity) + bindingCost;
      return price;
    }, [settings, totalPages, isGrouped]);


  useEffect(() => {
    const newPrice = calculatePrice();
    if (newPrice !== fileData.price || JSON.stringify(settings) !== JSON.stringify(fileData.settings)) {
      onSettingsChange(fileData.id, settings, newPrice);
    }
  }, [settings, totalPages, fileData.id, onSettingsChange, fileData.price, fileData.settings, calculatePrice]);

  const handleSettingChange = <T extends keyof PrintFile['settings']>(key: T, value: PrintFile['settings'][T]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <Card className="overflow-hidden bg-background">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-2 pl-4">
        <div className="flex items-center gap-3">
            <MoveVertical className="h-5 w-5 text-muted-foreground cursor-grab"/>
          <FileText className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium truncate">{fileData.file.name}</p>
          {fileData.status === 'analyzing' && <Badge variant="secondary"><Loader className="mr-1 h-3 w-3 animate-spin"/>Analyzing...</Badge>}
        </div>
        <div className="flex items-center gap-1">
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <GripVertical className="h-4 w-4"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1">
                    <div className="flex flex-col">
                        <p className="p-2 text-xs font-semibold text-muted-foreground">Move to</p>
                        {isGrouped && (
                           <Button variant="ghost" className="w-full justify-start h-8 px-2" onClick={() => onMoveToGroup(fileData.id, null)}>
                            Ungrouped
                           </Button>
                        )}
                        {availableGroups.filter(g => g.id !== fileData.groupId).map(group => (
                            <Button key={group.id} variant="ghost" className="w-full justify-start h-8 px-2" onClick={() => onMoveToGroup(fileData.id, group.id)}>
                                {group.name}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(fileData.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 grid gap-4">
         {fileData.status === 'error' && (
          <div className="text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p>{fileData.error}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-1.5">
                <Label className="text-xs">Total Pages</Label>
                <div className="flex items-center h-8 px-3 py-2 text-sm">
                  {totalPages > 0 ? totalPages : 'N/A'}
                </div>
            </div>
             <div className="grid gap-1.5">
                <Label htmlFor={`quantity-${fileData.id}`} className="text-xs">Quantity</Label>
                 <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSettingChange('quantity', Math.max(1, settings.quantity - 1))}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                        id={`quantity-${fileData.id}`}
                        className="h-8 w-14 text-center"
                        type="number"
                        value={settings.quantity}
                        onChange={(e) => handleSettingChange('quantity', Number(e.target.value) >= 1 ? Number(e.target.value) : 1)}
                        min="1"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSettingChange('quantity', settings.quantity + 1)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs"><Palette className="h-3 w-3"/> Color Mode</Label>
             <Select value={settings.colorMode} onValueChange={(val: 'bw' | 'color') => handleSettingChange('colorMode', val)}>
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select color mode" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="bw">B&W</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs"><Copy className="h-3 w-3"/> Sides</Label>
             <Select value={settings.sides} onValueChange={(val: 'single' | 'double') => handleSettingChange('sides', val)}>
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select sides" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5 text-xs"><Zap className="h-3 w-3"/> Binding</Label>
            <Select 
              value={settings.binding} 
              onValueChange={(val: 'none' | 'plastic-spiral' | 'metal-spiral' | 'staple') => handleSettingChange('binding', val)}
              disabled={isGrouped}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select binding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="plastic-spiral">Plastic Spiral</SelectItem>
                <SelectItem value="metal-spiral">Metal Spiral</SelectItem>
                <SelectItem value="staple">Staple</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-2 px-4 flex justify-end">
          <div className="font-semibold flex items-center gap-1 text-sm">
              <span>Price:</span>
              <IndianRupee className="h-4 w-4"/>
              {fileData.price.toFixed(2)}
          </div>
      </CardFooter>
    </Card>
  );
}
