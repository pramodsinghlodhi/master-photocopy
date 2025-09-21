// Check if Gemini API key is available
const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// Only export AI instance if API key is available
export const ai = hasGeminiKey ? (() => {
  try {
    const {genkit} = require('genkit');
    const {googleAI} = require('@genkit-ai/googleai');
    return genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.0-flash',
    });
  } catch (error) {
    console.warn('Failed to initialize Genkit AI:', error);
    return null;
  }
})() : null;

export const isAiEnabled = hasGeminiKey && ai !== null;
