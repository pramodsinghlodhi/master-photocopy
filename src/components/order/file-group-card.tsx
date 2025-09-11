

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FileGroup, PrintFile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Palette, Copy, Zap, Edit, Check, X, ChevronsUpDown, Folder, Package, IndianRupee } from 'lucide-react';
import { FileCard } from './file-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface FileGroupCardProps {
    group: FileGroup;
    onSettingsChange?: (groupId: string, newSettings: PrintFile['settings'], newPrice: number) => void;
    onFileSettingsChange: (fileId: string, newSettings: PrintFile['settings'], newPrice: number) => void;
    onNameChange?: (groupId: string, newName: string) => void;
    onDelete?: (groupId: string) => void;
    onRemoveFile: (fileId: string) => void;
    onMoveFileToGroup: (fileId: string, groupId: string | null) => void;
    onFileReorder: (groupId: string, reorderedFiles: PrintFile[]) => void;
    availableGroups: FileGroup[];
    isUngrouped?: boolean;
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

export function FileGroupCard({ 
    group, 
    onSettingsChange, 
    onFileSettingsChange,
    onNameChange, 
    onDelete, 
    onRemoveFile, 
    onMoveFileToGroup,
    onFileReorder,
    availableGroups,
    isUngrouped = false
}: FileGroupCardProps) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [groupName, setGroupName] = useState(group.name);
    const [settings, setSettings] = useState(group.settings);
    const [isOpen, setIsOpen] = useState(true);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const totalPagesInGroup = group.files.reduce((acc, file) => acc + (file.totalPages * file.settings.quantity), 0);
    const totalFilePrice = group.files.reduce((total, file) => total + file.price, 0);
    
    const calculateBindingCost = useCallback(() => {
        let cost = 0;
        if (settings.binding === 'plastic-spiral') cost = PRICING.binding_plastic;
        if (settings.binding === 'metal-spiral') cost = PRICING.binding_metal;
        if (settings.binding === 'staple') cost = PRICING.binding_staple;
        return cost;
    }, [settings.binding]);

    const bindingCost = calculateBindingCost();
    const groupTotalPrice = totalFilePrice + bindingCost;

    useEffect(() => {
        if (onSettingsChange) {
            const newPrice = groupTotalPrice;
            if (newPrice !== group.price || JSON.stringify(settings) !== JSON.stringify(group.settings)) {
                onSettingsChange(group.id, settings, newPrice);
            }
        }
    }, [settings, group.id, group.price, group.settings, onSettingsChange, groupTotalPrice]);

    const handleSettingChange = <T extends keyof PrintFile['settings']>(key: T, value: PrintFile['settings'][T]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleNameSave = () => {
        if (onNameChange) {
            onNameChange(group.id, groupName);
        }
        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        setGroupName(group.name);
        setIsEditingName(false);
    };

    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        const newFiles = [...group.files];
        const draggedItemContent = newFiles.splice(dragItem.current, 1)[0];
        newFiles.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        onFileReorder(group.id, newFiles);
    };
    
    const applySettingToAllFiles = <T extends keyof PrintFile['settings']>(key: T, value: PrintFile['settings'][T]) => {
        group.files.forEach(f => {
            const newSettings = { ...f.settings, [key]: value };
            
            let pageCost = 0;
            if (newSettings.colorMode === 'bw') {
                pageCost = newSettings.sides === 'single' ? PRICING.bw_single : PRICING.bw_double;
            } else {
                pageCost = newSettings.sides === 'single' ? PRICING.color_single : PRICING.color_double;
            }

            // Binding cost is handled at the group level, so we don't add it here
            const newPrice = (f.totalPages * pageCost * newSettings.quantity);
            onFileSettingsChange(f.id, newSettings, newPrice);
        });
    };


    return (
        <Card className={cn("overflow-hidden", isUngrouped ? "border-dashed" : "")}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CardHeader className="flex flex-row items-center justify-between bg-secondary p-3">
                    <div className="flex items-center gap-3">
                       {!isUngrouped && <Folder className="h-6 w-6 text-primary" />}
                        {isEditingName ? (
                            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="h-8" />
                        ) : (
                             <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{group.name}</h3>
                                {totalPagesInGroup > 0 && <Badge variant="secondary">{totalPagesInGroup} pages</Badge>}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {isEditingName ? (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNameSave}><Check className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNameCancel}><X className="h-4 w-4"/></Button>
                            </>
                        ) : (
                           !isUngrouped && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditingName(true)}><Edit className="h-4 w-4"/></Button>
                        )}
                        {!isUngrouped && onDelete && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(group.id)}><Trash2 className="h-4 w-4"/></Button>}
                        <CollapsibleTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronsUpDown className="h-4 w-4" />
                                <span className="sr-only">Toggle files</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="p-4 grid gap-6">
                        {!isUngrouped && (
                             <div className="p-4 border rounded-lg bg-secondary/50">
                                <p className="text-sm font-medium mb-4">Apply settings to all files in this group</p>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="grid gap-2">
                                        <Label className="flex items-center gap-2 text-xs"><Package className="h-4 w-4"/> Quantity</Label>
                                        <Input 
                                            className="h-9" 
                                            type="number" 
                                            defaultValue={1}
                                            min="1"
                                            onChange={(e) => applySettingToAllFiles('quantity', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="flex items-center gap-2 text-xs"><Palette className="h-4 w-4"/> Color Mode</Label>
                                        <RadioGroup defaultValue={settings.colorMode} onValueChange={(val: 'bw' | 'color') => applySettingToAllFiles('colorMode', val)} className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="bw" id={`g-bw-${group.id}`} />
                                                <Label htmlFor={`g-bw-${group.id}`} className="text-sm font-normal">B&W</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="color" id={`g-color-${group.id}`} />
                                                <Label htmlFor={`g-color-${group.id}`} className="text-sm font-normal">Color</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="flex items-center gap-2 text-xs"><Copy className="h-4 w-4"/> Sides</Label>
                                        <RadioGroup defaultValue={settings.sides} onValueChange={(val: 'single' | 'double') => applySettingToAllFiles('sides', val)} className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="single" id={`g-single-${group.id}`} />
                                                <Label htmlFor={`g-single-${group.id}`} className="text-sm font-normal">Single</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="double" id={`g-double-${group.id}`} />
                                                <Label htmlFor={`g-double-${group.id}`} className="text-sm font-normal">Double</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="flex items-center gap-2 text-xs"><Zap className="h-4 w-4"/> Binding</Label>
                                        <Select value={settings.binding} onValueChange={(val) => handleSettingChange('binding', val)}>
                                            <SelectTrigger className='h-9'>
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
                             </div>
                        )}
                        <div className="space-y-4">
                            {group.files.map((file, index) => (
                                <div
                                    key={file.id}
                                    draggable
                                    onDragStart={() => (dragItem.current = index)}
                                    onDragEnter={() => (dragOverItem.current = index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="cursor-move"
                                >
                                    <FileCard 
                                        fileData={file}
                                        onRemove={onRemoveFile} 
                                        onSettingsChange={onFileSettingsChange}
                                        onMoveToGroup={onMoveFileToGroup}
                                        availableGroups={availableGroups}
                                        isGrouped={!isUngrouped}
                                    />
                                </div>
                            ))}
                            {group.files.length === 0 && <p className='text-sm text-muted-foreground text-center py-4'>This group is empty.</p>}
                        </div>
                    </CardContent>
                     {!isUngrouped && (
                        <CardFooter className="p-3 bg-secondary flex justify-between items-center font-semibold">
                            <span>Group Total:</span>
                            <span className="flex items-center gap-1">
                                <IndianRupee className="h-4 w-4"/>
                                {group.price.toFixed(2)}
                            </span>
                        </CardFooter>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
