# RetrievalLogger - Logging & Monitoring for Context Retrieval

## Overview

`RetrievalLogger` is a comprehensive logging and monitoring system for the Multi-Source Retrieval Manager. It provides:

- **Structured logging** for all retrieval operations
- **Performance tracking** for each context source
- **Error tracking** with detailed context
- **Debug mode** for detailed troubleshooting
- **Optional API integration** for remote monitoring
- **Batch processing** for efficient API calls

## Features

### 1. Structured Logging

All retrieval operations are logged with structured data:

```typescript
[@continuedev] info: [Retrieval] Started retrieval retrieval_1762113266640_wq7hqq4xu {
  "query": "test query",
  "nRetrieve": 10,
  "enabledSources": ["fts", "embeddings", "recentlyEdited"]
}
```

### 2. Performance Metrics

Automatic tracking of:

- Total retrieval duration
- Per-source retrieval duration
- Number of chunks retrieved per source
- Success/failure status

```typescript
[@continuedev] info: [Retrieval] Performance metrics {
  "retrievalId": "retrieval_1762113266640_wq7hqq4xu",
  "totalDurationMs": 35,
  "totalChunks": 30,
  "sourceMetrics": [
    {
      "source": "fts",
      "durationMs": 12,
      "chunksRetrieved": 24,
      "success": true
    }
  ]
}
```

### 3. Error Tracking

Detailed error logging with context:

```typescript
[@continuedev] error: Failed to connect to embeddings database {
  "retrievalId": "retrieval_1762113266675_e4yuas5oy",
  "source": "embeddings",
  "durationMs": 12
}
```

### 4. Debug Mode

Enable detailed debug logging:

```typescript
const logger = RetrievalLogger.getInstance({
  debugMode: true,
  logLevel: "debug",
});
```

### 5. Optional API Integration

Send metrics to a remote endpoint:

```typescript
const logger = RetrievalLogger.getInstance({
  apiEndpoint: "https://api.example.com/retrieval-logs",
  apiKey: "your-api-key",
  apiBatchSize: 10, // Send every 10 logs
});
```

## Usage

### Basic Usage

```typescript
import RetrievalLogger from "./RetrievalLogger.js";

// Get logger instance (singleton)
const logger = RetrievalLogger.getInstance();

// Start retrieval
const retrievalId = logger.logRetrievalStart(
  "search query",
  10, // nRetrieve
  ["fts", "embeddings"], // enabled sources
);

// Log source operations
const startTime = Date.now();
logger.logSourceStart(retrievalId, "fts");

// ... perform retrieval ...

logger.logSourceComplete(retrievalId, "fts", 15, startTime); // 15 chunks

// Complete retrieval
logger.logRetrievalComplete(retrievalId, 30); // 30 total chunks
```

### With Configuration

```typescript
import RetrievalLogger, {
  type RetrievalLoggerConfig,
} from "./RetrievalLogger.js";

const config: RetrievalLoggerConfig = {
  enabled: true,
  logLevel: "info", // "debug" | "info" | "warn" | "error"
  debugMode: false,
  logPerformance: true,
  apiEndpoint: "https://api.example.com/logs",
  apiKey: "your-api-key",
  apiBatchSize: 10,
};

const logger = RetrievalLogger.getInstance(config);
```

### Error Logging

```typescript
try {
  // ... retrieval operation ...
} catch (error) {
  if (error instanceof Error) {
    logger.logSourceError(retrievalId, "embeddings", error, startTime);
  }
}
```

### Update Configuration

```typescript
// Update configuration at runtime
logger.updateConfig({
  logLevel: "debug",
  debugMode: true,
});
```

### Manual Batch Flush

```typescript
// Flush pending logs to API
await logger.flushBatch();
```

## Integration with MultiSourceRetrievalManager

The logger is automatically integrated into `MultiSourceRetrievalManager`:

```typescript
import { MultiSourceRetrievalManager } from "./MultiSourceRetrievalManager.js";
import type { RetrievalLoggerConfig } from "./RetrievalLogger.js";

const loggerConfig: RetrievalLoggerConfig = {
  enabled: true,
  logLevel: "info",
  logPerformance: true,
};

const manager = new MultiSourceRetrievalManager({
  llm,
  config,
  ide,
  loggerConfig, // Pass logger config
});

// Logging happens automatically
const result = await manager.retrieveAll({
  query: "search query",
  tags: [],
  nRetrieve: 10,
});
```

## Configuration Options

