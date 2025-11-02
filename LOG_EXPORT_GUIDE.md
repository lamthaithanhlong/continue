# Log Export Feature - User Guide

## 📚 Overview

Tính năng **Log Export** cho phép bạn tải logs về máy để debug và troubleshoot. Khi gặp lỗi hoặc vấn đề, bạn có thể export logs và gửi cho AI để phân tích.

---

## 🎯 Tính Năng

### 1. **Export Formats**

- **JSON**: Structured data, dễ parse
- **Text**: Human-readable, dễ đọc
- **Markdown**: Formatted, có syntax highlighting

### 2. **Log Types**

- **Debug logs**: Chi tiết debug information
- **Info logs**: General information
- **Warning logs**: Warnings và potential issues
- **Error logs**: Errors và exceptions

### 3. **Log Sources**

- **Retrieval logs**: Context retrieval operations
- **Memory logs**: Memory system operations
- **Error logs**: Uncaught errors và exceptions
- **Performance logs**: Performance metrics
- **System logs**: System information

### 4. **Features**

- ✅ Multiple export formats (JSON, text, markdown)
- ✅ Filter by log level (errors only, warnings, etc.)
- ✅ Filter by time range
- ✅ Automatic data sanitization (removes API keys, tokens)
- ✅ Include system information
- ✅ Auto-export on error (optional)
- ✅ Periodic auto-export (optional)

---

## 🚀 Quick Start

### Cách 1: Export Logs Manually (Programmatic)

```typescript
import { exportLogs, exportErrorLogs } from "./LogCollector";

// Export all logs as JSON
const result = await exportLogs({
  format: "json",
  includeSystemInfo: true,
});

console.log("Logs exported to:", result.filePath);
// Output: Logs exported to: ~/.continue/logs/continue-logs-2025-11-02T12-30-45-123Z.json

// Export only error logs
const errorResult = await exportErrorLogs();
console.log("Error logs exported to:", errorResult.filePath);
```

### Cách 2: Export Logs via VS Code Command (Future)

```
1. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Type "Continue: Export Logs"
3. Select export format (JSON, Text, Markdown)
4. Logs will be saved to ~/.continue/logs/
5. Notification will show file path
```

---

## 📖 API Reference

### `exportLogs(options?)`

Export logs với custom options.

**Parameters**:

```typescript
interface LogExportOptions {
  // Output file path (optional, auto-generated if not provided)
  outputPath?: string;

  // Export format (default: JSON)
  format?: "json" | "text" | "markdown";

  // Include system info (default: true)
  includeSystemInfo?: boolean;

  // Include retrieval logs (default: true)
  includeRetrievalLogs?: boolean;

  // Include memory logs (default: true)
  includeMemoryLogs?: boolean;

  // Export only errors (default: false)
  errorsOnly?: boolean;

  // Time range filter
  fromTimestamp?: number;
  toTimestamp?: number;

  // Sanitize sensitive data (default: true)
  sanitize?: boolean;

  // Maximum log entries (default: unlimited)
  maxEntries?: number;
}
```

**Returns**:

```typescript
interface LogExportResult {
  success: boolean;
  filePath?: string; // Path to exported file
  fileSize?: number; // File size in bytes
  entriesCount: number; // Number of log entries
  error?: string; // Error message if failed
}
```

**Examples**:

```typescript
// Export all logs as JSON
const result = await exportLogs();

// Export as text format
const result = await exportLogs({ format: "text" });

// Export as markdown
const result = await exportLogs({ format: "markdown" });

// Export only errors
const result = await exportLogs({ errorsOnly: true });

// Export logs from last hour
const oneHourAgo = Date.now() - 60 * 60 * 1000;
const result = await exportLogs({
  fromTimestamp: oneHourAgo,
  toTimestamp: Date.now(),
});

// Export to specific path
const result = await exportLogs({
  outputPath: "/path/to/my-logs.json",
});

// Export without sanitization (be careful!)
const result = await exportLogs({
  sanitize: false,
});
```

### `exportErrorLogs()`

Export only error logs (shortcut).

**Example**:

```typescript
const result = await exportErrorLogs();
console.log("Error logs:", result.filePath);
```

### `LogCollector` Class

Singleton class để collect và export logs.

**Methods**:

```typescript
// Get instance
const collector = LogCollector.getInstance();

// Log messages
collector.debug(LogSource.SYSTEM, "Debug message", { data: "value" });
collector.info(LogSource.RETRIEVAL, "Info message");
collector.warn(LogSource.MEMORY, "Warning message");
collector.error(
  LogSource.ERROR,
  "Error message",
  new Error("Something went wrong"),
);

// Get counts
const totalLogs = collector.getLogsCount();
const errorLogs = collector.getErrorLogsCount();

// Export logs
const result = await collector.exportLogs({ format: "json" });

// Clear logs
collector.clearLogs();
```

---

## 💡 Use Cases

### 1. **Debug Lỗi**

Khi gặp lỗi, export logs và gửi cho AI:

```typescript
// User gặp lỗi
try {
  // Some operation that fails
  await someOperation();
} catch (error) {
  // Log error
  logError(LogSource.ERROR, "Operation failed", error);

  // Export error logs
  const result = await exportErrorLogs();

  console.log("Please send this file for analysis:", result.filePath);
  // Output: Please send this file for analysis: ~/.continue/logs/continue-logs-2025-11-02T12-30-45-123Z.json
}
```

### 2. **Performance Analysis**

Export logs để analyze performance:

```typescript
// Export logs with performance data
const result = await exportLogs({
  format: "json",
  includeSystemInfo: true,
});

// Analyze the exported file
const logs = JSON.parse(fs.readFileSync(result.filePath, "utf-8"));
const slowOperations = logs.logs.filter((log) => log.data?.durationMs > 1000);

console.log("Slow operations:", slowOperations);
```

