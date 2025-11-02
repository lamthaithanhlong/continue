/**
 * Logic Test for Phase 1.2 (No Dependencies Required)
 * 
 * Tests the core logic of helper functions without requiring
 * any external dependencies.
 */

// Test helper functions from types/EnhancedRetrievalTypes.ts
import {
  getEnabledSources,
  createEmptyRetrievalSources,
  countTotalChunks,
  mergeAllChunks,
  DEFAULT_SOURCE_CONFIG,
  DEFAULT_FUSION_OPTIONS,
  type RetrievalSourceConfig,
  type EnhancedRetrievalSources,
  type Chunk,
} from "./types/EnhancedRetrievalTypes.js";

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

console.log("\n🧪 Phase 1.2 Logic Test Suite (No Dependencies)\n");
console.log("=".repeat(60));

// Test 1: DEFAULT_SOURCE_CONFIG
console.log("\n📋 Test 1: DEFAULT_SOURCE_CONFIG");
console.log("-".repeat(60));

assert(DEFAULT_SOURCE_CONFIG.enableFts === true, "FTS enabled by default");
assert(DEFAULT_SOURCE_CONFIG.enableEmbeddings === true, "Embeddings enabled by default");
assert(DEFAULT_SOURCE_CONFIG.enableRecentlyEdited === true, "Recently edited enabled by default");
assert(DEFAULT_SOURCE_CONFIG.enableRepoMap === true, "Repo map enabled by default");
assert(DEFAULT_SOURCE_CONFIG.enableLspDefinitions === false, "LSP disabled by default (Phase 2)");
assert(DEFAULT_SOURCE_CONFIG.enableImportAnalysis === false, "Import analysis disabled by default (Phase 2)");
assert(DEFAULT_SOURCE_CONFIG.enableRecentlyVisitedRanges === false, "Recently visited disabled by default (Phase 2)");
assert(DEFAULT_SOURCE_CONFIG.enableStaticContext === false, "Static context disabled by default (Phase 2)");
assert(DEFAULT_SOURCE_CONFIG.enableToolBasedSearch === false, "Tool-based search disabled by default (Phase 2)");

// Test 2: DEFAULT_FUSION_OPTIONS
console.log("\n📋 Test 2: DEFAULT_FUSION_OPTIONS");
console.log("-".repeat(60));

assert(DEFAULT_FUSION_OPTIONS.maxChunks === 30, "maxChunks is 30");
assert(DEFAULT_FUSION_OPTIONS.enableSemanticDedup === true, "Semantic dedup enabled");
assert(DEFAULT_FUSION_OPTIONS.enableCrossReference === true, "Cross reference enabled");
assert(DEFAULT_FUSION_OPTIONS.sourceWeights !== undefined, "Source weights defined");

// Test 3: Source weights sum to 1.0
console.log("\n📋 Test 3: Source Weights Sum to 1.0");
console.log("-".repeat(60));

const weights = DEFAULT_FUSION_OPTIONS.sourceWeights!;
const sum = Object.values(weights).reduce((a, b) => a + b, 0);
const tolerance = 0.0001;
assert(Math.abs(sum - 1.0) < tolerance, `Source weights sum to 1.0 (actual: ${sum})`);

console.log(`  📊 Weight distribution:`);
console.log(`     FTS: ${weights.fts}`);
console.log(`     Embeddings: ${weights.embeddings}`);
console.log(`     Recently Edited: ${weights.recentlyEdited}`);
console.log(`     Repo Map: ${weights.repoMap}`);
console.log(`     LSP Definitions: ${weights.lspDefinitions}`);
console.log(`     Import Analysis: ${weights.importAnalysis}`);
console.log(`     Recently Visited: ${weights.recentlyVisitedRanges}`);
console.log(`     Static Context: ${weights.staticContext}`);
console.log(`     Tool-Based Search: ${weights.toolBasedSearch}`);

// Test 4: getEnabledSources()
console.log("\n📋 Test 4: getEnabledSources()");
console.log("-".repeat(60));

const defaultEnabled = getEnabledSources(DEFAULT_SOURCE_CONFIG);
assert(defaultEnabled.fts === true, "FTS enabled");
assert(defaultEnabled.embeddings === true, "Embeddings enabled");
assert(defaultEnabled.recentlyEdited === true, "Recently edited enabled");
assert(defaultEnabled.repoMap === true, "Repo map enabled");
assert(defaultEnabled.lspDefinitions === false, "LSP disabled");
assert(defaultEnabled.importAnalysis === false, "Import analysis disabled");
assert(defaultEnabled.recentlyVisitedRanges === false, "Recently visited disabled");
assert(defaultEnabled.staticContext === false, "Static context disabled");
assert(defaultEnabled.toolBasedSearch === false, "Tool-based search disabled");

const customConfig: RetrievalSourceConfig = {
  enableFts: false,
  enableEmbeddings: true,
  enableRecentlyEdited: false,
  enableRepoMap: false,
  enableLspDefinitions: true,
  enableImportAnalysis: false,
  enableRecentlyVisitedRanges: false,
  enableStaticContext: false,
  enableToolBasedSearch: false,
};

const customEnabled = getEnabledSources(customConfig);
assert(customEnabled.fts === false, "Custom: FTS disabled");
assert(customEnabled.embeddings === true, "Custom: Embeddings enabled");
assert(customEnabled.lspDefinitions === true, "Custom: LSP enabled");

