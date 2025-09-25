/**
 * Utility functions for handling HTTP responses safely
 */

export interface ErrorResponse {
  error: string;
  details?: string;
  status?: number;
}

/**
 * Safely parse JSON from a response, handling cases where response might be HTML or invalid JSON
 */
export const safeJsonParse = async (response: Response): Promise<any> => {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // If not JSON, get text content for debugging
      const textContent = await response.text();
      console.warn('Non-JSON response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        preview: textContent.substring(0, 200)
      });
      
      // Return a structured error object
      return {
        error: `HTTP ${response.status} - ${response.statusText}`,
        details: 'Server returned non-JSON response',
        status: response.status
      };
    }
  } catch (parseError) {
    console.warn('Failed to parse response:', parseError);
    return {
      error: `HTTP ${response.status} - ${response.statusText}`,
      details: 'Could not parse response content',
      status: response.status
    };
  }
};

/**
 * Handle API response with proper error handling for both JSON and non-JSON responses
 */
export const handleApiResponse = async <T = any>(response: Response): Promise<T> => {
  if (response.ok) {
    return await safeJsonParse(response);
  }
  
  const errorData = await safeJsonParse(response);
  const errorMessage = errorData.error || `HTTP ${response.status} - ${response.statusText}`;
  
  throw new Error(errorMessage);
};

/**
 * Check if response indicates a Firebase permission/authentication error
 */
export const isFirebaseAuthError = (errorData: any, response: Response): boolean => {
  if (!errorData || !errorData.error) return false;
  
  return errorData.error.includes('Firebase Admin SDK required') ||
         errorData.error.includes('service account credentials') ||
         errorData.error.includes('Firebase authentication required') ||
         errorData.error.includes('permission') ||
         errorData.details?.includes('Firebase Admin SDK') ||
         response.status === 403;
};