/**
 * Log Export Example
 *
 * Demonstrates how to use the log export feature.
 */

import {
  LogCollector,
  LogSource,
  exportErrorLogs,
  exportLogs,
  logDebug,
  logError,
  logInfo,
  logWarn,
} from "./LogCollector.js";
import { LogExportFormat } from "./LogExporter.js";

async function main() {
  console.log("🚀 Log Export Example\n");

  // Get log collector instance
  const collector = LogCollector.getInstance({
    enabled: true,
    workspacePath: "/example/workspace",
  });

  console.log("=== Logging Examples ===\n");

  // Example 1: Log debug message
  console.log("1. Logging debug message...");
  logDebug(LogSource.SYSTEM, "Application started", {
    version: "1.0.0",
    environment: "development",
  });

  // Example 2: Log info message
  console.log("2. Logging info message...");
  logInfo(LogSource.RETRIEVAL, "Context retrieval started", {
    query: "implement authentication",
    sources: ["fts", "embeddings", "lsp"],
  });

  // Example 3: Log warning message
  console.log("3. Logging warning message...");
  logWarn(LogSource.MEMORY, "Memory usage high", {
    currentMemories: 9500,
    maxMemories: 10000,
    usagePercent: 95,
  });

  // Example 4: Log error message
  console.log("4. Logging error message...");
  const error = new Error("Failed to connect to database");
  (error as any).code = "ECONNREFUSED";
  logError(LogSource.ERROR, "Database connection failed", error, {
    host: "localhost",
    port: 5432,
    retries: 3,
  });

  // Example 5: Log with sensitive data (will be sanitized)
  console.log("5. Logging with sensitive data...");
  logInfo(LogSource.SYSTEM, "API configuration loaded", {
    apiKey: "sk-1234567890abcdef",
    apiEndpoint: "https://api.example.com",
    token: "bearer-xyz-123",
    userId: "user-123",
  });

  console.log("\n=== Export Examples ===\n");

  // Example 6: Export all logs as JSON
  console.log("6. Exporting all logs as JSON...");
  const jsonResult = await exportLogs({
    format: LogExportFormat.JSON,
    includeSystemInfo: true,
  });

  if (jsonResult.success) {
    console.log(`   ✅ Exported to: ${jsonResult.filePath}`);
    console.log(`   📊 File size: ${jsonResult.fileSize} bytes`);
    console.log(`   📝 Entries: ${jsonResult.entriesCount}`);
  }

  // Example 7: Export all logs as text
  console.log("\n7. Exporting all logs as text...");
  const textResult = await exportLogs({
    format: LogExportFormat.TEXT,
    includeSystemInfo: true,
  });

  if (textResult.success) {
    console.log(`   ✅ Exported to: ${textResult.filePath}`);
    console.log(`   📊 File size: ${textResult.fileSize} bytes`);
    console.log(`   📝 Entries: ${textResult.entriesCount}`);
  }

  // Example 8: Export all logs as markdown
  console.log("\n8. Exporting all logs as markdown...");
  const markdownResult = await exportLogs({
    format: LogExportFormat.MARKDOWN,
    includeSystemInfo: true,
  });

  if (markdownResult.success) {
    console.log(`   ✅ Exported to: ${markdownResult.filePath}`);
    console.log(`   📊 File size: ${markdownResult.fileSize} bytes`);
    console.log(`   📝 Entries: ${markdownResult.entriesCount}`);
  }

  // Example 9: Export only error logs
  console.log("\n9. Exporting only error logs...");
  const errorResult = await exportErrorLogs();

  if (errorResult.success) {
    console.log(`   ✅ Exported to: ${errorResult.filePath}`);
    console.log(`   📊 File size: ${errorResult.fileSize} bytes`);
    console.log(`   📝 Entries: ${errorResult.entriesCount}`);
  }

  // Example 10: Export logs from last hour
  console.log("\n10. Exporting logs from last hour...");
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentResult = await exportLogs({
    format: LogExportFormat.JSON,
    fromTimestamp: oneHourAgo,
    toTimestamp: Date.now(),
  });

  if (recentResult.success) {
    console.log(`   ✅ Exported to: ${recentResult.filePath}`);
    console.log(`   📊 File size: ${recentResult.fileSize} bytes`);
    console.log(`   📝 Entries: ${recentResult.entriesCount}`);
  }

  // Example 11: Export with max entries limit
  console.log("\n11. Exporting with max 10 entries...");
  const limitedResult = await exportLogs({
    format: LogExportFormat.JSON,
    maxEntries: 10,
  });

  if (limitedResult.success) {
    console.log(`   ✅ Exported to: ${limitedResult.filePath}`);
    console.log(`   📊 File size: ${limitedResult.fileSize} bytes`);
    console.log(`   📝 Entries: ${limitedResult.entriesCount}`);
  }

  console.log("\n=== Statistics ===\n");

  // Example 12: Get logs count
  const totalLogs = collector.getLogsCount();
  const errorLogs = collector.getErrorLogsCount();

  console.log(`Total logs: ${totalLogs}`);
  console.log(`Error logs: ${errorLogs}`);
  console.log(`Other logs: ${totalLogs - errorLogs}`);

  console.log("\n=== Real-World Example ===\n");

  // Example 13: Simulate error handling workflow
  console.log("13. Simulating error handling workflow...");

  let debugResult;
  try {
    // Simulate some operation that fails
    throw new Error("Simulated error for demonstration");
  } catch (error) {
    // Log the error
    logError(
      LogSource.ERROR,
      "Operation failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        operation: "example-operation",
        timestamp: Date.now(),
      },
    );

    // Export error logs for debugging
    debugResult = await exportErrorLogs();

    if (debugResult.success) {
      console.log("\n   ❌ Error occurred!");
      console.log(`   📁 Error logs exported to: ${debugResult.filePath}`);
      console.log("   📤 Please send this file for analysis.");
      console.log("\n   Example message to AI:");
      console.log("   ---");
      console.log(
        `   I encountered an error. Here are the logs: ${debugResult.filePath}`,
      );
      console.log("   Can you help me debug this?");
      console.log("   ---");
    }
  }

  console.log("\n=== Summary ===\n");
  console.log("✅ Log export examples completed!");
  console.log("\n📝 Key Takeaways:");
  console.log("   1. Use logDebug/logInfo/logWarn/logError to log messages");
  console.log("   2. Use exportLogs() to export all logs");
  console.log("   3. Use exportErrorLogs() to export only errors");
  console.log("   4. Logs are saved to ~/.continue/logs/");
  console.log("   5. Sensitive data is automatically sanitized");
  console.log("   6. Multiple formats available (JSON, text, markdown)");
  console.log("\n🚀 Ready to use in production!");

  console.log("\n📂 Exported Files:");
  console.log(`   - ${jsonResult.filePath}`);
  console.log(`   - ${textResult.filePath}`);
  console.log(`   - ${markdownResult.filePath}`);
  console.log(`   - ${errorResult.filePath}`);
  console.log(`   - ${recentResult.filePath}`);
  console.log(`   - ${limitedResult.filePath}`);
  console.log(`   - ${debugResult.filePath}`);

  console.log("\n💡 Tip: You can open these files to see the exported logs!");
}

// Run example
main().catch((error) => {
  console.error("Example failed:", error);
  process.exit(1);
});
