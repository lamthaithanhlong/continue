/**
 * Log Exporter
 *
 * Export logs to files for debugging and troubleshooting.
 * Allows users to download logs and share them for analysis.
 *
 * Features:
 * - Export retrieval logs
 * - Export memory logs
 * - Export error logs
 * - Export system information
 * - Sanitize sensitive data
 * - Multiple export formats (JSON, text, ZIP)
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Log export format
 */
export enum LogExportFormat {
  JSON = "json",
  TEXT = "text",
  MARKDOWN = "markdown",
}

/**
 * Log level for filtering
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * System information
 */
export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  continueVersion: string;
  workspacePath?: string;
  timestamp: number;
}

/**
 * Export options
 */
export interface LogExportOptions {
  /** Output file path */
  outputPath?: string;

  /** Export format */
  format?: LogExportFormat;

  /** Include system info */
  includeSystemInfo?: boolean;

  /** Include retrieval logs */
  includeRetrievalLogs?: boolean;

  /** Include memory logs */
  includeMemoryLogs?: boolean;

  /** Include error logs only */
  errorsOnly?: boolean;

  /** Time range (from timestamp) */
  fromTimestamp?: number;

  /** Time range (to timestamp) */
  toTimestamp?: number;

  /** Sanitize sensitive data */
  sanitize?: boolean;

  /** Maximum log entries */
  maxEntries?: number;
}

/**
 * Export result
 */
export interface LogExportResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  entriesCount: number;
  error?: string;
}

/**
 * Log Exporter
 *
 * Exports logs to files for debugging and sharing.
 */
export class LogExporter {
  private logs: LogEntry[] = [];
  private systemInfo: SystemInfo;

