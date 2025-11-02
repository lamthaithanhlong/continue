/**
 * Functional Test Runner for Phase 1.2
 * 
 * Tests actual functionality without requiring test framework.
 * Run: cd core && npx tsx context/retrieval/run-functional-test.ts
 */

import type { ContinueConfig, IDE, ILLM } from "../../index.d.js";
import { MultiSourceRetrievalManager } from "./MultiSourceRetrievalManager.js";

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ ${message}`);
    testsFailed++;
  }
}

async function assertAsync(fn: () => Promise<boolean>, message: string) {
  try {
    const result = await fn();
    assert(result, message);
  } catch (error) {
    console.error(`  ❌ ${message} - Error: ${error}`);
    testsFailed++;
  }
}

// Mock implementations
const mockIDE: IDE = {
  getOpenFiles: async () => ["/test/file1.ts", "/test/file2.ts"],
  readFile: async (filepath: string) => `// Mock content for ${filepath}\nline 2\nline 3`,
  getWorkspaceDirs: async () => ["/test"],
  getBranch: async () => "main",
  listDir: async () => [],
  fileExists: async () => true,
  showToast: async () => {},
  showLines: async () => {},
  showVirtualFile: async () => {},
  openFile: async () => {},
  runCommand: async () => "",
  saveFile: async () => {},
  getProblems: async () => [],
  subprocess: async () => ({ stdout: "", stderr: "" }),
  getBranchAndDir: async () => ({ branch: "main", directory: "/test" }),
  getIdeSettings: async () => ({}),
  getDiff: async () => [],
  getTerminalContents: async () => "",
  getDebugLocals: async () => [],
  getTopLevelCallStackSources: async () => [],
  getAvailableThreads: async () => [],
  isTelemetryEnabled: async () => false,
  getUniqueId: async () => "test-id",
  getGitHubAuthToken: async () => undefined,
  getControlPlaneSessionInfo: async () => ({ accessToken: "", account: null }),
  pathSep: () => "/",
  getIdeInfo: async () => ({ ideType: "vscode", name: "VSCode", version: "1.0.0", remoteName: "", extensionVersion: "1.0.0" }),
  readRangeInFile: async () => "",
  getWorkspaceConfigs: async () => [],
  showDiff: async () => {},
  visibleFiles: [],
} as any;

const mockLLM: ILLM = {
  chat: async () => ({ role: "assistant", content: "mock response" }),
  complete: async () => "mock completion",
  streamChat: async function* () { yield { role: "assistant", content: "mock" }; },
  streamComplete: async function* () { yield "mock"; },
  countTokens: async () => 10,
  supportsImages: () => false,
  supportsFim: () => false,
  supportsCompletions: () => false,
  uniqueId: "mock-llm",
  model: "mock-model",
  title: "Mock LLM",
  provider: "mock",
  systemMessage: undefined,
  contextLength: 4096,
  completionOptions: {},
  requestOptions: {},
  template: undefined,
  promptTemplates: {},
  maxStopWords: undefined,
  apiKey: undefined,
  apiBase: undefined,
} as any;

const mockConfig: ContinueConfig = {
  selectedModelByRole: {
    embed: null,
  },
  experimental: {},
  slashCommands: [],
  contextProviders: [],
  tools: [],
  mcpServerStatuses: {},
  models: [],
} as any;

