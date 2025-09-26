'use server';
/**
 * @fileOverview An AI agent that provides upsell triggers based on document analysis.
 *
 * - getUpsellTriggers - A function that determines upsell opportunities based on document type and formatting.
 * - AiUpsellTriggersInput - The input type for the getUpsellTriggers function.
 * - AiUpsellTriggersOutput - The return type for the getUpsellTriggers function.
 */

import {ai, isAiEnabled} from '@/ai/genkit';
import {z} from 'genkit';

const AiUpsellTriggersInputSchema = z.object({
  documentType: z.string().describe('The type of the document (e.g., Resume, Thesis, Contract, Report).'),
  formattingScore: z.number().describe('A score (0-100) representing the quality of the document formatting.'),
});
export type AiUpsellTriggersInput = z.infer<typeof AiUpsellTriggersInputSchema>;

const AiUpsellTriggersOutputSchema = z.object({
  upsellOffers: z.array(
    z.object({
      offerType: z.string().describe('The type of upsell offer (e.g., discount on spiral binding).'),
      description: z.string().describe('A description of the upsell offer.'),
    })
  ).describe('A list of relevant upsell offers based on the document analysis.'),
});
export type AiUpsellTriggersOutput = z.infer<typeof AiUpsellTriggersOutputSchema>;

export async function getUpsellTriggers(input: AiUpsellTriggersInput): Promise<AiUpsellTriggersOutput> {
  // If AI is not enabled, return default upsell offers
  if (!isAiEnabled || !ai || !aiUpsellTriggersFlow) {
    return {
      upsellOffers: [
        {
          offerType: 'Premium Binding',
          description: 'Upgrade to spiral binding for better presentation and durability.'
        },
        {
          offerType: 'Color Printing',
          description: 'Add color printing to make your document stand out.'
        },
        {
          offerType: 'Express Delivery',
          description: 'Get your prints delivered within 2 hours for urgent needs.'
        }
      ]
    };
  }
  
  return aiUpsellTriggersFlow(input);
}

const prompt = ai?.definePrompt({
  name: 'aiUpsellTriggersPrompt',
  input: {schema: AiUpsellTriggersInputSchema},
  output: {schema: AiUpsellTriggersOutputSchema},
  prompt: `You are an AI assistant designed to identify relevant upsell opportunities based on the characteristics of uploaded documents.

  Analyze the document type and formatting score to determine the most appealing upsell offers.

  Document Type: {{{documentType}}}
  Formatting Score: {{{formattingScore}}}

  Based on this analysis, suggest relevant upsell offers.

  Respond in the following JSON format:
  {{json upsellOffers}}`,
});

const aiUpsellTriggersFlow = ai?.defineFlow(
  {
    name: 'aiUpsellTriggersFlow',
    inputSchema: AiUpsellTriggersInputSchema,
    outputSchema: AiUpsellTriggersOutputSchema,
  },
  async (input: any) => {
    const {output} = await prompt!(input);
    return output!;
  }
);