// Test 5: createEmptyRetrievalSources()
console.log("\n📋 Test 5: createEmptyRetrievalSources()");
console.log("-".repeat(60));

const emptySources = createEmptyRetrievalSources();
assert(Array.isArray(emptySources.fts), "fts is array");
assert(Array.isArray(emptySources.embeddings), "embeddings is array");
assert(Array.isArray(emptySources.recentlyEdited), "recentlyEdited is array");
assert(Array.isArray(emptySources.repoMap), "repoMap is array");
assert(Array.isArray(emptySources.lspDefinitions), "lspDefinitions is array");
assert(Array.isArray(emptySources.importAnalysis), "importAnalysis is array");
assert(Array.isArray(emptySources.recentlyVisitedRanges), "recentlyVisitedRanges is array");
assert(Array.isArray(emptySources.staticContext), "staticContext is array");
assert(Array.isArray(emptySources.toolBasedSearch), "toolBasedSearch is array");

assert(emptySources.fts.length === 0, "fts is empty");
assert(emptySources.embeddings.length === 0, "embeddings is empty");
assert(emptySources.recentlyEdited.length === 0, "recentlyEdited is empty");

// Test 6: countTotalChunks()
console.log("\n📋 Test 6: countTotalChunks()");
console.log("-".repeat(60));

const mockChunk = (content: string): Chunk => ({
  content,
  filepath: "/test.ts",
  startLine: 0,
  endLine: 10,
  digest: `digest-${content}`,
  index: 0,
});

const testSources: EnhancedRetrievalSources = {
  fts: [mockChunk("fts1"), mockChunk("fts2")],
  embeddings: [mockChunk("emb1")],
  recentlyEdited: [mockChunk("recent1")],
  repoMap: [],
  lspDefinitions: [mockChunk("lsp1"), mockChunk("lsp2")],
  importAnalysis: [mockChunk("import1")],
  recentlyVisitedRanges: [],
  staticContext: [mockChunk("static1")],
  toolBasedSearch: [],
};

const totalCount = countTotalChunks(testSources);
assert(totalCount === 8, `Total chunks is 8 (actual: ${totalCount})`);

// Test 7: mergeAllChunks()
console.log("\n📋 Test 7: mergeAllChunks()");
console.log("-".repeat(60));

const mergedChunks = mergeAllChunks(testSources);
assert(Array.isArray(mergedChunks), "Merged result is array");
assert(mergedChunks.length === 8, `Merged has 8 chunks (actual: ${mergedChunks.length})`);

// Verify all chunks are present
const contents = mergedChunks.map((c) => c.content);
assert(contents.includes("fts1"), "Contains fts1");
assert(contents.includes("fts2"), "Contains fts2");
assert(contents.includes("emb1"), "Contains emb1");
assert(contents.includes("recent1"), "Contains recent1");
assert(contents.includes("lsp1"), "Contains lsp1");
assert(contents.includes("lsp2"), "Contains lsp2");
assert(contents.includes("import1"), "Contains import1");
assert(contents.includes("static1"), "Contains static1");

// Test 8: Empty sources
console.log("\n📋 Test 8: Empty Sources");
console.log("-".repeat(60));

const emptyCount = countTotalChunks(emptySources);
assert(emptyCount === 0, "Empty sources has 0 chunks");

const emptyMerged = mergeAllChunks(emptySources);
assert(emptyMerged.length === 0, "Empty sources merges to empty array");

// Test 9: Partial sources
console.log("\n📋 Test 9: Partial Sources");
console.log("-".repeat(60));

const partialSources: EnhancedRetrievalSources = {
  ...createEmptyRetrievalSources(),
  fts: [mockChunk("fts1")],
  embeddings: [mockChunk("emb1"), mockChunk("emb2")],
};

const partialCount = countTotalChunks(partialSources);
assert(partialCount === 3, `Partial sources has 3 chunks (actual: ${partialCount})`);

const partialMerged = mergeAllChunks(partialSources);
assert(partialMerged.length === 3, `Partial merged has 3 chunks (actual: ${partialMerged.length})`);

// Test 10: Type safety
console.log("\n📋 Test 10: Type Safety");
console.log("-".repeat(60));

// Verify all required properties exist
const requiredProps: (keyof EnhancedRetrievalSources)[] = [
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

requiredProps.forEach((prop) => {
  assert(emptySources.hasOwnProperty(prop), `Has property: ${prop}`);
});

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary");
console.log("=".repeat(60));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log("\n🎉 All logic tests passed!");
  console.log("\n✅ Core logic is correct!");
  console.log("\n📋 Verified:");
  console.log("   ✅ DEFAULT_SOURCE_CONFIG correct");
  console.log("   ✅ DEFAULT_FUSION_OPTIONS correct");
  console.log("   ✅ Source weights sum to 1.0");
  console.log("   ✅ getEnabledSources() works");
  console.log("   ✅ createEmptyRetrievalSources() works");
  console.log("   ✅ countTotalChunks() works");
  console.log("   ✅ mergeAllChunks() works");
  console.log("   ✅ Type safety verified");
  console.log("\n🚀 Phase 1.2 logic is functionally correct!\n");
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed!\n`);
  process.exit(1);
}

