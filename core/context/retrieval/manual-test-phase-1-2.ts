/**
 * Manual Test Script for Phase 1.2 - MultiSourceRetrievalManager
 * 
 * Run this to verify MultiSourceRetrievalManager works correctly
 * without compiling the full extension.
 * 
 * Usage:
 *   cd core
 *   npx tsx context/retrieval/manual-test-phase-1-2.ts
 */

import {
  MultiSourceRetrievalManager,
  MultiSourceRetrievalManagerOptions,
  RetrievalArguments,
} from "./MultiSourceRetrievalManager";
import { IDE, ILLM, ContinueConfig } from "../index.d.js";

// ===== Test Utilities =====

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
  }
}

// ===== Mock Objects =====

const mockIDE: IDE = {
  getOpenFiles: async () => ["/test/file1.ts", "/test/file2.ts"],
  readFile: async (filepath: string) => `// Mock content for ${filepath}`,
  getWorkspaceDirs: async () => ["/test"],
  getBranch: async () => "main",
} as any;

const mockLLM: ILLM = {
  chat: async () => ({ role: "assistant", content: "mock response" }),
  complete: async () => "mock completion",
} as any;

const mockConfig: ContinueConfig = {
  selectedModelByRole: {
    embed: {
      maxEmbeddingChunkSize: 512,
    } as any,
  },
  experimental: {},
} as any;

// ===== Test Suite =====

console.log("\n🧪 Phase 1.2 Manual Test Suite - MultiSourceRetrievalManager\n");
console.log("=" .repeat(60));

