type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: ErrorDetails;
}

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
}

interface ErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
}

interface PromiseRejectionEvent {
  reason: any;
  promise: Promise<any>;
}

// Custom window interface for cross-platform compatibility
interface CustomWindow {
  onerror?: (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) => boolean;
  onunhandledrejection?: (event: PromiseRejectionEvent) => void;
}

class LoggingService {
  private static instance: LoggingService;
  private logBuffer: LogEntry[] = [];
  private readonly bufferSize: number = 100;
  private readonly consoleEnabled: boolean = true;
  private readonly isWeb: boolean;

  private constructor() {
    // Determine platform
    this.isWeb = typeof global.window !== 'undefined';
    
    // Initialize error handling
    this.setupGlobalErrorHandling();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Set up global error handling
   */
  private setupGlobalErrorHandling(): void {
    if (this.isWeb) {
      // Web-specific error handling
      const globalObj = global.window as unknown as CustomWindow;
      
      globalObj.onerror = (
        message: string | Event,
        source?: string,
        lineno?: number,
        colno?: number,
        error?: Error
      ) => {
        this.error('Uncaught error', {
          message: message.toString(),
          source,
          lineno,
          colno,
          error: this.sanitizeError(error || new Error(message.toString()))
        });
        return false;
      };

      globalObj.onunhandledrejection = (event: PromiseRejectionEvent) => {
        this.error('Unhandled promise rejection', {
          reason: this.sanitizeError(event.reason)
        });
      };
    } else {
      // React Native error handling
      try {
        // @ts-ignore: React Native specific API
        const ErrorUtils = global.ErrorUtils;
        if (ErrorUtils) {
          ErrorUtils.setGlobalHandler((error: Error) => {
            this.error('Uncaught error in React Native', {
              error: this.sanitizeError(error)
            });
          });
        }
      } catch (error) {
        console.warn('Failed to set up React Native error handler:', error);
      }
    }
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  public error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error);
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeContext(context) : undefined,
      error: error ? this.sanitizeError(error) : undefined
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }

    // Console output if enabled
    if (this.consoleEnabled) {
      this.writeToConsole(entry);
    }

    // TODO: Add remote logging integration here
    this.sendToRemoteLogging(entry);
  }

  /**
   * Write log entry to console
   */
  private writeToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}:`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.context || '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.context || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.context || '');
        break;
      case 'error':
        console.error(
          prefix,
          entry.message,
          entry.context || '',
          entry.error || ''
        );
        break;
    }
  }

  /**
   * Send log entry to remote logging service
   */
  private async sendToRemoteLogging(entry: LogEntry): Promise<void> {
    // TODO: Implement remote logging integration
    // This could be integrated with services like Sentry, LogRocket, etc.
  }

  /**
   * Get all logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logBuffer.filter(entry => entry.level === level);
  }

  /**
   * Clear log buffer
   */
  public clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Sanitize error object for logging
   */
  private sanitizeError(error: unknown): ErrorDetails {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        metadata: {
          type: error.constructor.name,
          ...(error as any)
        }
      };
    }
    
    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error
      };
    }
    
    return {
      name: 'Unknown Error',
      message: 'An unknown error occurred',
      metadata: { originalError: error }
    };
  }

  /**
   * Sanitize context object for logging
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      if (value instanceof Error) {
        sanitized[key] = this.sanitizeError(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

declare const global: { window?: CustomWindow; ErrorUtils?: any };

export const logger = LoggingService.getInstance();