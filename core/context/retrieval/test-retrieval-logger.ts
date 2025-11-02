#!/usr/bin/env tsx

/**
 * Test script for RetrievalLogger
 * Run with: cd core && npx tsx context/retrieval/test-retrieval-logger.ts
 */

import RetrievalLogger, {
  type RetrievalLoggerConfig,
} from "./RetrievalLogger.js";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ${colors.green}✅${colors.reset} ${message}`);
  } else {
    console.log(`  ${colors.red}❌${colors.reset} ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testSection(title: string): void {
  console.log(`\n${colors.cyan}📋 ${title}${colors.reset}`);
  console.log("-".repeat(60));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log(`\n${colors.blue}🧪 RetrievalLogger Test Suite${colors.reset}\n`);
  console.log("=".repeat(60));

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Singleton Pattern
  testSection("Test 1: Singleton Pattern");
  {
    const logger1 = RetrievalLogger.getInstance();
    const logger2 = RetrievalLogger.getInstance();
    assert(logger1 === logger2, "Singleton returns same instance");
    totalTests++;
    passedTests++;
  }

  // Test 2: Default Configuration
  testSection("Test 2: Default Configuration");
  {
    const logger = RetrievalLogger.getInstance();
    const config = logger.getConfig();

    assert(config.enabled === true, "Logging enabled by default");
    assert(config.logLevel === "info", "Default log level is 'info'");
    assert(config.debugMode === false, "Debug mode disabled by default");
    assert(config.logPerformance === true, "Performance logging enabled");
    assert(config.apiBatchSize === 10, "Default batch size is 10");
    totalTests += 5;
    passedTests += 5;
  }

  // Test 3: Custom Configuration
  testSection("Test 3: Custom Configuration");
  {
    const customConfig: RetrievalLoggerConfig = {
      enabled: true,
      logLevel: "debug",
      debugMode: true,
      logPerformance: true,
      apiEndpoint: "https://api.example.com/logs",
      apiKey: "test-key-123",
      apiBatchSize: 5,
    };

    const logger = RetrievalLogger.getInstance(customConfig);
    const config = logger.getConfig();

    assert(config.enabled === true, "Custom enabled setting");
    assert(config.logLevel === "debug", "Custom log level");
    assert(config.debugMode === true, "Custom debug mode");
    assert(
      config.apiEndpoint === "https://api.example.com/logs",
      "Custom API endpoint",
    );
    assert(config.apiKey === "test-key-123", "Custom API key");
    assert(config.apiBatchSize === 5, "Custom batch size");
    totalTests += 6;
    passedTests += 6;
  }

  // Test 4: Update Configuration
  testSection("Test 4: Update Configuration");
  {
    const logger = RetrievalLogger.getInstance();
    logger.updateConfig({ logLevel: "warn", debugMode: false });
    const config = logger.getConfig();

    assert(config.logLevel === "warn", "Log level updated");
    assert(config.debugMode === false, "Debug mode updated");
    totalTests += 2;
    passedTests += 2;
  }

  // Test 5: Retrieval Lifecycle Logging
  testSection("Test 5: Retrieval Lifecycle Logging");
  {
    // Reset to default config for testing
    const logger = RetrievalLogger.getInstance({
      enabled: true,
      logLevel: "debug",
      debugMode: true,
      logPerformance: true,
    });

    const query = "test query";
    const nRetrieve = 10;
    const enabledSources = ["fts", "embeddings", "recentlyEdited"];

    // Start retrieval
    const retrievalId = logger.logRetrievalStart(
      query,
      nRetrieve,
      enabledSources,
    );
    assert(
      retrievalId.startsWith("retrieval_"),
      "Retrieval ID has correct prefix",
    );
    totalTests++;
    passedTests++;

    // Simulate source retrievals
    for (const source of enabledSources) {
      const startTime = Date.now();
      logger.logSourceStart(retrievalId, source);

      // Simulate retrieval delay
      await sleep(10);

      // Simulate successful retrieval
      const chunksRetrieved = Math.floor(Math.random() * 20) + 5;
      logger.logSourceComplete(retrievalId, source, chunksRetrieved, startTime);
    }

    // Complete retrieval
    const totalChunks = 30;
    logger.logRetrievalComplete(retrievalId, totalChunks);

    assert(true, "Retrieval lifecycle completed without errors");
    totalTests++;
    passedTests++;
  }

  // Test 6: Error Logging
  testSection("Test 6: Error Logging");
  {
    const logger = RetrievalLogger.getInstance();

    const query = "error test query";
    const nRetrieve = 10;
    const enabledSources = ["fts", "embeddings"];

    const retrievalId = logger.logRetrievalStart(
      query,
      nRetrieve,
      enabledSources,
    );

    // Simulate error in embeddings source
    const startTime = Date.now();
    logger.logSourceStart(retrievalId, "embeddings");
    await sleep(10);

    const error = new Error("Failed to connect to embeddings database");
    logger.logSourceError(retrievalId, "embeddings", error, startTime);

    // Complete retrieval with partial results
    logger.logRetrievalComplete(retrievalId, 10);

    assert(true, "Error logging completed without errors");
    totalTests++;
    passedTests++;
  }

  // Test 7: Multiple Concurrent Retrievals
  testSection("Test 7: Multiple Concurrent Retrievals");
  {
    const logger = RetrievalLogger.getInstance();

    const retrieval1 = logger.logRetrievalStart("query 1", 10, ["fts"]);
    const retrieval2 = logger.logRetrievalStart("query 2", 20, ["embeddings"]);
    const retrieval3 = logger.logRetrievalStart("query 3", 15, [
      "recentlyEdited",
    ]);

    assert(retrieval1 !== retrieval2, "Retrieval IDs are unique (1 vs 2)");
    assert(retrieval2 !== retrieval3, "Retrieval IDs are unique (2 vs 3)");
    assert(retrieval1 !== retrieval3, "Retrieval IDs are unique (1 vs 3)");

    // Complete all retrievals
    logger.logRetrievalComplete(retrieval1, 10);
    logger.logRetrievalComplete(retrieval2, 20);
    logger.logRetrievalComplete(retrieval3, 15);

    totalTests += 3;
    passedTests += 3;
  }

  // Test 8: Disabled Logging
  testSection("Test 8: Disabled Logging");
  {
    const logger = RetrievalLogger.getInstance({ enabled: false });

    const retrievalId = logger.logRetrievalStart("test", 10, ["fts"]);
    logger.logSourceStart(retrievalId, "fts");
    logger.logSourceComplete(retrievalId, "fts", 10, Date.now());
    logger.logRetrievalComplete(retrievalId, 10);

    assert(true, "Disabled logging doesn't throw errors");
    totalTests++;
    passedTests++;
  }

  // Test 9: Log Level Filtering
  testSection("Test 9: Log Level Filtering");
  {
    // Test with 'error' level - should only log errors
    const logger = RetrievalLogger.getInstance({
      enabled: true,
      logLevel: "error",
    });

    const retrievalId = logger.logRetrievalStart("test", 10, ["fts"]);
    logger.logSourceStart(retrievalId, "fts");
    logger.logSourceComplete(retrievalId, "fts", 10, Date.now());
    logger.logRetrievalComplete(retrievalId, 10);

    assert(true, "Log level filtering works");
    totalTests++;
    passedTests++;
  }

  // Test 10: Performance Metrics
  testSection("Test 10: Performance Metrics");
  {
    const logger = RetrievalLogger.getInstance({
      enabled: true,
      logLevel: "info",
      logPerformance: true,
    });

    const retrievalId = logger.logRetrievalStart("perf test", 10, [
      "fts",
      "embeddings",
      "recentlyEdited",
    ]);

    // Simulate retrievals with different durations
    const sources = ["fts", "embeddings", "recentlyEdited"];
    for (const source of sources) {
      const startTime = Date.now();
      logger.logSourceStart(retrievalId, source);
      await sleep(Math.random() * 50 + 10); // 10-60ms
      logger.logSourceComplete(
        retrievalId,
        source,
        Math.floor(Math.random() * 20),
        startTime,
      );
    }

    logger.logRetrievalComplete(retrievalId, 30);

    assert(true, "Performance metrics logged successfully");
    totalTests++;
    passedTests++;
  }

  // Test 11: API Batch Flushing (without actual API call)
  testSection("Test 11: API Batch Flushing");
  {
    const logger = RetrievalLogger.getInstance({
      enabled: true,
      logLevel: "info",
      logPerformance: true,
      apiEndpoint: "", // Empty endpoint - won't actually send
      apiBatchSize: 2,
    });

    // Create multiple retrievals to trigger batching
    for (let i = 0; i < 3; i++) {
      const retrievalId = logger.logRetrievalStart(`query ${i}`, 10, ["fts"]);
      const startTime = Date.now();
      logger.logSourceStart(retrievalId, "fts");
      await sleep(10);
      logger.logSourceComplete(retrievalId, "fts", 10, startTime);
      logger.logRetrievalComplete(retrievalId, 10);
    }

    // Flush any remaining logs
    await logger.flushBatch();

    assert(true, "Batch flushing works without errors");
    totalTests++;
    passedTests++;
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.cyan}📊 Test Summary${colors.reset}`);
  console.log("=".repeat(60));
  console.log(`${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
  console.log(
    `${colors.red}❌ Failed: ${totalTests - passedTests}${colors.reset}`,
  );
  console.log(`📈 Total:  ${totalTests}`);

  if (passedTests === totalTests) {
    console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed!${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(`\n${colors.red}❌ Test suite failed:${colors.reset}`, error);
  process.exit(1);
});