  constructor(workspacePath?: string) {
    this.systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      continueVersion: this.getContinueVersion(),
      workspacePath,
      timestamp: Date.now(),
    };
  }

  /**
   * Add a log entry
   */
  addLog(entry: LogEntry): void {
    this.logs.push(entry);
  }

  /**
   * Add multiple log entries
   */
  addLogs(entries: LogEntry[]): void {
    this.logs.push(...entries);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to file
   */
  async exportLogs(options: LogExportOptions = {}): Promise<LogExportResult> {
    try {
      // Apply filters
      let filteredLogs = this.filterLogs(options);

      // Sanitize if requested
      if (options.sanitize !== false) {
        filteredLogs = this.sanitizeLogs(filteredLogs);
      }

      // Apply max entries limit
      if (options.maxEntries && filteredLogs.length > options.maxEntries) {
        filteredLogs = filteredLogs.slice(-options.maxEntries);
      }

      // Generate output path
      const outputPath =
        options.outputPath || this.generateOutputPath(options.format);

      // Export based on format
      const format = options.format || LogExportFormat.JSON;
      let content: string;

      switch (format) {
        case LogExportFormat.JSON:
          content = this.exportAsJSON(filteredLogs, options);
          break;
        case LogExportFormat.TEXT:
          content = this.exportAsText(filteredLogs, options);
          break;
        case LogExportFormat.MARKDOWN:
          content = this.exportAsMarkdown(filteredLogs, options);
          break;
        default:
          content = this.exportAsJSON(filteredLogs, options);
      }

      // Write to file
      fs.writeFileSync(outputPath, content, "utf-8");

      // Get file size
      const stats = fs.statSync(outputPath);

      return {
        success: true,
        filePath: outputPath,
        fileSize: stats.size,
        entriesCount: filteredLogs.length,
      };
    } catch (error) {
      return {
        success: false,
        entriesCount: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Filter logs based on options
   */
  private filterLogs(options: LogExportOptions): LogEntry[] {
    let filtered = [...this.logs];

    // Filter by errors only
    if (options.errorsOnly) {
      filtered = filtered.filter((log) => log.level === LogLevel.ERROR);
    }

    // Filter by time range
    if (options.fromTimestamp) {
      filtered = filtered.filter(
        (log) => log.timestamp >= options.fromTimestamp!,
      );
    }
    if (options.toTimestamp) {
      filtered = filtered.filter(
        (log) => log.timestamp <= options.toTimestamp!,
      );
    }

    return filtered;
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeLogs(logs: LogEntry[]): LogEntry[] {
    return logs.map((log) => ({
      ...log,
      data: this.sanitizeData(log.data),
    }));
  }

  /**
   * Sanitize data object
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    if (typeof data !== "object") return data;

    const sanitized = { ...data };
    const sensitiveKeys = [
      "apiKey",
      "api_key",
      "token",
      "password",
      "secret",
      "authorization",
      "auth",
    ];

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Export as JSON
   */
  private exportAsJSON(logs: LogEntry[], options: LogExportOptions): string {
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      entriesCount: logs.length,
      logs,
    };

    if (options.includeSystemInfo !== false) {
      exportData.systemInfo = this.systemInfo;
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export as text
   */
  private exportAsText(logs: LogEntry[], options: LogExportOptions): string {
    let text = "";

    // Add header
    text += "=".repeat(80) + "\n";
    text += "Continue.dev Log Export\n";
    text += "=".repeat(80) + "\n\n";

    // Add system info
    if (options.includeSystemInfo !== false) {
      text += "System Information:\n";
      text += `-`.repeat(80) + "\n";
      text += `Platform: ${this.systemInfo.platform}\n`;
      text += `Architecture: ${this.systemInfo.arch}\n`;
      text += `Node Version: ${this.systemInfo.nodeVersion}\n`;
      text += `Continue Version: ${this.systemInfo.continueVersion}\n`;
      if (this.systemInfo.workspacePath) {
        text += `Workspace: ${this.systemInfo.workspacePath}\n`;
      }
      text += `Exported At: ${new Date().toISOString()}\n`;
      text += "\n";
    }

    // Add logs
    text += "Logs:\n";
    text += `-`.repeat(80) + "\n\n";

    for (const log of logs) {
      const timestamp = new Date(log.timestamp).toISOString();
      text += `[${timestamp}] [${log.level.toUpperCase()}] [${log.source}]\n`;
      text += `${log.message}\n`;

      if (log.data) {
        text += `Data: ${JSON.stringify(log.data, null, 2)}\n`;
      }

      if (log.error) {
        text += `Error: ${log.error.message}\n`;
        if (log.error.stack) {
          text += `Stack:\n${log.error.stack}\n`;
        }
      }

      text += "\n";
    }

    return text;
  }

  /**
   * Export as Markdown
   */
  private exportAsMarkdown(
    logs: LogEntry[],
    options: LogExportOptions,
  ): string {
    let md = "";

    // Add header
    md += "# Continue.dev Log Export\n\n";

    // Add system info
    if (options.includeSystemInfo !== false) {
      md += "## System Information\n\n";
      md += `- **Platform**: ${this.systemInfo.platform}\n`;
      md += `- **Architecture**: ${this.systemInfo.arch}\n`;
      md += `- **Node Version**: ${this.systemInfo.nodeVersion}\n`;
      md += `- **Continue Version**: ${this.systemInfo.continueVersion}\n`;
      if (this.systemInfo.workspacePath) {
        md += `- **Workspace**: ${this.systemInfo.workspacePath}\n`;
      }
      md += `- **Exported At**: ${new Date().toISOString()}\n\n`;
    }

    // Add logs
    md += "## Logs\n\n";
    md += `Total Entries: ${logs.length}\n\n`;

    for (const log of logs) {
      const timestamp = new Date(log.timestamp).toISOString();
      const levelEmoji = this.getLevelEmoji(log.level);

      md += `### ${levelEmoji} ${log.source}\n\n`;
      md += `**Time**: ${timestamp}  \n`;
      md += `**Level**: ${log.level.toUpperCase()}  \n`;
      md += `**Message**: ${log.message}\n\n`;

      if (log.data) {
        md += "**Data**:\n```json\n";
        md += JSON.stringify(log.data, null, 2);
        md += "\n```\n\n";
      }

      if (log.error) {
        md += `**Error**: ${log.error.message}\n\n`;
        if (log.error.stack) {
          md += "**Stack Trace**:\n```\n";
          md += log.error.stack;
          md += "\n```\n\n";
        }
      }

      md += "---\n\n";
    }

    return md;
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "🔍";
      case LogLevel.INFO:
        return "ℹ️";
      case LogLevel.WARN:
        return "⚠️";
      case LogLevel.ERROR:
        return "❌";
      default:
        return "📝";
    }
  }

  /**
   * Generate output file path
   */
  private generateOutputPath(format?: LogExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = format || LogExportFormat.JSON;
    const filename = `continue-logs-${timestamp}.${ext}`;

    // Save to user's home directory or temp directory
    const homeDir = os.homedir();
    const outputDir = path.join(homeDir, ".continue", "logs");

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return path.join(outputDir, filename);
  }

  /**
   * Get Continue version
   */
  private getContinueVersion(): string {
    try {
      // Try to read from package.json
      const packagePath = path.join(__dirname, "../../../package.json");
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
        return pkg.version || "unknown";
      }
    } catch (error) {
      // Ignore
    }
    return "unknown";
  }

  /**
   * Get current logs count
   */
  getLogsCount(): number {
    return this.logs.length;
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get error logs
   */
  getErrorLogs(): LogEntry[] {
    return this.getLogsByLevel(LogLevel.ERROR);
  }
}
