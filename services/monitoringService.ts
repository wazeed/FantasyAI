import { logInfo, logError } from './loggingService'; // Import refactored functions

// --- Type Definitions ---

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number; // Milliseconds since epoch
}

// Note: PerformanceMetric interface wasn't actually used externally,
// but kept here for potential future use or internal clarity.
// interface PerformanceMetric {
//   operation: string;
//   duration: number; // Milliseconds
//   success: boolean;
//   metadata?: Record<string, any>;
// }

// --- Module State and Configuration ---

const metricsBuffer: MetricData[] = [];
const FLUSH_INTERVAL_MS: number = 60 * 1000; // 1 minute
const DEFAULT_ERROR_THRESHOLD: number = 0.01; // 1% error rate threshold
const DEFAULT_TIME_WINDOW_MS: number = 5 * 60 * 1000; // 5 minutes

let flushIntervalId: NodeJS.Timer | null = null;

// --- Internal Helper Functions ---

/**
 * Placeholder function for flushing metrics to a persistent store or monitoring service.
 */
async function _flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) {
    return;
  }

  const metricsToSend = [...metricsBuffer]; // Copy buffer
  metricsBuffer.length = 0; // Clear buffer immediately

  try {
    // TODO: Implement actual metrics storage/sending logic.
    // Example: await sendMetricsToBackend(metricsToSend);
    logInfo('Metrics flushed (simulated)', { count: metricsToSend.length });
  } catch (error) {
    logError('Failed to flush metrics', error);
    // Optionally, add metrics back to buffer or implement retry logic
    // metricsBuffer.unshift(...metricsToSend); // Example: Put back at the start
  }
}

/**
 * Sets up the interval for automatically flushing metrics.
 */
function _setupMetricsFlushing(): void {
  if (flushIntervalId) {
    clearInterval(flushIntervalId as any); // Clear existing interval if any
  }
  flushIntervalId = setInterval(() => {
    _flushMetrics().catch(err => {
        logError('Error during scheduled metrics flush', err);
    });
  }, FLUSH_INTERVAL_MS);
  logInfo('Metrics flushing interval started.', { intervalMs: FLUSH_INTERVAL_MS });
}

/**
 * Records metrics related to an operation's performance.
 * @param operation Name of the operation.
 * @param startTime Start time timestamp (ms).
 * @param success Whether the operation succeeded.
 * @param metadata Optional additional context.
 */
function _recordOperationMetrics(
  operation: string,
  startTime: number,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const duration = Date.now() - startTime;
  const successTag = success.toString();

  // Record duration metric
  recordMetric({
    name: `operation.duration`,
    value: duration,
    tags: { operation, success: successTag },
  });

  // Record count metric
  recordMetric({
    name: `operation.count`,
    value: 1,
    tags: { operation, success: successTag },
  });

  logInfo(`Operation '${operation}' completed`, {
    durationMs: duration,
    success,
    ...(metadata ? { metadata } : {}), // Conditionally spread metadata
  });
}

// --- Public Monitoring API ---

/**
 * Records a custom metric value.
 * @param data The metric data to record.
 */
export function recordMetric(data: MetricData): void {
  metricsBuffer.push({
    ...data,
    timestamp: data.timestamp || Date.now(), // Ensure timestamp exists
  });
  // Optional: Trigger flush if buffer is large?
  // if (metricsBuffer.length > SOME_THRESHOLD) { _flushMetrics(); }
}

/**
 * Tracks the performance of an asynchronous operation.
 * Records duration and success/failure count metrics.
 * Logs the operation result.
 * @param operation A descriptive name for the operation being tracked.
 * @param callback The asynchronous function to execute and track.
 * @param metadata Optional additional data to include in logs and potentially metrics.
 * @returns The result of the callback function.
 */
export async function trackPerformance<T>(
  operation: string,
  callback: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await callback();
    _recordOperationMetrics(operation, startTime, true, metadata);
    return result;
  } catch (error) {
    _recordOperationMetrics(operation, startTime, false, metadata);
    // Log the error as well, using the logging service
    logError(`Operation '${operation}' failed`, error, metadata);
    throw error; // Re-throw the error after logging and metrics
  }
}

/**
 * Calculates the error rate for a specific operation within a given time window.
 * @param operation The name of the operation.
 * @param timeWindowMs The time window in milliseconds (default: 5 minutes).
 * @returns The error rate (0 to 1).
 */
export function getErrorRate(operation: string, timeWindowMs: number = DEFAULT_TIME_WINDOW_MS): number {
  const now = Date.now();
  const windowStartTime = now - timeWindowMs;

  const relevantMetrics = metricsBuffer.filter(
    m =>
      m.name === 'operation.count' &&
      m.tags?.operation === operation &&
      (m.timestamp ?? 0) >= windowStartTime
  );

  const totalCount = relevantMetrics.length;
  if (totalCount === 0) {
    return 0; // No data for this operation in the window
  }

  const errorCount = relevantMetrics.filter(m => m.tags?.success === 'false').length;
  return errorCount / totalCount;
}

/**
 * Checks if the error rate for an operation exceeds a predefined threshold.
 * Logs an error if the threshold is exceeded.
 * @param operation The name of the operation.
 * @param threshold The error rate threshold (default: 0.01 or 1%).
 * @returns True if the error rate exceeds the threshold, false otherwise.
 */
export function checkErrorRate(operation: string, threshold: number = DEFAULT_ERROR_THRESHOLD): boolean {
  const currentErrorRate = getErrorRate(operation);
  const isExceeded = currentErrorRate > threshold;

  if (isExceeded) {
    logError(`Error rate threshold exceeded for operation '${operation}'`, new Error('Error rate threshold exceeded'), {
      operation,
      currentErrorRate,
      threshold,
    });
  }

  return isExceeded;
}

/**
 * Calculates the average duration for a specific operation within a given time window.
 * @param operation The name of the operation.
 * @param timeWindowMs The time window in milliseconds (default: 5 minutes).
 * @returns The average duration in milliseconds, or 0 if no data is available.
 */
export function getAverageDuration(operation: string, timeWindowMs: number = DEFAULT_TIME_WINDOW_MS): number {
  const now = Date.now();
  const windowStartTime = now - timeWindowMs;

  const durationMetrics = metricsBuffer.filter(
    m =>
      m.name === 'operation.duration' &&
      m.tags?.operation === operation &&
      (m.timestamp ?? 0) >= windowStartTime
  );

  if (durationMetrics.length === 0) {
    return 0; // No duration data for this operation in the window
  }

  const totalDuration = durationMetrics.reduce((sum, m) => sum + m.value, 0);
  return totalDuration / durationMetrics.length;
}

/**
 * Retrieves a copy of the current metrics buffer.
 * Useful for debugging or manual inspection.
 * @returns An array of MetricData objects.
 */
export function getMetricsBuffer(): MetricData[] {
    return [...metricsBuffer]; // Return a copy
}

/**
 * Manually triggers the flushing of metrics.
 */
export function flushMetrics(): Promise<void> {
    return _flushMetrics();
}

/**
 * Stops the automatic metrics flushing interval.
 */
export function stopMetricsFlushing(): void {
    if (flushIntervalId) {
        clearInterval(flushIntervalId as any);
        flushIntervalId = null;
        logInfo('Metrics flushing interval stopped.');
    }
}


// --- Initialization ---

// Automatically start flushing when the module is loaded.
_setupMetricsFlushing();

// Optional: Add cleanup logic if needed (e.g., for hot module replacement)
// if (module.hot) {
//   module.hot.dispose(() => {
//     stopMetricsFlushing();
//   });
// }