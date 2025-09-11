import { config } from 'dotenv';
config();

import '@/ai/flows/document-analysis.ts';
import '@/ai/flows/ai-upsell-triggers.ts';
import '@/ai/flows/formatting-suggestions.ts';
import '@/ai/flows/shipment-creation.ts';
