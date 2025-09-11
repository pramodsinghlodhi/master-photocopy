// src/components/order/ai-analysis.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Lightbulb, Sparkles, FileText, ShoppingCart } from 'lucide-react';
import type { PrintFile } from '@/lib/types';
import { Progress } from '../ui/progress';

interface AiAnalysisProps {
    files: PrintFile[];
}

export function AiAnalysis({ files }: AiAnalysisProps) {
    const analyzedFiles = files.filter(file => file.analysis && file.suggestions && file.upsells);
    const hasReadyFiles = files.some(f => f.status === 'ready');
    
    // Only render the card if at least one file has finished analysis.
    if (!hasReadyFiles) return null;

    return (
        <Card className="bg-gradient-to-br from-secondary to-background border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    AI-Powered Document Review
                </CardTitle>
                <CardDescription>
                    Our AI has analyzed your documents to ensure the best printing results.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {analyzedFiles.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {analyzedFiles.map(file => (
                            <AccordionItem key={file.id} value={file.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5" />
                                        <span className="font-medium">{file.file.name}</span>
                                        <Badge variant="secondary">{file.analysis!.documentType}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-6 pt-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Formatting Score</h4>
                                            <div className="flex items-center gap-2">
                                                <Progress value={file.analysis!.formattingScore} className="w-full h-3" />
                                                <span className="font-bold text-lg">{file.analysis!.formattingScore}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                A score of 80+ is recommended for optimal printing.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                Improvement Suggestions
                                            </h4>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                {file.suggestions!.suggestions.map((suggestion, index) => (
                                                    <li key={index}>{suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <ShoppingCart className="h-4 w-4 text-green-500" />
                                            Recommended for You
                                        </h4>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {file.upsells!.upsellOffers.map((offer, index) => (
                                                <div key={index} className="p-3 border rounded-lg bg-background flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold">{offer.offerType}</p>
                                                        <p className="text-xs text-muted-foreground">{offer.description}</p>
                                                    </div>
                                                    <Button size="sm" variant="outline">Add</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        <p>AI analysis is in progress for your documents...</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