### 3. **Periodic Backup**

Auto-export logs periodically:

```typescript
// Configure auto-export every hour
const collector = LogCollector.getInstance({
  autoExportInterval: 60 * 60 * 1000, // 1 hour
});

// Logs will be automatically exported every hour
```

### 4. **Error Monitoring**

Auto-export on error:

```typescript
// Configure auto-export on error
const collector = LogCollector.getInstance({
  autoExportOnError: true,
});

// When an error occurs, logs are automatically exported
logError(
  LogSource.ERROR,
  "Critical error",
  new Error("Something bad happened"),
);
// Logs automatically exported to ~/.continue/logs/
```

---

## 📊 Export Formats

### JSON Format

```json
{
  "exportedAt": "2025-11-02T12:30:45.123Z",
  "entriesCount": 42,
  "systemInfo": {
    "platform": "darwin",
    "arch": "arm64",
    "nodeVersion": "v18.17.0",
    "continueVersion": "0.9.0",
    "workspacePath": "/Users/user/project",
    "timestamp": 1730556645123
  },
  "logs": [
    {
      "timestamp": 1730556645000,
      "level": "error",
      "source": "retrieval",
      "message": "Failed to retrieve context",
      "data": {
        "query": "implement authentication",
        "error": "Timeout"
      },
      "error": {
        "message": "Request timeout",
        "stack": "Error: Request timeout\n    at ...",
        "code": "ETIMEDOUT"
      }
    }
  ]
}
```

### Text Format

```
================================================================================
Continue.dev Log Export
================================================================================

System Information:
--------------------------------------------------------------------------------
Platform: darwin
Architecture: arm64
Node Version: v18.17.0
Continue Version: 0.9.0
Workspace: /Users/user/project
Exported At: 2025-11-02T12:30:45.123Z

Logs:
--------------------------------------------------------------------------------

[2025-11-02T12:30:45.000Z] [ERROR] [retrieval]
Failed to retrieve context
Data: {
  "query": "implement authentication",
  "error": "Timeout"
}
Error: Request timeout
Stack:
Error: Request timeout
    at ...
```

### Markdown Format

````markdown
# Continue.dev Log Export

## System Information

- **Platform**: darwin
- **Architecture**: arm64
- **Node Version**: v18.17.0
- **Continue Version**: 0.9.0
- **Workspace**: /Users/user/project
- **Exported At**: 2025-11-02T12:30:45.123Z

## Logs

Total Entries: 42

### ❌ retrieval

**Time**: 2025-11-02T12:30:45.000Z  
**Level**: ERROR  
**Message**: Failed to retrieve context

**Data**:

```json
{
  "query": "implement authentication",
  "error": "Timeout"
}
```
````

**Error**: Request timeout

**Stack Trace**:

```
Error: Request timeout
    at ...
```

---

````

---

## 🔒 Data Sanitization

Logs tự động sanitize sensitive data trước khi export:

**Sensitive keys được redact**:
- `apiKey`, `api_key`
- `token`
- `password`
- `secret`
- `authorization`, `auth`

**Example**:

```typescript
// Original log
logInfo(LogSource.SYSTEM, 'API call', {
  apiKey: 'sk-1234567890',
  token: 'bearer-token-abc',
  userId: '12345',
  data: 'normal data',
});

// Exported log (sanitized)
{
  "apiKey": "[REDACTED]",
  "token": "[REDACTED]",
  "userId": "12345",
  "data": "normal data"
}
````

**Disable sanitization** (not recommended):

```typescript
const result = await exportLogs({ sanitize: false });
```

---

## 📝 File Locations

Logs được export vào:

```
~/.continue/logs/continue-logs-<timestamp>.<format>
```

**Examples**:

- `~/.continue/logs/continue-logs-2025-11-02T12-30-45-123Z.json`
- `~/.continue/logs/continue-logs-2025-11-02T12-30-45-123Z.text`
- `~/.continue/logs/continue-logs-2025-11-02T12-30-45-123Z.markdown`

---

## 🧪 Testing

Run tests:

```bash
cd core
npx tsx context/retrieval/test-log-export.ts
```

Expected output:

```
🧪 Log Export Test Suite

=== Testing Log Collection ===
✅ Can log debug message
✅ Can log info message
✅ Can log warning message
✅ Can log error message

=== Testing Log Export ===
✅ Can export logs as JSON
✅ JSON export contains valid data
✅ Can export logs as text
✅ Text export contains readable content
✅ Can export logs as markdown
✅ Markdown export contains proper formatting

...

🎉 All log export tests passed!
```

---

## 🚀 Integration Example

### With Error Handling

```typescript
import { exportErrorLogs, logError, LogSource } from "./LogCollector";

async function handleError(error: Error) {
  // Log the error
  logError(LogSource.ERROR, "Unhandled error", error);

  // Export error logs
  const result = await exportErrorLogs();

  if (result.success) {
    console.error("Error occurred. Logs exported to:", result.filePath);
    console.error("Please send this file for analysis.");
  }
}

// Setup global error handler
process.on("uncaughtException", handleError);
process.on("unhandledRejection", (reason) => {
  handleError(reason instanceof Error ? reason : new Error(String(reason)));
});
```

---

## 📞 Support

Khi gặp vấn đề:

1. **Export logs**:

   ```typescript
   const result = await exportLogs({ format: "json" });
   ```

2. **Gửi file** cho AI để analyze:

   ```
   File location: ~/.continue/logs/continue-logs-2025-11-02T12-30-45-123Z.json
   ```

3. **AI sẽ đọc và analyze** logs để giúp debug

---

**Version**: 1.0.0  
**Status**: ✅ Ready to Use  
**Last Updated**: 2025-11-02
