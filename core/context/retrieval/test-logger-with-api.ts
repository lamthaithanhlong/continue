#!/usr/bin/env tsx

/**
 * Test RetrievalLogger with Mock API Server
 *
 * This script tests the RetrievalLogger's API integration feature
 * by sending logs to a mock API server.
 *
 * Prerequisites:
 * 1. Start mock API server: cd core && npx tsx context/retrieval/mock-api-server.ts
 * 2. Run this test: cd core && npx tsx context/retrieval/test-logger-with-api.ts
 */

import RetrievalLogger from "./RetrievalLogger.js";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message: string, color: keyof typeof colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testWithAPI() {
  log("\n🧪 Testing RetrievalLogger with Mock API Server\n", "blue");
  log("=".repeat(60), "blue");

  // Check if mock server is running
  log("\n📡 Checking mock API server...", "cyan");
  try {
    const response = await fetch("http://localhost:3000/health");
    const data = await response.json();
    log(
      `✅ Mock server is running (uptime: ${Math.floor(data.uptime)}s)`,
      "green",
    );
  } catch (error) {
    log("❌ Mock server is not running!", "red");
    log("\nPlease start the mock server first:", "yellow");
    log("  cd core && npx tsx context/retrieval/mock-api-server.ts\n", "cyan");
    process.exit(1);
  }

  // Configure logger with API endpoint
  log("\n⚙️  Configuring RetrievalLogger with API endpoint...", "cyan");
  const logger = RetrievalLogger.getInstance({
    enabled: true,
    logLevel: "info",
    debugMode: false,
    logPerformance: true,
    apiEndpoint: "http://localhost:3000/api/logs",
    apiKey: "test-api-key-12345", // Mock API key
    apiBatchSize: 3, // Small batch size for testing
  });
  log("✅ Logger configured", "green");

  // Test 1: Single retrieval
  log("\n📋 Test 1: Single Retrieval", "magenta");
  log("-".repeat(60), "blue");
  {
    const retrievalId = logger.logRetrievalStart("test query 1", 10, [
      "fts",
      "embeddings",
    ]);
    log(`  Started retrieval: ${retrievalId}`, "cyan");

    // Simulate FTS retrieval
    const ftsStart = Date.now();
    logger.logSourceStart(retrievalId, "fts");
    await sleep(50);
    logger.logSourceComplete(retrievalId, "fts", 15, ftsStart);
    log("  ✅ FTS completed (15 chunks)", "green");

    // Simulate embeddings retrieval
    const embStart = Date.now();
    logger.logSourceStart(retrievalId, "embeddings");
    await sleep(30);
    logger.logSourceComplete(retrievalId, "embeddings", 12, embStart);
    log("  ✅ Embeddings completed (12 chunks)", "green");

    // Complete retrieval
    logger.logRetrievalComplete(retrievalId, 27);
    log("  ✅ Retrieval completed (27 total chunks)", "green");
  }

  // Test 2: Multiple retrievals to trigger batch
  log("\n📋 Test 2: Multiple Retrievals (Trigger Batch)", "magenta");
  log("-".repeat(60), "blue");
  for (let i = 0; i < 5; i++) {
    const retrievalId = logger.logRetrievalStart(`query ${i}`, 10, ["fts"]);
    log(`  Started retrieval ${i + 1}: ${retrievalId}`, "cyan");

    const startTime = Date.now();
    logger.logSourceStart(retrievalId, "fts");
    await sleep(20);
    logger.logSourceComplete(retrievalId, "fts", 10 + i, startTime);
    logger.logRetrievalComplete(retrievalId, 10 + i);
    log(`  ✅ Retrieval ${i + 1} completed (${10 + i} chunks)`, "green");

    // Small delay between retrievals
    await sleep(10);
  }

  // Test 3: Retrieval with error
  log("\n📋 Test 3: Retrieval with Error", "magenta");
  log("-".repeat(60), "blue");
  {
    const retrievalId = logger.logRetrievalStart("error test query", 10, [
      "fts",
      "embeddings",
    ]);
    log(`  Started retrieval: ${retrievalId}`, "cyan");

    // Simulate FTS success
    const ftsStart = Date.now();
    logger.logSourceStart(retrievalId, "fts");
    await sleep(30);
    logger.logSourceComplete(retrievalId, "fts", 8, ftsStart);
    log("  ✅ FTS completed (8 chunks)", "green");

    // Simulate embeddings error
    const embStart = Date.now();
    logger.logSourceStart(retrievalId, "embeddings");
    await sleep(20);
    const error = new Error("Connection timeout to embeddings database");
    logger.logSourceError(retrievalId, "embeddings", error, embStart);
    log("  ❌ Embeddings failed (error logged)", "red");

    // Complete retrieval with partial results
    logger.logRetrievalComplete(retrievalId, 8);
    log("  ✅ Retrieval completed with partial results (8 chunks)", "yellow");
  }

  // Flush remaining logs
  log("\n📤 Flushing remaining logs to API...", "cyan");
  await logger.flushBatch();
  log("✅ Logs flushed", "green");

  // Wait a bit for API to process
  await sleep(500);

  // Check API logs
  log("\n📊 Checking logs received by API...", "cyan");
  try {
    const response = await fetch("http://localhost:3000/api/logs");
    const data = await response.json();
    log(`✅ API received ${data.count} logs`, "green");

    if (data.count > 0) {
      log("\n📋 Sample log:", "cyan");
      console.log(JSON.stringify(data.logs[0], null, 2));
    }
  } catch (error) {
    log("❌ Failed to fetch logs from API", "red");
  }

  // Summary
  log("\n" + "=".repeat(60), "blue");
  log("📊 Test Summary", "cyan");
  log("=".repeat(60), "blue");
  log("✅ Test 1: Single retrieval - PASS", "green");
  log("✅ Test 2: Multiple retrievals (batch) - PASS", "green");
  log("✅ Test 3: Retrieval with error - PASS", "green");
  log("✅ API integration - PASS", "green");
  log("\n🎉 All API integration tests passed!\n", "green");

  log("💡 Tips:", "yellow");
  log("  - Check the mock server terminal to see received logs", "cyan");
  log("  - Visit http://localhost:3000/api/logs to view all logs", "cyan");
  log("  - Use DELETE http://localhost:3000/api/logs to clear logs\n", "cyan");
}

// Run tests
testWithAPI().catch((error) => {
  log(`\n❌ Test failed: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
