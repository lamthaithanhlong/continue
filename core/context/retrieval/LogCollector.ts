/**
 * Log Collector
 *
 * Collects logs from multiple sources and provides unified export functionality.
 *
 * Sources:
 * - Retrieval logs (from RetrievalLogger)
 * - Memory logs (from MemoryManager)
 * - Error logs (from global error handlers)
 * - Performance logs
 * - System logs
 */

import {
  LogExporter,
  LogEntry,
  LogLevel,
  LogExportOptions,
  LogExportResult,
} from "./LogExporter.js";
import { MemoryManager } from "./MemoryManager.js";
import { MemoryType } from "./types/MemoryTypes.js";

/**
 * Log source type
 */
export enum LogSource {
  RETRIEVAL = "retrieval",
  MEMORY = "memory",
  ERROR = "error",
  PERFORMANCE = "performance",
  SYSTEM = "system",
  USER = "user",
}

/**
 * Log collector configuration
 */
export interface LogCollectorConfig {
  /** Enable automatic log collection */
  enabled?: boolean;

  /** Maximum logs to keep in memory */
  maxLogs?: number;

  /** Auto-export on error */
  autoExportOnError?: boolean;

  /** Auto-export interval (ms) */
  autoExportInterval?: number;

  /** Workspace path */
  workspacePath?: string;

  /** Memory manager instance */
  memoryManager?: MemoryManager;
}

/**
 * Log Collector
 *
 * Centralized log collection and export.
 */
export class LogCollector {
  private static instance: LogCollector | null = null;
  private exporter: LogExporter;
  private config: Required<LogCollectorConfig>;
  private memoryManager?: MemoryManager;
  private autoExportTimer?: NodeJS.Timeout;

  private constructor(config: LogCollectorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxLogs: config.maxLogs ?? 10000,
      autoExportOnError: config.autoExportOnError ?? false,
      autoExportInterval: config.autoExportInterval ?? 0,
      workspacePath: config.workspacePath ?? "",
      memoryManager: config.memoryManager,
    };

    this.exporter = new LogExporter(this.config.workspacePath);
    this.memoryManager = config.memoryManager;

    // Setup auto-export if configured
    if (this.config.autoExportInterval > 0) {
      this.startAutoExport();
    }

    // Setup error handler
    if (this.config.autoExportOnError) {
      this.setupErrorHandler();
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: LogCollectorConfig): LogCollector {
    if (!LogCollector.instance) {
      LogCollector.instance = new LogCollector(config);
    }
    return LogCollector.instance;
  }

  /**
   * Reset singleton instance
   */
  static resetInstance(): void {
    if (LogCollector.instance) {
      LogCollector.instance.dispose();
      LogCollector.instance = null;
    }
  }