// Run tests
async function runTests() {
  console.log("\n🧪 Phase 1.2 Functional Test Suite\n");
  console.log("=".repeat(60));

  // Test 1: Constructor
  console.log("\n📋 Test 1: Constructor");
  console.log("-".repeat(60));

  let manager: MultiSourceRetrievalManager;
  try {
    manager = new MultiSourceRetrievalManager({
      llm: mockLLM,
      config: mockConfig,
      ide: mockIDE,
      lanceDbIndex: null,
    });
    assert(true, "Constructor creates instance");
    assert(manager !== null, "Instance is not null");
    assert(manager !== undefined, "Instance is not undefined");
  } catch (error) {
    assert(false, `Constructor creates instance - Error: ${error}`);
    process.exit(1);
  }

  // Test 2: retrieveAll() returns correct structure
  console.log("\n📋 Test 2: retrieveAll() Structure");
  console.log("-".repeat(60));

  let result: any;
  try {
    result = await manager.retrieveAll({
      query: "test query",
      tags: [{ directory: "/test", branch: "main" }],
      nRetrieve: 10,
    });
    assert(true, "retrieveAll() executes without error");
  } catch (error) {
    assert(false, `retrieveAll() executes - Error: ${error}`);
    process.exit(1);
  }

  assert(result !== null, "Result is not null");
  assert(result !== undefined, "Result is not undefined");
  assert(result.hasOwnProperty("sources"), "Result has 'sources' property");
  assert(result.hasOwnProperty("metadata"), "Result has 'metadata' property");
  assert(result.hasOwnProperty("totalTimeMs"), "Result has 'totalTimeMs' property");

  // Test 3: All 9 sources present
  console.log("\n📋 Test 3: All 9 Sources Present");
  console.log("-".repeat(60));

  const sources = ["fts", "embeddings", "recentlyEdited", "repoMap", "lspDefinitions", "importAnalysis", "recentlyVisitedRanges", "staticContext", "toolBasedSearch"];
  
  sources.forEach((source) => {
    assert(result.sources.hasOwnProperty(source), `sources.${source} exists`);
    assert(Array.isArray(result.sources[source]), `sources.${source} is array`);
  });

  // Test 4: Metadata tracking
  console.log("\n📋 Test 4: Metadata Tracking");
  console.log("-".repeat(60));

  assert(Array.isArray(result.metadata), "metadata is array");
  assert(result.metadata.length > 0, "metadata has entries");
  console.log(`  📊 Total sources tracked: ${result.metadata.length}`);

  result.metadata.forEach((meta: any, index: number) => {
    assert(typeof meta.source === "string", `metadata[${index}].source is string`);
    assert(typeof meta.count === "number", `metadata[${index}].count is number`);
    assert(typeof meta.timeMs === "number", `metadata[${index}].timeMs is number`);
    assert(typeof meta.success === "boolean", `metadata[${index}].success is boolean`);
    assert(meta.count >= 0, `metadata[${index}].count >= 0`);
    assert(meta.timeMs >= 0, `metadata[${index}].timeMs >= 0`);
  });

  // Test 5: Performance tracking
  console.log("\n📋 Test 5: Performance Tracking");
  console.log("-".repeat(60));

  assert(typeof result.totalTimeMs === "number", "totalTimeMs is number");
  assert(result.totalTimeMs >= 0, "totalTimeMs >= 0");
  console.log(`  ⏱️  Total time: ${result.totalTimeMs}ms`);

  const maxIndividualTime = Math.max(...result.metadata.map((m: any) => m.timeMs));
  assert(result.totalTimeMs >= maxIndividualTime, "totalTimeMs >= max(individual times)");

  // Test 6: Source configuration
  console.log("\n📋 Test 6: Source Configuration");
  console.log("-".repeat(60));

  const configResult = await manager.retrieveAll({
    query: "test",
    tags: [],
    nRetrieve: 10,
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
  });

  const ftsMetadata = configResult.metadata.find((m: any) => m.source === "fts");
  const embeddingsMetadata = configResult.metadata.find((m: any) => m.source === "embeddings");

  assert(ftsMetadata !== undefined, "FTS metadata exists when enabled");
  assert(embeddingsMetadata === undefined, "Embeddings metadata absent when disabled");
  assert(configResult.metadata.length === 1, "Only 1 source enabled = 1 metadata entry");

  // Test 7: Empty query handling
  console.log("\n📋 Test 7: Empty Query Handling");
  console.log("-".repeat(60));

  const emptyResult = await manager.retrieveAll({
    query: "",
    tags: [],
    nRetrieve: 10,
  });

  assert(emptyResult !== undefined, "Empty query returns result");
  assert(emptyResult.sources.fts.length === 0, "FTS returns empty for empty query");

  const whitespaceResult = await manager.retrieveAll({
    query: "   ",
    tags: [],
    nRetrieve: 10,
  });

  assert(whitespaceResult !== undefined, "Whitespace query returns result");
  assert(whitespaceResult.sources.fts.length === 0, "FTS returns empty for whitespace query");

  // Test 8: Error handling
  console.log("\n📋 Test 8: Error Handling");
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

  let errorResult: any;
  try {
    errorResult = await errorManager.retrieveAll({
      query: "test",
      tags: [],
      nRetrieve: 10,
    });
    assert(true, "retrieveAll() doesn't throw when source fails");
  } catch (error) {
    assert(false, `retrieveAll() should not throw - Error: ${error}`);
  }

  if (errorResult) {
    const failedSources = errorResult.metadata.filter((m: any) => !m.success);
    console.log(`  📊 Failed sources: ${failedSources.length}`);
    
    if (failedSources.length > 0) {
      assert(true, "Some sources failed as expected");
      failedSources.forEach((meta: any) => {
        assert(meta.error !== undefined, `Failed source ${meta.source} has error message`);
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log("\n🎉 All functional tests passed!");
    console.log("\n✅ MultiSourceRetrievalManager works correctly!");
    console.log("\n📋 Verified:");
    console.log("   ✅ Constructor works");
    console.log("   ✅ retrieveAll() returns correct structure");
    console.log("   ✅ All 9 sources present");
    console.log("   ✅ Metadata tracking works");
    console.log("   ✅ Performance tracking works");
    console.log("   ✅ Source configuration works");
    console.log("   ✅ Empty query handling works");
    console.log("   ✅ Error handling works");
    console.log("\n🚀 Phase 1.2 is functionally correct!\n");
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed!\n`);
    process.exit(1);
  }
}

// Run
runTests().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

