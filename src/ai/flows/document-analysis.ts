// src/ai/flows/document-analysis.ts
'use server';
/**
 * @fileOverview A document analysis AI agent.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai, isAiEnabled, getFallbackAnalysis} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnalyzeDocumentOutputSchema = z.object({
  documentType: z.string().describe('The type of the document (e.g., resume, thesis, contract, report).'),
  formattingScore: z.number().describe('A score (0-100) representing the quality of the document formatting.'),
  improvementSuggestions: z.string().describe('Suggestions for improving the document formatting.'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  // If AI is not enabled, return fallback analysis
  if (!isAiEnabled || !ai || !analyzeDocumentFlow) {
    return getFallbackAnalysis();
  }
  
  try {
    return await analyzeDocumentFlow(input);
  } catch (error) {
    console.warn('AI document analysis failed, using fallback:', error);
    return getFallbackAnalysis();
  }
}

const prompt = ai?.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an AI document analysis expert. Analyze the document provided to determine its type and formatting quality.

Analyze the following document:
{{media url=documentDataUri}}

Provide the document type, a formatting score (0-100), and suggestions for improvement.`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const analyzeDocumentFlow = ai?.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async (input: AnalyzeDocumentInput) => {
    if (!prompt) {
      throw new Error('AI prompt not available');
    }
    const {output} = await prompt(input);
    return output!;
  }
);