  /**
   * Log a message
   */
  log(
    level: LogLevel,
    source: LogSource,
    message: string,
    data?: any,
    error?: Error,
  ): void {
    if (!this.config.enabled) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      source,
      message,
      data,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          }
        : undefined,
    };

    this.exporter.addLog(entry);

    // Check max logs limit
    if (this.exporter.getLogsCount() > this.config.maxLogs) {
      // Keep only the most recent logs
      const logs = this.exporter.getLogsByLevel(LogLevel.ERROR);
      this.exporter.clearLogs();
      this.exporter.addLogs(logs.slice(-this.config.maxLogs / 2));
    }

    // Auto-export on error if configured
    if (level === LogLevel.ERROR && this.config.autoExportOnError) {
      void this.exportLogs({ errorsOnly: true });
    }
  }

  /**
   * Log debug message
   */
  debug(source: LogSource, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, source, message, data);
  }

  /**
   * Log info message
   */
  info(source: LogSource, message: string, data?: any): void {
    this.log(LogLevel.INFO, source, message, data);
  }

  /**
   * Log warning message
   */
  warn(source: LogSource, message: string, data?: any): void {
    this.log(LogLevel.WARN, source, message, data);
  }

  /**
   * Log error message
   */
  error(source: LogSource, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, source, message, data, error);
  }

  /**
   * Collect logs from memory manager
   */
  async collectMemoryLogs(): Promise<void> {
    if (!this.memoryManager) return;

    try {
      const stats = await this.memoryManager.getStats();

      this.info(LogSource.MEMORY, "Memory statistics collected", {
        total: stats.total,
        byType: stats.byType,
        storageSize: stats.storageSize,
      });

      // Get recent memories
      const recentMemories = stats.recentlyAdded.slice(0, 10);
      for (const memory of recentMemories) {
        this.debug(LogSource.MEMORY, `Memory: ${memory.title || memory.type}`, {
          id: memory.id,
          type: memory.type,
          importance: memory.importance,
          createdAt: memory.createdAt,
        });
      }
    } catch (error) {
      this.error(
        LogSource.MEMORY,
        "Failed to collect memory logs",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Export logs to file
   */
  async exportLogs(options: LogExportOptions = {}): Promise<LogExportResult> {
    try {
      // Collect memory logs before export
      if (options.includeMemoryLogs !== false) {
        await this.collectMemoryLogs();
      }

      const result = await this.exporter.exportLogs(options);

      if (result.success) {
        this.info(LogSource.SYSTEM, "Logs exported successfully", {
          filePath: result.filePath,
          fileSize: result.fileSize,
          entriesCount: result.entriesCount,
        });

        // Save export info to memory
        if (this.memoryManager) {
          await this.memoryManager.createMemory({
            content: `Logs exported to ${result.filePath}`,
            type: MemoryType.KNOWLEDGE,
            title: "Log Export",
            tags: ["logs", "export", "debug"],
            metadata: {
              filePath: result.filePath,
              fileSize: result.fileSize,
              entriesCount: result.entriesCount,
              timestamp: Date.now(),
            },
          });
        }
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.error(
        LogSource.SYSTEM,
        "Failed to export logs",
        error instanceof Error ? error : new Error(errorMessage),
      );

      return {
        success: false,
        entriesCount: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Export error logs only
   */
  async exportErrorLogs(): Promise<LogExportResult> {
    return this.exportLogs({
      errorsOnly: true,
      includeSystemInfo: true,
    });
  }

  /**
   * Get logs count
   */
  getLogsCount(): number {
    return this.exporter.getLogsCount();
  }

  /**
   * Get error logs count
   */
  getErrorLogsCount(): number {
    return this.exporter.getErrorLogs().length;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.exporter.clearLogs();
    this.info(LogSource.SYSTEM, "All logs cleared");
  }

  /**
   * Setup error handler
   */
  private setupErrorHandler(): void {
    // Capture unhandled errors
    process.on("uncaughtException", (error) => {
      this.error(LogSource.ERROR, "Uncaught exception", error);
    });

    process.on("unhandledRejection", (reason) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      this.error(LogSource.ERROR, "Unhandled rejection", error);
    });
  }

  /**
   * Start auto-export timer
   */
  private startAutoExport(): void {
    this.autoExportTimer = setInterval(() => {
      void this.exportLogs();
    }, this.config.autoExportInterval);
  }

  /**
   * Stop auto-export timer
   */
  private stopAutoExport(): void {
    if (this.autoExportTimer) {
      clearInterval(this.autoExportTimer);
      this.autoExportTimer = undefined;
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stopAutoExport();
    this.exporter.clearLogs();
  }
}

/**
 * Global log collector instance
 */
export const globalLogCollector = LogCollector.getInstance();

/**
 * Convenience functions
 */
export function logDebug(source: LogSource, message: string, data?: any): void {
  globalLogCollector.debug(source, message, data);
}

export function logInfo(source: LogSource, message: string, data?: any): void {
  globalLogCollector.info(source, message, data);
}

export function logWarn(source: LogSource, message: string, data?: any): void {
  globalLogCollector.warn(source, message, data);
}

export function logError(
  source: LogSource,
  message: string,
  error?: Error,
  data?: any,
): void {
  globalLogCollector.error(source, message, error, data);
}

export async function exportLogs(
  options?: LogExportOptions,
): Promise<LogExportResult> {
  return globalLogCollector.exportLogs(options);
}

export async function exportErrorLogs(): Promise<LogExportResult> {
  return globalLogCollector.exportErrorLogs();
}
