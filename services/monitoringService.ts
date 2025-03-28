import { logger } from './loggingService';

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: MetricData[] = [];
  private readonly flushInterval: number = 60000; // 1 minute
  private readonly errorThreshold: number = 0.01; // 1% error rate threshold

  private constructor() {
    this.setupMetricsFlushing();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Record a metric
   */
  public recordMetric(data: MetricData): void {
    this.metrics.push({
      ...data,
      timestamp: data.timestamp || Date.now()
    });
  }

  /**
   * Track operation performance
   */
  public async trackPerformance<T>(
    operation: string,
    callback: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await callback();
      this.recordOperationMetrics(operation, startTime, true, metadata);
      return result;
    } catch (error) {
      this.recordOperationMetrics(operation, startTime, false, metadata);
      throw error;
    }
  }

  /**
   * Record operation metrics
   */
  private recordOperationMetrics(
    operation: string,
    startTime: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const duration = Date.now() - startTime;
    
    this.recordMetric({
      name: `operation.duration`,
      value: duration,
      tags: {
        operation,
        success: success.toString(),
      }
    });

    this.recordMetric({
      name: `operation.count`,
      value: 1,
      tags: {
        operation,
        success: success.toString(),
      }
    });

    logger.info(`Operation ${operation} completed`, {
      duration,
      success,
      metadata
    });
  }

  /**
   * Calculate error rate for an operation
   */
  public getErrorRate(operation: string, timeWindowMs: number = 300000): number {
    const now = Date.now();
    const relevantMetrics = this.metrics.filter(
      m => m.tags?.operation === operation && 
           m.name === 'operation.count' &&
           (now - (m.timestamp || 0)) <= timeWindowMs
    );

    const total = relevantMetrics.length;
    if (total === 0) return 0;

    const errors = relevantMetrics.filter(m => m.tags?.success === 'false').length;
    return errors / total;
  }

  /**
   * Check if error rate exceeds threshold
   */
  public checkErrorRate(operation: string): boolean {
    const errorRate = this.getErrorRate(operation);
    const exceeded = errorRate > this.errorThreshold;
    
    if (exceeded) {
      logger.error(`Error rate threshold exceeded for ${operation}`, {
        errorRate,
        threshold: this.errorThreshold
      });
    }
    
    return exceeded;
  }

  /**
   * Calculate average operation duration
   */
  public getAverageDuration(operation: string, timeWindowMs: number = 300000): number {
    const now = Date.now();
    const durations = this.metrics.filter(
      m => m.tags?.operation === operation && 
           m.name === 'operation.duration' &&
           (now - (m.timestamp || 0)) <= timeWindowMs
    );

    if (durations.length === 0) return 0;

    const total = durations.reduce((sum, m) => sum + m.value, 0);
    return total / durations.length;
  }

  /**
   * Setup automatic metrics flushing
   */
  private setupMetricsFlushing(): void {
    setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);
  }

  /**
   * Flush metrics to persistent storage
   */
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      // TODO: Implement metrics storage
      // This could send metrics to a monitoring service
      // or store them in Supabase

      // Clear processed metrics
      this.metrics = [];
    } catch (error) {
      logger.error('Failed to flush metrics', { error });
    }
  }
}

export const monitoring = MonitoringService.getInstance();