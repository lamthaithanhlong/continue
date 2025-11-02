/**
 * Manual Test Script for Phase 1.1
 * 
 * Run this to verify all types and functions work correctly
 * without compiling the full extension.
 * 
 * Usage:
 *   cd core
 *   npx tsx context/retrieval/types/manual-test.ts
 */

import { Chunk } from "../../../index.d.js";
import {
    countTotalChunks,
    createEmptyRetrievalSources,
    DEFAULT_FUSION_OPTIONS,
    DEFAULT_SOURCE_CONFIG,
    EnhancedRetrievalResult,
    EnhancedRetrievalSources,
    FusionOptions,
    getEnabledSources,
    mergeAllChunks,
    RetrievalSourceConfig
} from "./EnhancedRetrievalTypes";

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

function assertEquals(actual: any, expected: any, message: string) {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  assert(isEqual, message);
  if (!isEqual) {
    console.error(`  Expected: ${JSON.stringify(expected)}`);
    console.error(`  Actual:   ${JSON.stringify(actual)}`);
  }
}

function createMockChunk(content: string, filepath: string = "/test.ts"): Chunk {
  return {
    content,
    startLine: 0,
    endLine: 10,
    digest: `digest-${content}`,
    filepath,
    index: 0,
  };
}

// ===== Test Suite =====

console.log("\n🧪 Phase 1.1 Manual Test Suite\n");
console.log("=" .repeat(60));

// Test 1: Default Configurations
console.log("\n📋 Test 1: Default Configurations");
console.log("-".repeat(60));

assert(
  DEFAULT_SOURCE_CONFIG.enableFts === true,
  "DEFAULT_SOURCE_CONFIG.enableFts should be true"
);
assert(
  DEFAULT_SOURCE_CONFIG.enableEmbeddings === true,
  "DEFAULT_SOURCE_CONFIG.enableEmbeddings should be true"
);
assert(
  DEFAULT_SOURCE_CONFIG.enableLspDefinitions === true,
  "DEFAULT_SOURCE_CONFIG.enableLspDefinitions should be true"
);

assert(
  DEFAULT_FUSION_OPTIONS.maxChunks === 30,
  "DEFAULT_FUSION_OPTIONS.maxChunks should be 30"
);
assert(
  DEFAULT_FUSION_OPTIONS.enableSemanticDedup === true,
  "DEFAULT_FUSION_OPTIONS.enableSemanticDedup should be true"
);

// Test 2: Source Weights Sum to 1.0
console.log("\n📊 Test 2: Source Weights");
console.log("-".repeat(60));

const weights = DEFAULT_FUSION_OPTIONS.sourceWeights!;
const sum = Object.values(weights).reduce((a, b) => a + b, 0);
console.log(`  Weights sum: ${sum.toFixed(2)}`);
assert(
  Math.abs(sum - 1.0) < 0.01,
  "Source weights should sum to 1.0"
);

// Print individual weights
console.log("\n  Individual weights:");
Object.entries(weights).forEach(([source, weight]) => {
  console.log(`    ${source.padEnd(25)}: ${(weight * 100).toFixed(1)}%`);
});

// Test 3: getEnabledSources
console.log("\n🔧 Test 3: getEnabledSources()");
console.log("-".repeat(60));

const enabledDefault = getEnabledSources();
assert(
  enabledDefault.fts === true,
  "getEnabledSources() should enable fts by default"
);
assert(
  enabledDefault.lspDefinitions === true,
  "getEnabledSources() should enable lspDefinitions by default"
);

const customConfig: RetrievalSourceConfig = {
  enableFts: true,
  enableEmbeddings: false,
  enableLspDefinitions: true,
};
const enabledCustom = getEnabledSources(customConfig);
assert(
  enabledCustom.fts === true,
  "getEnabledSources() should respect custom config (fts=true)"
);
assert(
  enabledCustom.embeddings === false,
  "getEnabledSources() should respect custom config (embeddings=false)"
);

// Test 4: createEmptyRetrievalSources
console.log("\n🗂️  Test 4: createEmptyRetrievalSources()");
console.log("-".repeat(60));

