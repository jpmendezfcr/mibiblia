import DebugLogger from '../services/DebugLogger';

export const handleError = async (error: any, context: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const logMessage = `Error in ${context}: ${errorMessage}${errorStack ? `\nStack: ${errorStack}` : ''}`;
  await DebugLogger.error(logMessage);
  
  // You can add additional error handling logic here
  // For example, showing a toast message to the user
  console.error(logMessage);
};

export const wrapAsync = (fn: Function, context: string) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error, context);
      throw error; // Re-throw the error after logging
    }
  };
};
