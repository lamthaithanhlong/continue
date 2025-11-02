/**
 * Simple Manager Test (CommonJS compatible)
 * 
 * Tests MultiSourceRetrievalManager with minimal dependencies.
 * Run: cd core && node context/retrieval/test-manager-simple.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Simple test counter
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

console.log("\n🧪 MultiSourceRetrievalManager Simple Test\n");
console.log("=".repeat(60));

// Test 1: Import check
console.log("\n📋 Test 1: Module Imports");
console.log("-".repeat(60));

let MultiSourceRetrievalManager;
let EnhancedRetrievalTypes;

try {
  const managerModule = await import('./MultiSourceRetrievalManager.js');
  MultiSourceRetrievalManager = managerModule.MultiSourceRetrievalManager;
  assert(MultiSourceRetrievalManager !== undefined, "MultiSourceRetrievalManager imported");
} catch (error) {
  assert(false, `Import MultiSourceRetrievalManager - Error: ${error.message}`);
  console.error(error);
}

try {
  EnhancedRetrievalTypes = await import('./types/EnhancedRetrievalTypes.js');
  assert(EnhancedRetrievalTypes !== undefined, "EnhancedRetrievalTypes imported");
  assert(EnhancedRetrievalTypes.DEFAULT_SOURCE_CONFIG !== undefined, "DEFAULT_SOURCE_CONFIG imported");
  assert(EnhancedRetrievalTypes.getEnabledSources !== undefined, "getEnabledSources imported");
  assert(EnhancedRetrievalTypes.createEmptyRetrievalSources !== undefined, "createEmptyRetrievalSources imported");
} catch (error) {
  assert(false, `Import EnhancedRetrievalTypes - Error: ${error.message}`);
  console.error(error);
}

// Test 2: Default config
console.log("\n📋 Test 2: Default Configuration");
console.log("-".repeat(60));

const config = EnhancedRetrievalTypes.DEFAULT_SOURCE_CONFIG;
assert(config.enableFts === true, "FTS enabled");
assert(config.enableEmbeddings === true, "Embeddings enabled");
assert(config.enableRecentlyEdited === true, "Recently edited enabled");
assert(config.enableRepoMap === true, "Repo map enabled");
assert(config.enableLspDefinitions === false, "LSP disabled (Phase 2)");
assert(config.enableImportAnalysis === false, "Import analysis disabled (Phase 2)");
assert(config.enableRecentlyVisitedRanges === false, "Recently visited disabled (Phase 2)");
assert(config.enableStaticContext === false, "Static context disabled (Phase 2)");
assert(config.enableToolBasedSearch === false, "Tool-based search disabled (Phase 2)");

// Test 3: Helper functions
console.log("\n📋 Test 3: Helper Functions");
console.log("-".repeat(60));

const enabled = EnhancedRetrievalTypes.getEnabledSources(config);
assert(enabled.fts === true, "getEnabledSources: FTS enabled");
assert(enabled.embeddings === true, "getEnabledSources: Embeddings enabled");
assert(enabled.lspDefinitions === false, "getEnabledSources: LSP disabled");

const empty = EnhancedRetrievalTypes.createEmptyRetrievalSources();
assert(Array.isArray(empty.fts), "createEmptyRetrievalSources: fts is array");
assert(empty.fts.length === 0, "createEmptyRetrievalSources: fts is empty");
assert(Array.isArray(empty.embeddings), "createEmptyRetrievalSources: embeddings is array");
assert(empty.embeddings.length === 0, "createEmptyRetrievalSources: embeddings is empty");

// Test 4: Constructor (if possible)
console.log("\n📋 Test 4: Constructor Test");
console.log("-".repeat(60));

try {
  // Create minimal mock objects
  const mockIDE = {
    getOpenFiles: async () => [],
    readFile: async () => "mock content",
  };

  const mockLLM = {
    chat: async () => ({ role: "assistant", content: "mock" }),
  };

  const mockConfig = {
    selectedModelByRole: {},
    experimental: {},
  };

  const manager = new MultiSourceRetrievalManager({
    llm: mockLLM,
    config: mockConfig,
    ide: mockIDE,
    lanceDbIndex: null,
  });

  assert(manager !== null, "Manager instance created");
  assert(manager !== undefined, "Manager instance is defined");
  assert(typeof manager.retrieveAll === 'function', "retrieveAll method exists");
  
  console.log("  📊 Manager created successfully!");
} catch (error) {
  assert(false, `Constructor test - Error: ${error.message}`);
  console.error("  Error details:", error);
}

// Test 5: Type checking
console.log("\n📋 Test 5: Type Definitions");
console.log("-".repeat(60));

assert(EnhancedRetrievalTypes.DEFAULT_FUSION_OPTIONS !== undefined, "DEFAULT_FUSION_OPTIONS exists");
assert(EnhancedRetrievalTypes.DEFAULT_FUSION_OPTIONS.maxChunks === 30, "maxChunks is 30");
assert(EnhancedRetrievalTypes.DEFAULT_FUSION_OPTIONS.enableSemanticDedup === true, "Semantic dedup enabled");

const weights = EnhancedRetrievalTypes.DEFAULT_FUSION_OPTIONS.sourceWeights;
assert(weights !== undefined, "Source weights defined");
assert(weights.fts === 0.15, "FTS weight is 0.15");
assert(weights.embeddings === 0.25, "Embeddings weight is 0.25");

const sum = Object.values(weights).reduce((a, b) => a + b, 0);
assert(Math.abs(sum - 1.0) < 0.0001, `Weights sum to 1.0 (actual: ${sum})`);

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary");
console.log("=".repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);

if (failed === 0) {
  console.log("\n🎉 All simple tests passed!");
  console.log("\n✅ Phase 1.2 modules work correctly!");
  console.log("\n📋 Verified:");
  console.log("   ✅ Modules import successfully");
  console.log("   ✅ Default configuration correct");
  console.log("   ✅ Helper functions work");
  console.log("   ✅ Constructor works");
  console.log("   ✅ Type definitions correct");
  console.log("\n🚀 Ready for integration testing!\n");
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed!\n`);
  process.exit(1);
}