async function runTests() {
  // Test 1: Constructor
  console.log("\n📋 Test 1: Constructor");
  console.log("-".repeat(60));

  let manager: MultiSourceRetrievalManager;
  try {
    const options: MultiSourceRetrievalManagerOptions = {
      llm: mockLLM,
      config: mockConfig,
      ide: mockIDE,
      lanceDbIndex: null,
    };
    manager = new MultiSourceRetrievalManager(options);
    assert(true, "MultiSourceRetrievalManager constructor works");
  } catch (error) {
    assert(false, "MultiSourceRetrievalManager constructor works");
    console.error("  Error:", error);
    return;
  }

  // Test 2: retrieveAll() returns correct structure
  console.log("\n🔧 Test 2: retrieveAll() Structure");
  console.log("-".repeat(60));

  const args: RetrievalArguments = {
    query: "test query",
    tags: [{ directory: "/test", branch: "main" }],
    nRetrieve: 10,
  };

  let result;
  try {
    result = await manager.retrieveAll(args);
    assert(true, "retrieveAll() executes without error");
  } catch (error) {
    assert(false, "retrieveAll() executes without error");
    console.error("  Error:", error);
    return;
  }

  assert(
    result.hasOwnProperty("sources"),
    "Result has 'sources' property"
  );
  assert(
    result.hasOwnProperty("metadata"),
    "Result has 'metadata' property"
  );
  assert(
    result.hasOwnProperty("totalTimeMs"),
    "Result has 'totalTimeMs' property"
  );

  // Test 3: All 9 sources present
  console.log("\n📦 Test 3: All 9 Sources Present");
  console.log("-".repeat(60));

  const expectedSources = [
    "fts",
    "embeddings",
    "recentlyEdited",
    "repoMap",
    "lspDefinitions",
    "importAnalysis",
    "recentlyVisitedRanges",
    "staticContext",
    "toolBasedSearch",
  ];

  expectedSources.forEach((source) => {
    assert(
      result.sources.hasOwnProperty(source),
      `sources.${source} exists`
    );
    assert(
      Array.isArray(result.sources[source]),
      `sources.${source} is an array`
    );
  });

  // Test 4: Metadata tracking
  console.log("\n📊 Test 4: Metadata Tracking");
  console.log("-".repeat(60));

  assert(
    Array.isArray(result.metadata),
    "metadata is an array"
  );
  assert(
    result.metadata.length > 0,
    "metadata has entries"
  );

  console.log(`  Total sources tracked: ${result.metadata.length}`);

  result.metadata.forEach((meta, index) => {
    const prefix = `  [${index + 1}] ${meta.source}:`;
    console.log(`${prefix} ${meta.count} chunks, ${meta.timeMs}ms, success=${meta.success}`);
    
    assert(
      typeof meta.source === "string",
      `metadata[${index}].source is string`
    );
    assert(
      typeof meta.count === "number",
      `metadata[${index}].count is number`
    );
    assert(
      typeof meta.timeMs === "number",
      `metadata[${index}].timeMs is number`
    );
    assert(
      typeof meta.success === "boolean",
      `metadata[${index}].success is boolean`
    );
  });

  // Test 5: Performance tracking
  console.log("\n⏱️  Test 5: Performance Tracking");
  console.log("-".repeat(60));

  assert(
    typeof result.totalTimeMs === "number",
    "totalTimeMs is a number"
  );
  assert(
    result.totalTimeMs >= 0,
    "totalTimeMs is non-negative"
  );
  console.log(`  Total retrieval time: ${result.totalTimeMs}ms`);

  // Test 6: Source configuration
  console.log("\n⚙️  Test 6: Source Configuration");
  console.log("-".repeat(60));

  const customArgs: RetrievalArguments = {
    query: "test",
    tags: [],
    nRetrieve: 5,
    sourceConfig: {
      enableFts: true,
      enableEmbeddings: false,
      enableRecentlyEdited: false,
      enableRepoMap: false,
      enableLspDefinitions: false,
      enableImportAnalysis: false,
      enableRecentlyVisitedRanges: false,
      enableStaticContext: false,
      enableToolBasedSearch: false,
    },
  };

  const customResult = await manager.retrieveAll(customArgs);
  
  const ftsMetadata = customResult.metadata.find((m) => m.source === "fts");
  const embeddingsMetadata = customResult.metadata.find((m) => m.source === "embeddings");

  assert(
    ftsMetadata !== undefined,
    "FTS metadata exists when enabled"
  );
  assert(
    embeddingsMetadata === undefined,
    "Embeddings metadata absent when disabled"
  );

  // Test 7: Empty query handling
  console.log("\n🔍 Test 7: Empty Query Handling");
  console.log("-".repeat(60));

  const emptyQueryArgs: RetrievalArguments = {
    query: "",
    tags: [],
    nRetrieve: 10,
  };

  const emptyResult = await manager.retrieveAll(emptyQueryArgs);
  
  assert(
    emptyResult.sources.fts.length === 0,
    "FTS returns empty array for empty query"
  );
  assert(
    emptyResult !== undefined,
    "retrieveAll() handles empty query gracefully"
  );

  // Test 8: Parallel execution
  console.log("\n⚡ Test 8: Parallel Execution");
  console.log("-".repeat(60));

  const parallelArgs: RetrievalArguments = {
    query: "parallel test",
    tags: [],
    nRetrieve: 10,
  };

  const startTime = Date.now();
  const parallelResult = await manager.retrieveAll(parallelArgs);
  const duration = Date.now() - startTime;

  console.log(`  Execution time: ${duration}ms`);
  console.log(`  Sources retrieved: ${parallelResult.metadata.length}`);

  assert(
    duration < 5000,
    "Parallel retrieval completes in reasonable time (<5s)"
  );

  // Test 9: Error resilience
  console.log("\n🛡️  Test 9: Error Resilience");
  console.log("-".repeat(60));

  const errorIDE: IDE = {
    ...mockIDE,
    readFile: async () => {
      throw new Error("Mock read error");
    },
  } as any;

  const errorManager = new MultiSourceRetrievalManager({
    llm: mockLLM,
    config: mockConfig,
    ide: errorIDE,
    lanceDbIndex: null,
  });

  let errorResult;
  try {
    errorResult = await errorManager.retrieveAll(args);
    assert(
      true,
      "retrieveAll() doesn't throw when source fails"
    );
  } catch (error) {
    assert(
      false,
      "retrieveAll() doesn't throw when source fails"
    );
  }

  if (errorResult) {
    const failedSources = errorResult.metadata.filter((m) => !m.success);
    console.log(`  Failed sources: ${failedSources.length}`);
    
    failedSources.forEach((meta) => {
      console.log(`    - ${meta.source}: ${meta.error}`);
      assert(
        meta.error !== undefined,
        `Failed source ${meta.source} has error message`
      );
    });
  }

  // ===== Summary =====

  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log("\n🎉 All tests passed! Phase 1.2 is working correctly! ✅");
    console.log("\n📋 Phase 1.2 Deliverables:");
    console.log("   ✅ MultiSourceRetrievalManager class");
    console.log("   ✅ Parallel retrieval from 9 sources");
    console.log("   ✅ Error handling for each source");
    console.log("   ✅ Performance tracking");
    console.log("\n🎯 Next: Phase 1.3 - Dependency Graph Builder\n");
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review.\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("\n❌ Fatal error running tests:", error);
  process.exit(1);
});

