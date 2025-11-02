import { Logger } from "../../util/Logger.js";

/**
 * Log levels for retrieval operations
 */
export type RetrievalLogLevel = "debug" | "info" | "warn" | "error";

/**
 * Configuration for RetrievalLogger
 */
export interface RetrievalLoggerConfig {
  /**
   * Enable/disable logging
   * @default true
   */
  enabled?: boolean;

  /**
   * Log level (debug, info, warn, error)
   * @default "info"
   */
  logLevel?: RetrievalLogLevel;

  /**
   * Enable detailed debug logging
   * @default false
   */
  debugMode?: boolean;

  /**
   * Enable performance metrics logging
   * @default true
   */
  logPerformance?: boolean;

  /**
   * Optional API endpoint to send logs to
   * If provided, logs will be sent to this endpoint via POST
   * @example "https://api.example.com/retrieval-logs"
   */
  apiEndpoint?: string;

  /**
   * Optional API key for authentication
   */
  apiKey?: string;

  /**
   * Batch size for API logging (number of logs to batch before sending)
   * @default 10
   */
  apiBatchSize?: number;
}

/**
 * Retrieval operation context
 */
export interface RetrievalContext {
  /**
   * Unique ID for this retrieval operation
   */
  retrievalId: string;

  /**
   * Query string
   */
  query: string;

  /**
   * Number of results requested
   */
  nRetrieve: number;

  /**
   * Timestamp when retrieval started
   */
  startTime: number;

  /**
   * Enabled sources for this retrieval
   */
  enabledSources: string[];
}

/**
 * Source-specific log entry
 */
export interface SourceLogEntry {
  /**
   * Source name (e.g., "fts", "embeddings")
   */
  source: string;

  /**
   * Status (started, completed, error)
   */
  status: "started" | "completed" | "error";

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Duration in milliseconds (for completed/error)
   */
  durationMs?: number;

  /**
   * Number of chunks retrieved (for completed)
   */
  chunksRetrieved?: number;

  /**
   * Error message (for error)
   */
  error?: string;

  /**
   * Error stack trace (for error)
   */
  errorStack?: string;
}

/**
 * Performance metrics for a retrieval operation
 */
export interface RetrievalPerformanceMetrics {
  /**
   * Retrieval ID
   */
  retrievalId: string;

  /**
   * Total duration in milliseconds
   */
  totalDurationMs: number;

  /**
   * Total chunks retrieved across all sources
   */
  totalChunks: number;

  /**
   * Per-source metrics
   */
  sourceMetrics: {
    source: string;
    durationMs: number;
    chunksRetrieved: number;
    success: boolean;
  }[];

  /**
   * Query string
   */
  query: string;

  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Logger for retrieval operations
 * Provides structured logging, performance tracking, and optional API integration
 */
export class RetrievalLogger {
  private static instance: RetrievalLogger | null = null;
  private config: Required<RetrievalLoggerConfig>;
  private logBatch: any[] = [];
  private activeRetrievals: Map<string, RetrievalContext> = new Map();
  private sourceEntries: Map<string, SourceLogEntry[]> = new Map();

  private constructor(config: RetrievalLoggerConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      logLevel: config.logLevel ?? "info",
      debugMode: config.debugMode ?? false,
      logPerformance: config.logPerformance ?? true,
      apiEndpoint: config.apiEndpoint ?? "",
      apiKey: config.apiKey ?? "",
      apiBatchSize: config.apiBatchSize ?? 10,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: RetrievalLoggerConfig): RetrievalLogger {
    if (!RetrievalLogger.instance) {
      RetrievalLogger.instance = new RetrievalLogger(config);
    } else if (config) {
      // Update config if provided
      RetrievalLogger.instance.updateConfig(config);
    }
    return RetrievalLogger.instance;
  }

