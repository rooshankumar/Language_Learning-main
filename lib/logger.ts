
// Simple logger for production environments
const isProd = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
    
    // In production, you might want to send errors to a monitoring service
    if (isProd && error) {
      // Example: sendToErrorMonitoring(error);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (!isProd) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};
