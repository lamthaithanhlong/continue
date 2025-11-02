/**
 * Log Export Test Suite
 *
 * Tests for log export functionality.
 */

import { fileURLToPath } from "url";
import * as path from "path";
import * as fs from "fs";
import { LogCollector, LogSource } from "./LogCollector.js";
import { LogExportFormat } from "./LogExporter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test counters
let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
  totalTests++;
  return (async () => {
    try {
      const result = await Promise.resolve(fn());
      if (result) {
        console.log(`✅ ${name}`);
        passedTests++;
      } else {
        console.error(`❌ ${name}`);
      }
    } catch (error) {
      console.error(`❌ ${name}: ${error}`);
    }
  })();
}

async function runTests() {
  console.log("\n🧪 Log Export Test Suite\n");

  // Reset instance for clean test
  LogCollector.resetInstance();

  const logCollector = LogCollector.getInstance({
    enabled: true,
    workspacePath: "/test/workspace",
  });

  console.log("=== Testing Log Collection ===\n");

  // Test 1: Can log debug message
  await test("Can log debug message", () => {
    logCollector.debug(LogSource.SYSTEM, "Test debug message", { test: true });
    return logCollector.getLogsCount() > 0;
  });

  // Test 2: Can log info message
  await test("Can log info message", () => {
    logCollector.info(LogSource.RETRIEVAL, "Test info message", { count: 42 });
    return logCollector.getLogsCount() > 1;
  });

  // Test 3: Can log warning message
  await test("Can log warning message", () => {
    logCollector.warn(LogSource.MEMORY, "Test warning message");
    return logCollector.getLogsCount() > 2;
  });

  // Test 4: Can log error message
  await test("Can log error message", () => {
    const error = new Error("Test error");
    logCollector.error(LogSource.ERROR, "Test error message", error);
    return logCollector.getErrorLogsCount() > 0;
  });

  console.log("\n=== Testing Log Export ===\n");

  // Test 5: Can export logs as JSON
  let jsonExportPath: string | undefined;
  await test("Can export logs as JSON", async () => {
    const result = await logCollector.exportLogs({
      format: LogExportFormat.JSON,
      includeSystemInfo: true,
    });
    jsonExportPath = result.filePath;
    return (
      result.success &&
      result.filePath !== undefined &&
      fs.existsSync(result.filePath)
    );
  });

  // Test 6: JSON export contains valid data
  await test("JSON export contains valid data", () => {
    if (!jsonExportPath) return false;
    const content = fs.readFileSync(jsonExportPath, "utf-8");
    const data = JSON.parse(content);
    return (
      data.exportedAt !== undefined &&
      data.entriesCount > 0 &&
      data.logs !== undefined &&
      Array.isArray(data.logs) &&
      data.systemInfo !== undefined
    );
  });

  // Test 7: Can export logs as text
  let textExportPath: string | undefined;
  await test("Can export logs as text", async () => {
    const result = await logCollector.exportLogs({
      format: LogExportFormat.TEXT,
      includeSystemInfo: true,
    });
    textExportPath = result.filePath;
    return (
      result.success &&
      result.filePath !== undefined &&
      fs.existsSync(result.filePath)
    );
  });

  // Test 8: Text export contains readable content
  await test("Text export contains readable content", () => {
    if (!textExportPath) return false;
    const content = fs.readFileSync(textExportPath, "utf-8");
    return (
      content.includes("Continue.dev Log Export") &&
      content.includes("System Information") &&
      content.includes("Logs:")
    );
  });

  // Test 9: Can export logs as markdown
  let markdownExportPath: string | undefined;
  await test("Can export logs as markdown", async () => {
    const result = await logCollector.exportLogs({
      format: LogExportFormat.MARKDOWN,
      includeSystemInfo: true,
    });
    markdownExportPath = result.filePath;
    return (
      result.success &&
      result.filePath !== undefined &&
      fs.existsSync(result.filePath)
    );
  });

  // Test 10: Markdown export contains proper formatting
  await test("Markdown export contains proper formatting", () => {
    if (!markdownExportPath) return false;
    const content = fs.readFileSync(markdownExportPath, "utf-8");
    return (
      content.includes("# Continue.dev Log Export") &&
      content.includes("## System Information") &&
      content.includes("## Logs")
    );
  });

  console.log("\n=== Testing Log Filtering ===\n");

  // Test 11: Can export error logs only
  await test("Can export error logs only", async () => {
    const result = await logCollector.exportErrorLogs();
    if (!result.success || !result.filePath) return false;

    const content = fs.readFileSync(result.filePath, "utf-8");
    const data = JSON.parse(content);

    // Clean up
    fs.unlinkSync(result.filePath);

    return data.logs.every((log: any) => log.level === "error");
  });

  // Test 12: Can filter logs by time range
  await test("Can filter logs by time range", async () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const result = await logCollector.exportLogs({
      format: LogExportFormat.JSON,
      fromTimestamp: oneHourAgo,
      toTimestamp: now,
    });

    if (!result.success || !result.filePath) return false;

    const content = fs.readFileSync(result.filePath, "utf-8");
    const data = JSON.parse(content);

    // Clean up
    fs.unlinkSync(result.filePath);

    return data.logs.every(
      (log: any) => log.timestamp >= oneHourAgo && log.timestamp <= now,
    );
  });

  console.log("\n=== Testing Data Sanitization ===\n");

  // Test 13: Sensitive data is sanitized
  await test("Sensitive data is sanitized", async () => {
    logCollector.info(LogSource.SYSTEM, "Test with sensitive data", {
      apiKey: "secret-key-123",
      token: "bearer-token-456",
      normalData: "this should remain",
    });

    const result = await logCollector.exportLogs({
      format: LogExportFormat.JSON,
      sanitize: true,
    });

    if (!result.success || !result.filePath) return false;

    const content = fs.readFileSync(result.filePath, "utf-8");
    const data = JSON.parse(content);

    // Clean up
    fs.unlinkSync(result.filePath);

    // Check that sensitive data is redacted
    const logWithSensitiveData = data.logs.find(
      (log: any) => log.message === "Test with sensitive data",
    );

    return (
      logWithSensitiveData &&
      logWithSensitiveData.data.apiKey === "[REDACTED]" &&
      logWithSensitiveData.data.token === "[REDACTED]" &&
      logWithSensitiveData.data.normalData === "this should remain"
    );
  });

  console.log("\n=== Testing Utility Functions ===\n");

  // Test 14: Can get logs count
  await test("Can get logs count", () => {
    const count = logCollector.getLogsCount();
    return count > 0;
  });

  // Test 15: Can get error logs count
  await test("Can get error logs count", () => {
    const count = logCollector.getErrorLogsCount();
    return count > 0;
  });

  // Test 16: Can clear logs
  await test("Can clear logs", () => {
    logCollector.clearLogs();
    return logCollector.getLogsCount() === 1; // Only the "logs cleared" message
  });

  // Cleanup test files
  console.log("\n=== Cleaning Up ===\n");

  const cleanupFiles = [
    jsonExportPath,
    textExportPath,
    markdownExportPath,
  ].filter((p) => p && fs.existsSync(p));

  for (const file of cleanupFiles) {
    try {
      fs.unlinkSync(file!);
      console.log(`🗑️  Deleted: ${path.basename(file!)}`);
    } catch (error) {
      console.error(`Failed to delete ${file}:`, error);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Total:  ${totalTests}`);
  console.log("=".repeat(60));

  if (passedTests === totalTests) {
    console.log("\n🎉 All log export tests passed!");
    console.log("\n✅ Log Export Features:");
    console.log("   - Log collection (debug, info, warn, error) ✅");
    console.log("   - Export formats (JSON, text, markdown) ✅");
    console.log("   - Log filtering (errors only, time range) ✅");
    console.log("   - Data sanitization ✅");
    console.log("   - System information ✅");
    console.log("\n🚀 Log export system is ready!");
    console.log("\n📝 Usage:");
    console.log(
      "   import { exportLogs, exportErrorLogs } from './LogCollector';",
    );
    console.log("   const result = await exportLogs({ format: 'json' });");
    console.log(`   console.log('Logs exported to:', result.filePath);`);
  } else {
    console.log("\n❌ Some tests failed. Please check the errors above.");
  }
}

// Run tests
runTests().catch(console.error);