const emptySources = createEmptyRetrievalSources();
assert(
  Array.isArray(emptySources.fts),
  "emptySources.fts should be an array"
);
assert(
  emptySources.fts.length === 0,
  "emptySources.fts should be empty"
);
assert(
  emptySources.lspDefinitions.length === 0,
  "emptySources.lspDefinitions should be empty"
);

const emptySources2 = createEmptyRetrievalSources();
assert(
  emptySources !== emptySources2,
  "createEmptyRetrievalSources() should create new object each time"
);

// Test 5: countTotalChunks
console.log("\n🔢 Test 5: countTotalChunks()");
console.log("-".repeat(60));

const emptyCount = countTotalChunks(emptySources);
assert(
  emptyCount === 0,
  "countTotalChunks() should return 0 for empty sources"
);

const sourcesWithChunks: EnhancedRetrievalSources = {
  fts: [createMockChunk("fts1"), createMockChunk("fts2")],
  embeddings: [createMockChunk("emb1")],
  recentlyEdited: [createMockChunk("recent1")],
  repoMap: [],
  lspDefinitions: [createMockChunk("lsp1"), createMockChunk("lsp2")],
  importAnalysis: [createMockChunk("import1")],
  recentlyVisitedRanges: [],
  staticContext: [createMockChunk("static1")],
  toolBasedSearch: [],
};

// Count: fts(2) + embeddings(1) + recentlyEdited(1) + lspDefinitions(2) + importAnalysis(1) + staticContext(1) = 8
const totalCount = countTotalChunks(sourcesWithChunks);
console.log(`  Total chunks: ${totalCount}`);
assert(
  totalCount === 8,
  "countTotalChunks() should count all chunks (expected 8)"
);

// Test 6: mergeAllChunks
console.log("\n🔀 Test 6: mergeAllChunks()");
console.log("-".repeat(60));

const emptyMerged = mergeAllChunks(emptySources);
assert(
  emptyMerged.length === 0,
  "mergeAllChunks() should return empty array for empty sources"
);

const merged = mergeAllChunks(sourcesWithChunks);
console.log(`  Merged chunks: ${merged.length}`);
assert(
  merged.length === 8,
  "mergeAllChunks() should merge all chunks (expected 8)"
);

assert(
  merged[0].content === "fts1",
  "mergeAllChunks() should preserve order (first chunk should be fts1)"
);
assert(
  merged[1].content === "fts2",
  "mergeAllChunks() should preserve order (second chunk should be fts2)"
);

// Test 7: Type Compatibility
console.log("\n🔤 Test 7: Type Compatibility");
console.log("-".repeat(60));

// Test that we can create valid objects
const testConfig: RetrievalSourceConfig = {
  enableFts: true,
  enableEmbeddings: false,
};
assert(
  testConfig.enableFts === true,
  "RetrievalSourceConfig type works correctly"
);

const testOptions: FusionOptions = {
  maxChunks: 50,
  enableSemanticDedup: false,
  sourceWeights: {
    fts: 0.5,
    embeddings: 0.5,
  },
};
assert(
  testOptions.maxChunks === 50,
  "FusionOptions type works correctly"
);

const testResult: EnhancedRetrievalResult = {
  sources: emptySources,
  metadata: [
    {
      source: "fts",
      count: 10,
      timeMs: 50,
      success: true,
    },
  ],
  totalTimeMs: 100,
};
assert(
  testResult.totalTimeMs === 100,
  "EnhancedRetrievalResult type works correctly"
);

// Test 8: All 9 Sources Present
console.log("\n📦 Test 8: All 9 Sources Present");
console.log("-".repeat(60));

const sources = createEmptyRetrievalSources();
const sourceKeys = Object.keys(sources);
console.log(`  Total sources: ${sourceKeys.length}`);
assert(
  sourceKeys.length === 9,
  "Should have exactly 9 sources"
);

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
    sourceKeys.includes(source),
    `Should have source: ${source}`
  );
});

// ===== Summary =====

console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary");
console.log("=".repeat(60));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log("\n🎉 All tests passed! Phase 1.1 is working correctly! ✅");
  console.log("\n💡 To test Phase 1.2, run:");
  console.log("   npx tsx context/retrieval/manual-test-phase-1-2.ts\n");
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review.\n`);
  process.exit(1);
}

