// AI Configuration for Master Photocopy
// This module handles Genkit AI initialization with proper error handling

// Check if Gemini API key is available
const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// Initialize AI instance with comprehensive error handling
let aiInstance: any = null;
let initializationError: Error | null = null;

// Only initialize Genkit on the server side
if (typeof window === 'undefined' && hasGeminiKey) {
  try {
    // Dynamic import to avoid bundling issues
    const genkitModule = require('genkit');
    const googleAIModule = require('@genkit-ai/googleai');
    
    if (genkitModule && googleAIModule) {
      aiInstance = genkitModule.genkit({
        plugins: [googleAIModule.googleAI()],
        model: 'googleai/gemini-2.0-flash',
      });
      console.log('✅ Genkit AI initialized successfully');
    }
  } catch (error: any) {
    console.warn('⚠️  Failed to initialize Genkit AI:', error.message);
    initializationError = error;
  }
} else if (typeof window !== 'undefined') {
  console.log('ℹ️  Genkit AI disabled on client side');
} else {
  console.log('ℹ️  Genkit AI disabled - no API key provided');
}

// Export AI instance (null if not available or failed to initialize)
export const ai = aiInstance;

// Export boolean flag for AI availability
export const isAiEnabled = hasGeminiKey && ai !== null && !initializationError;

// Export fallback function for when AI is not available
export const getFallbackAnalysis = () => ({
  documentType: 'Document',
  formattingScore: 75,
  improvementSuggestions: 'AI analysis not available. Please ensure document formatting is clean and professional.',
  upsellTriggers: [],
  estimatedPages: 10
});
