'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FileUploader } from '@/components/order/file-uploader';
import { PriceSummary } from '@/components/order/price-summary';
import type { PrintFile, FileGroup } from '@/lib/types';
import { FileGroupCard } from '@/components/order/file-group-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';
import { analyzeDocument } from '@/ai/flows/document-analysis';
import { getFormattingSuggestions } from '@/ai/flows/formatting-suggestions';
import { getUpsellTriggers } from '@/ai/flows/ai-upsell-triggers';
import { AiAnalysis } from '@/components/order/ai-analysis';

function fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


export default function OrderPage() {
  const [files, setFiles] = useState<PrintFile[]>([]);
  const [groups, setGroups] = useState<FileGroup[]>([]);
  const { toast } = useToast();
  const dragGroup = useRef<number | null>(null);
  const dragOverGroup = useRef<number | null>(null);

  const [isAiAnalysisVisible, setIsAiAnalysisVisible] = useState(true);

  useEffect(() => {
    // In a real app, this would be fetched from a settings service.
    // We use localStorage to persist the admin's choice for this demo.
    const setting = localStorage.getItem('aiAnalysisEnabled');
    // Default to true if the setting is not found
    setIsAiAnalysisVisible(setting !== null ? setting === 'true' : true);
  }, []);

  const handleFilesAdded = async (addedFiles: File[]) => {
    const newFiles: File[] = [];
    const allCurrentFiles = [...files, ...groups.flatMap(g => g.files)];

    for (const file of addedFiles) {
        const isDuplicate = allCurrentFiles.some(
            (existingFile) => existingFile.file.name === file.name && existingFile.file.size === file.size
        );

        if (isDuplicate) {
            toast({
                title: 'File Already Exists',
                description: `"${file.name}" has already been uploaded.`,
                variant: 'destructive',
            });
        } else {
            newFiles.push(file);
        }
    }
    
    if(newFiles.length === 0) return;

    const newPrintFilesPromises = newFiles.map(async (file) => {
      try {
        const fileBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const totalPages = pdfDoc.getPageCount();

        return {
          id: `${file.name}-${Date.now()}`,
          file,
          totalPages, 
          settings: {
            sides: 'single',
            colorMode: 'bw',
            binding: 'none',
            quantity: 1,
          },
          status: 'queued',
          price: 0,
        } as PrintFile;
      } catch (error) {
        console.error("Failed to parse PDF:", error);
        return {
          id: `${file.name}-${Date.now()}`,
          file,
          totalPages: 0,
          settings: {
            sides: 'single',
            colorMode: 'bw',
            binding: 'none',
            quantity: 1,
          },
          status: 'error',
          error: 'Could not read page count from PDF. Please enter it manually.',
          price: 0,
        } as PrintFile;
      }
    });

    const newPrintFiles = await Promise.all(newPrintFilesPromises);
    setFiles((prevFiles) => [...prevFiles, ...newPrintFiles]);
  };

  useEffect(() => {
    const processFiles = async () => {
        for(const file of files) {
            if (file.status === 'queued') {

                // 1. Update status to analyzing
                setFiles(prev => prev.map(f => f.id === file.id ? {...f, status: 'analyzing'} : f));
                
                try {
                    // Check if AI is available before attempting analysis
                    const hasAiKey = !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
                    
                    if (!hasAiKey) {
                        // Skip AI analysis if no API key is configured
                        console.log('AI analysis skipped - no API key configured');
                        setFiles(prev => prev.map(f => f.id === file.id ? {
                            ...f, 
                            status: 'ready',
                            analysis: {
                                documentType: 'Document',
                                formattingScore: 75,
                                improvementSuggestions: 'Document appears ready for printing. AI analysis not available.'
                            },
                            suggestions: {
                                suggestions: ['Ensure document formatting is clean and professional']
                            },
                            upsells: {
                                upsellOffers: []
                            }
                        } : f));
                        continue;
                    }

                    // 2. Convert file to data URI
                    const documentDataUri = await fileToDataUri(file.file);
                    
                    // 3. Call AI analysis flow
                    const analysis = await analyzeDocument({ documentDataUri });

                    // 4. Call formatting suggestions flow
                    // pdf-lib does not support text extraction. Passing empty string for now.
                    const documentText = '';
                    const suggestions = await getFormattingSuggestions({
                        documentType: analysis.documentType,
                        formattingScore: analysis.formattingScore,
                        documentText: documentText,
                    });
                    
                    // 5. Call upsell triggers flow
                    const upsells = await getUpsellTriggers({
                        documentType: analysis.documentType,
                        formattingScore: analysis.formattingScore
                    });

                    // 6. Update file with results
                    setFiles(prev => prev.map(f => f.id === file.id ? {
                        ...f, 
                        status: 'ready', 
                        analysis, 
                        suggestions,
                        upsells
                    } : f));

                } catch(error) {
                    console.warn("AI Analysis not available for", file.file.name, error);
                    
                    // Check if error is due to missing API key (configuration issue)
                    const isConfigError = error instanceof Error && 
                        (error.message.includes('GEMINI_API_KEY') || 
                         error.message.includes('GOOGLE_API_KEY') ||
                         error.message.includes('API key'));
                    
                    if (isConfigError) {
                        // AI not configured - proceed with default analysis
                        setFiles(prev => prev.map(f => f.id === file.id ? {
                            ...f, 
                            status: 'ready',
                            analysis: {
                                documentType: 'Document',
                                formattingScore: 75,
                                improvementSuggestions: 'AI analysis not available. Document appears to be ready for printing.'
                            },
                            suggestions: {
                                suggestions: ['Ensure document formatting is clean and professional']
                            },
                            upsells: {
                                upsellOffers: []
                            }
                        } : f));
                    } else {
                        // Actual error occurred
                        setFiles(prev => prev.map(f => f.id === file.id ? {
                            ...f, 
                            status: 'error', 
                            error: 'AI analysis failed.'
                        } : f));
                    }
                }
            }
        }
    };
    processFiles();
  }, [files]);
  
  const handleCreateGroup = () => {
    const newGroup: FileGroup = {
      id: `group-${Date.now()}`,
      name: `Print Group ${groups.length + 1}`,
      files: [],
      settings: {
        sides: 'single',
        colorMode: 'bw',
        binding: 'none',
        quantity: 1,
      },
      price: 0,
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const handleGroupSettingsChange = (groupId: string, newSettings: PrintFile['settings'], newPrice: number) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, settings: newSettings, price: newPrice } 
          : group
      )
    );
  };
  
  const handleDeleteGroup = (groupId: string) => {
    const groupToDelete = groups.find(g => g.id === groupId);
    if (!groupToDelete) return;

    // Return files from the deleted group back to the ungrouped files list
    setFiles(prev => [...prev, ...groupToDelete.files.map(f => ({...f, groupId: undefined}))]);
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };
  
  const handleUpdateGroupName = (groupId: string, newName: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? {...g, name: newName} : g));
  }

  const handleFileSettingsChange = (id: string, newSettings: PrintFile['settings'], newPrice: number) => {
    const updateInFiles = (fileList: PrintFile[]) => fileList.map(f => f.id === id ? { ...f, settings: newSettings, price: newPrice } : f);
    
    setFiles(updateInFiles);
    setGroups(prevGroups => prevGroups.map(g => ({
      ...g,
      files: updateInFiles(g.files)
    })));
  };

  const removeFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    setGroups(prevGroups => prevGroups.map(g => ({
        ...g,
        files: g.files.filter(f => f.id !== id)
    })));
  };
  
  const moveFileToGroup = (fileId: string, groupId: string | null) => {
    const fileToMove = files.find(f => f.id === fileId) || groups.flatMap(g => g.files).find(f => f.id === fileId);
    if (!fileToMove) return;

    // Remove from all current locations
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setGroups(prev => prev.map(g => ({...g, files: g.files.filter(f => f.id !== fileId)})));

    if (groupId) {
        // Add to new group
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, files: [...g.files, {...fileToMove, groupId, settings: {...fileToMove.settings, binding: 'none'}}]} : g));
    } else {
        // Add to ungrouped files
        setFiles(prev => [...prev, {...fileToMove, groupId: undefined}]);
    }
  };
  
  const handleFileReorder = (groupId: string, reorderedFiles: PrintFile[]) => {
    if (groupId === 'ungrouped') {
        const ungroupedIds = new Set(reorderedFiles.map(f => f.id));
        const otherFiles = files.filter(f => !ungroupedIds.has(f.id));
        setFiles([...reorderedFiles, ...otherFiles]);
    } else {
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, files: reorderedFiles} : g));
    }
  };

  const handleGroupReorderEnd = () => {
    if (dragGroup.current === null || dragOverGroup.current === null) return;
    
    const newGroups = [...groups];
    const draggedGroupContent = newGroups.splice(dragGroup.current, 1)[0];
    newGroups.splice(dragOverGroup.current, 0, draggedGroupContent);
    
    dragGroup.current = null;
    dragOverGroup.current = null;
    setGroups(newGroups);
  };

  const ungroupedFiles = files.filter(f => !f.groupId);

  const totalCost = useMemo(() => {
    const ungroupedCost = ungroupedFiles.reduce((total, file) => total + file.price, 0);
    const groupedCost = groups.reduce((total, group) => total + group.price, 0);
    return ungroupedCost + groupedCost;
  }, [ungroupedFiles, groups]);

  const allFilesForAnalysis = [...files, ...groups.flatMap(g => g.files)];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Upload Documents
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload your documents for printing and copying services
                </p>
              </div>
              
              <FileUploader onFilesAdded={handleFilesAdded} />
              
              {(files.length > 0 || groups.length > 0) && (
                <>
                  <div className="flex justify-end">
                      <Button onClick={handleCreateGroup}>
                          <PlusCircle className="mr-2 h-4 w-4"/>
                          Create Group
                      </Button>
                  </div>
                   {isAiAnalysisVisible && <AiAnalysis files={allFilesForAnalysis}/>}
                </>
              )}

               {groups.length > 0 && (
                  <div className="flex flex-col gap-4">
                      <h2 className="text-xl font-semibold">Your Groups</h2>
                      {groups.map((group, index) => (
                          <div
                              key={group.id}
                              draggable
                              onDragStart={() => (dragGroup.current = index)}
                              onDragEnter={() => (dragOverGroup.current = index)}
                              onDragEnd={handleGroupReorderEnd}
                              onDragOver={(e) => e.preventDefault()}
                              className="cursor-move"
                          >
                              <FileGroupCard 
                                  group={group} 
                                  onSettingsChange={handleGroupSettingsChange}
                                  onFileSettingsChange={handleFileSettingsChange}
                                  onNameChange={handleUpdateGroupName}
                                  onDelete={handleDeleteGroup}
                                  onRemoveFile={removeFile}
                                  onMoveFileToGroup={moveFileToGroup}
                                  onFileReorder={handleFileReorder}
                                  availableGroups={groups}
                              />
                          </div>
                      ))}
                  </div>
               )}
              {ungroupedFiles.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-semibold">Ungrouped Documents</h2>
                   <FileGroupCard 
                      group={{
                          id: 'ungrouped',
                          name: 'Ungrouped Files',
                          files: ungroupedFiles,
                          settings: { sides: 'single', colorMode: 'bw', binding: 'none', quantity: 1 },
                          price: 0
                      }}
                      isUngrouped
                      onFileSettingsChange={handleFileSettingsChange}
                      onRemoveFile={removeFile}
                      onMoveFileToGroup={moveFileToGroup}
                      onFileReorder={handleFileReorder}
                      availableGroups={groups}
                  />
                </div>
              )}
        </div>
        <div>
          <PriceSummary totalCost={totalCost} files={ungroupedFiles} groups={groups} />
        </div>
      </div>
    </div>
  );
}