| Option           | Type                                     | Default  | Description                              |
| ---------------- | ---------------------------------------- | -------- | ---------------------------------------- |
| `enabled`        | `boolean`                                | `true`   | Enable/disable logging                   |
| `logLevel`       | `"debug" \| "info" \| "warn" \| "error"` | `"info"` | Minimum log level                        |
| `debugMode`      | `boolean`                                | `false`  | Enable detailed debug logging            |
| `logPerformance` | `boolean`                                | `true`   | Enable performance metrics logging       |
| `apiEndpoint`    | `string`                                 | `""`     | Optional API endpoint for remote logging |
| `apiKey`         | `string`                                 | `""`     | Optional API key for authentication      |
| `apiBatchSize`   | `number`                                 | `10`     | Number of logs to batch before sending   |

## Log Levels

Logs are filtered based on the configured log level:

- **debug**: All logs (most verbose)
- **info**: Info, warn, and error logs
- **warn**: Warn and error logs
- **error**: Only error logs (least verbose)

## Performance Metrics

The logger automatically tracks:

1. **Retrieval-level metrics**:

   - Total duration
   - Total chunks retrieved
   - Query string
   - Enabled sources

2. **Source-level metrics**:
   - Per-source duration
   - Per-source chunk count
   - Success/failure status
   - Error messages (if any)

## API Integration

### Endpoint Format

The logger sends batched logs to the configured API endpoint via POST:

```json
{
  "logs": [
    {
      "retrievalId": "retrieval_1762113266640_wq7hqq4xu",
      "totalDurationMs": 35,
      "totalChunks": 30,
      "sourceMetrics": [...],
      "query": "test query",
      "timestamp": 1762113266675
    }
  ]
}
```

### Authentication

If `apiKey` is provided, it's sent as a Bearer token:

```
Authorization: Bearer your-api-key
```

### Error Handling

- Failed API requests are logged but don't fail the retrieval
- Failed logs are re-added to the batch for retry
- Batch size controls memory usage

## Testing

Run the comprehensive test suite:

```bash
cd core && npx tsx context/retrieval/test-retrieval-logger.ts
```

**Test coverage**:

- ✅ Singleton pattern
- ✅ Default configuration
- ✅ Custom configuration
- ✅ Configuration updates
- ✅ Retrieval lifecycle logging
- ✅ Error logging
- ✅ Multiple concurrent retrievals
- ✅ Disabled logging
- ✅ Log level filtering
- ✅ Performance metrics
- ✅ API batch flushing

**Result**: 24/24 tests pass ✅

## Examples

### Example 1: Basic Console Logging

```typescript
const logger = RetrievalLogger.getInstance({
  enabled: true,
  logLevel: "info",
});

const retrievalId = logger.logRetrievalStart("test", 10, ["fts"]);
// ... retrieval ...
logger.logRetrievalComplete(retrievalId, 15);
```

### Example 2: Debug Mode

```typescript
const logger = RetrievalLogger.getInstance({
  enabled: true,
  logLevel: "debug",
  debugMode: true,
});

// Logs detailed context for every operation
```

### Example 3: Remote Monitoring

```typescript
const logger = RetrievalLogger.getInstance({
  enabled: true,
  logLevel: "info",
  logPerformance: true,
  apiEndpoint: "https://monitoring.example.com/api/logs",
  apiKey: process.env.MONITORING_API_KEY,
  apiBatchSize: 20,
});

// Logs are automatically sent to remote endpoint
```

### Example 4: Disable Logging

```typescript
const logger = RetrievalLogger.getInstance({
  enabled: false,
});

// No logs are generated (zero overhead)
```

## Best Practices

1. **Use singleton pattern**: Always use `getInstance()` to get the logger
2. **Configure once**: Set configuration at application startup
3. **Enable in production**: Logging has minimal overhead
4. **Use appropriate log levels**:
   - `debug` for development
   - `info` for production
   - `error` for critical issues only
5. **Monitor performance metrics**: Track retrieval performance over time
6. **Batch API calls**: Use appropriate `apiBatchSize` for your use case
7. **Flush on shutdown**: Call `flushBatch()` before application exit

## Troubleshooting

### No logs appearing

Check that logging is enabled:

```typescript
const config = logger.getConfig();
console.log(config.enabled); // Should be true
```

### Too many logs

Increase log level:

```typescript
logger.updateConfig({ logLevel: "warn" });
```

### API calls failing

Check endpoint and authentication:

```typescript
const config = logger.getConfig();
console.log(config.apiEndpoint);
console.log(config.apiKey);
```

## Future Enhancements

- [ ] Support for custom log formatters
- [ ] Integration with Sentry for error tracking
- [ ] Support for multiple API endpoints
- [ ] Configurable retry logic for failed API calls
- [ ] Log rotation for local file storage
- [ ] Metrics aggregation and reporting

## Related Files

- `RetrievalLogger.ts` - Main logger implementation
- `MultiSourceRetrievalManager.ts` - Integration with retrieval manager
- `test-retrieval-logger.ts` - Comprehensive test suite
- `RETRIEVAL_LOGGER_README.md` - This documentation

## License

Part of Continue.dev - MIT License