  /**
   * Update logger configuration
   */
  public updateConfig(config: Partial<RetrievalLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate unique retrieval ID
   */
  private generateRetrievalId(): string {
    return `retrieval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if logging is enabled for a given level
   */
  private shouldLog(level: RetrievalLogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: RetrievalLogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Log retrieval start
   */
  public logRetrievalStart(
    query: string,
    nRetrieve: number,
    enabledSources: string[],
  ): string {
    const retrievalId = this.generateRetrievalId();
    const context: RetrievalContext = {
      retrievalId,
      query,
      nRetrieve,
      startTime: Date.now(),
      enabledSources,
    };

    this.activeRetrievals.set(retrievalId, context);
    this.sourceEntries.set(retrievalId, []);

    if (this.shouldLog("info")) {
      Logger.info(`[Retrieval] Started retrieval ${retrievalId}`, {
        query,
        nRetrieve,
        enabledSources,
      });
    }

    if (this.config.debugMode) {
      Logger.debug(`[Retrieval] Debug - Full context`, context);
    }

    return retrievalId;
  }

  /**
   * Log source retrieval start
   */
  public logSourceStart(retrievalId: string, source: string): void {
    const entry: SourceLogEntry = {
      source,
      status: "started",
      timestamp: Date.now(),
    };

    const entries = this.sourceEntries.get(retrievalId) || [];
    entries.push(entry);
    this.sourceEntries.set(retrievalId, entries);

    if (this.shouldLog("debug")) {
      Logger.debug(`[Retrieval] Source ${source} started`, { retrievalId });
    }
  }

  /**
   * Log source retrieval completion
   */
  public logSourceComplete(
    retrievalId: string,
    source: string,
    chunksRetrieved: number,
    startTime: number,
  ): void {
    const durationMs = Date.now() - startTime;
    const entry: SourceLogEntry = {
      source,
      status: "completed",
      timestamp: Date.now(),
      durationMs,
      chunksRetrieved,
    };

    const entries = this.sourceEntries.get(retrievalId) || [];
    entries.push(entry);
    this.sourceEntries.set(retrievalId, entries);

    if (this.shouldLog("info")) {
      Logger.info(`[Retrieval] Source ${source} completed`, {
        retrievalId,
        durationMs,
        chunksRetrieved,
      });
    }
  }

  /**
   * Log source retrieval error
   */
  public logSourceError(
    retrievalId: string,
    source: string,
    error: Error,
    startTime: number,
  ): void {
    const durationMs = Date.now() - startTime;
    const entry: SourceLogEntry = {
      source,
      status: "error",
      timestamp: Date.now(),
      durationMs,
      error: error.message,
      errorStack: error.stack,
    };

    const entries = this.sourceEntries.get(retrievalId) || [];
    entries.push(entry);
    this.sourceEntries.set(retrievalId, entries);

    if (this.shouldLog("error")) {
      Logger.error(error, {
        retrievalId,
        source,
        durationMs,
      });
    }
  }

  /**
   * Log retrieval completion
   */
  public logRetrievalComplete(retrievalId: string, totalChunks: number): void {
    const context = this.activeRetrievals.get(retrievalId);
    if (!context) {
      Logger.warn(`[Retrieval] No context found for ${retrievalId}`);
      return;
    }

    const totalDurationMs = Date.now() - context.startTime;

    if (this.shouldLog("info")) {
      Logger.info(`[Retrieval] Completed retrieval ${retrievalId}`, {
        totalDurationMs,
        totalChunks,
        query: context.query,
      });
    }

    // Log performance metrics
    if (this.config.logPerformance) {
      this.logPerformanceMetrics(retrievalId, totalChunks, totalDurationMs);
    }

    // Clean up
    this.activeRetrievals.delete(retrievalId);
    this.sourceEntries.delete(retrievalId);
  }

  /**
   * Log performance metrics
   */
  private logPerformanceMetrics(
    retrievalId: string,
    totalChunks: number,
    totalDurationMs: number,
  ): void {
    const context = this.activeRetrievals.get(retrievalId);
    const entries = this.sourceEntries.get(retrievalId) || [];

    if (!context) return;

    const sourceMetrics = entries
      .filter((e) => e.status === "completed")
      .map((e) => ({
        source: e.source,
        durationMs: e.durationMs || 0,
        chunksRetrieved: e.chunksRetrieved || 0,
        success: true,
      }));

    const metrics: RetrievalPerformanceMetrics = {
      retrievalId,
      totalDurationMs,
      totalChunks,
      sourceMetrics,
      query: context.query,
      timestamp: Date.now(),
    };

    if (this.shouldLog("info")) {
      Logger.info(`[Retrieval] Performance metrics`, metrics);
    }

    // Send to API if configured
    if (this.config.apiEndpoint) {
      this.sendToAPI(metrics);
    }
  }

  /**
   * Send metrics to API endpoint
   */
  private async sendToAPI(data: any): Promise<void> {
    try {
      this.logBatch.push(data);

      // Send batch if size reached
      if (this.logBatch.length >= this.config.apiBatchSize) {
        await this.flushBatch();
      }
    } catch (error) {
      Logger.error(error, { context: "RetrievalLogger.sendToAPI" });
    }
  }

  /**
   * Flush log batch to API
   */
  public async flushBatch(): Promise<void> {
    if (this.logBatch.length === 0 || !this.config.apiEndpoint) {
      return;
    }

    const batch = [...this.logBatch];
    this.logBatch = [];

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ logs: batch }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      if (this.shouldLog("debug")) {
        Logger.debug(`[Retrieval] Sent ${batch.length} logs to API`);
      }
    } catch (error) {
      Logger.error(error, {
        context: "RetrievalLogger.flushBatch",
        batchSize: batch.length,
      });
      // Re-add to batch for retry
      this.logBatch.unshift(...batch);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<RetrievalLoggerConfig> {
    return { ...this.config };
  }
}

/**
 * Default export for convenience
 */
export default RetrievalLogger;
