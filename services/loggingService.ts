import { Platform } from 'react-native'; // Use React Native's Platform API

// --- Type Definitions ---

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string; // ISO 8601 format
  context?: Record<string, any>;
  error?: ErrorDetails;
}

export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>; // Additional structured info
}

// --- Module State and Configuration ---

const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE: number = 100; // Max number of log entries to keep in memory
const IS_CONSOLE_LOGGING_ENABLED: boolean = process.env.NODE_ENV !== 'production'; // Enable console logs in dev

// --- Helper Functions ---

/**
 * Sanitizes an error object (or unknown value) into a structured format for logging.
 * @param error The error object or value to sanitize.
 * @returns A structured ErrorDetails object.
 */
function sanitizeError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    // Extract standard error properties
    const details: ErrorDetails = {
      name: error.name || 'Error',
      message: error.message,
      stack: error.stack,
      metadata: {
        type: error.constructor.name,
      },
    };
    // Include additional properties if they exist, avoiding circular refs (basic check)
    Object.keys(error).forEach((key) => {
      if (key !== 'name' && key !== 'message' && key !== 'stack') {
        const value = (error as any)[key];
        if (typeof value !== 'object' || value === null) { // Avoid deep objects/circulars
          details.metadata = { ...details.metadata, [key]: value };
        }
      }
    });
    return details;
  }

  if (typeof error === 'string') {
    return { name: 'Error', message: error };
  }

  // Handle non-standard errors or other types
  let message = 'An unknown error occurred';
  try {
    message = JSON.stringify(error);
  } catch {
    // Ignore stringify errors
  }
  return {
    name: 'UnknownError',
    message: message,
    metadata: { originalType: typeof error },
  };
}

/**
 * Recursively sanitizes a context object, converting Error instances within it.
 * @param context The context object to sanitize.
 * @returns A sanitized context object.
 */
function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value instanceof Error) {
      sanitized[key] = sanitizeError(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Avoid potential circular references by not infinitely recursing; simple depth limit
      // A more robust solution might involve tracking visited objects
      sanitized[key] = '[Object]'; // Placeholder for nested objects for simplicity
      // Or implement limited depth recursion if needed:
      // sanitized[key] = sanitizeContext(value); // Be cautious with deep objects
    } else {
      sanitized[key] = value; // Keep primitives, arrays, null as is
    }
  }
  return sanitized;
}

/**
 * Writes a log entry to the console based on its level.
 * @param entry The log entry to write.
 */
function writeToConsole(entry: LogEntry): void {
  if (!IS_CONSOLE_LOGGING_ENABLED) {
    return;
  }

  const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}:`;
  const args: any[] = [prefix, entry.message];
  if (entry.context) args.push(entry.context);
  if (entry.error) args.push(entry.error);

  switch (entry.level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

/**
 * Placeholder for sending log entries to a remote logging service (e.g., Sentry, Datadog).
 * @param entry The log entry to send.
 */
async function sendToRemoteLogging(entry: LogEntry): Promise<void> {
  // TODO: Implement integration with a remote logging service.
  // Example: await Sentry.captureMessage(entry.message, { level: entry.level, extra: { ...entry.context, errorDetails: entry.error } });
  if (entry.level === 'error') {
     // console.log("Simulating sending error to remote service:", entry);
  }
}

/**
 * Internal function to handle the logging logic.
 * @param level The severity level of the log.
 * @param message The main log message.
 * @param context Optional additional context data.
 * @param error Optional error object associated with the log.
 */
function _logInternal(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: context ? sanitizeContext(context) : undefined,
    error: error ? sanitizeError(error) : undefined,
  };

  // Add to buffer, maintaining size limit
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift(); // Remove the oldest entry
  }

  writeToConsole(entry);
  sendToRemoteLogging(entry).catch(remoteError => {
    console.error("Failed to send log to remote service:", sanitizeError(remoteError));
  });
}

// --- Public Logging API ---

/**
 * Logs a debug message. Typically used for detailed diagnostic information during development.
 * @param message The message to log.
 * @param context Optional additional data.
 */
export function logDebug(message: string, context?: Record<string, any>): void {
  _logInternal('debug', message, context);
}

/**
 * Logs an informational message. Used for general operational messages.
 * @param message The message to log.
 * @param context Optional additional data.
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  _logInternal('info', message, context);
}

/**
 * Logs a warning message. Indicates a potential issue that doesn't prevent operation.
 * @param message The message to log.
 * @param context Optional additional data.
 */
export function logWarn(message: string, context?: Record<string, any>): void {
  _logInternal('warn', message, context);
}

/**
 * Logs an error message. Used when an error occurs that impacts functionality.
 * @param message The primary error message.
 * @param error The Error object.
 * @param context Optional additional data related to the error.
 */
export function logError(message: string, error: Error | unknown, context?: Record<string, any>): void {
   // Ensure we always pass an Error object to _logInternal if possible
   const errorObj = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error occurred');
   const sanitizedContext = {
     ...(context ?? {}),
     // Add original error if it wasn't an Error instance
     ...(!(error instanceof Error) && { originalErrorValue: error }),
   };
  _logInternal('error', message, sanitizedContext, errorObj);
}


/**
 * Retrieves a copy of the current log buffer.
 * @returns An array of LogEntry objects.
 */
export function getLogs(): LogEntry[] {
  return [...logBuffer]; // Return a copy
}

/**
 * Retrieves logs filtered by a specific level.
 * @param level The log level to filter by.
 * @returns An array of LogEntry objects matching the level.
 */
export function getLogsByLevel(level: LogLevel): LogEntry[] {
  return logBuffer.filter(entry => entry.level === level);
}

/**
 * Clears all logs from the in-memory buffer.
 */
export function clearLogs(): void {
  logBuffer.length = 0; // More efficient than creating a new array
}

// --- Global Error Handling Setup ---

let isGlobalHandlerInitialized = false;

/**
 * Sets up global error handlers for uncaught exceptions and unhandled promise rejections.
 * Should be called once during application initialization (e.g., in App.tsx).
 */
export function initializeGlobalErrorHandling(): void {
  if (isGlobalHandlerInitialized) {
    logWarn("Global error handler already initialized.");
    return;
  }

  if (Platform.OS === 'web') {
    // Web Environment
    (globalThis as any).onerror = (message: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
      logError('Uncaught web error', error ?? new Error(message.toString()), {
        source,
        lineno,
        colno,
      });
      return false; // Prevent default browser handling
    };

    (globalThis as any).onunhandledrejection = (event: any) => { // Use 'any' for broader compatibility if PromiseRejectionEvent isn't globally defined
      logError('Unhandled promise rejection', event.reason, { promise: event.promise });
    };

  } else {
    // React Native Environment
    try {
      const ErrorUtils = global.ErrorUtils;
      if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
        ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          logError(`Uncaught RN error (Fatal: ${!!isFatal})`, error);
          // Potentially add logic here to close the app if fatal, or report differently
        });
      } else {
         logWarn("React Native ErrorUtils not available or setGlobalHandler is not a function.");
      }
    } catch (setupError) {
      logError('Failed to set up React Native error handler', setupError);
    }
  }

  isGlobalHandlerInitialized = true;
  logInfo("Global error handlers initialized.");
}

// Ensure ErrorUtils is declared on global for RN environment checks
declare const global: {
  ErrorUtils?: {
    setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};