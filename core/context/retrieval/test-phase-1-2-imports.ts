/**
 * Test Phase 1.2 Imports and Exports
 * 
 * Verify all imports/exports work correctly
 */

// Test 1: Import MultiSourceRetrievalManager
import {
  MultiSourceRetrievalManager,
  MultiSourceRetrievalManagerOptions,
  RetrievalArguments,
} from "./MultiSourceRetrievalManager";

// Test 2: Import types from EnhancedRetrievalTypes
import {
  EnhancedRetrievalSources,
  EnhancedRetrievalResult,
  RetrievalSourceMetadata,
  RetrievalSourceConfig,
  DEFAULT_SOURCE_CONFIG,
  getEnabledSources,
  createEmptyRetrievalSources,
} from "./types/EnhancedRetrievalTypes";

// Test 3: Import util functions
import { getCleanedTrigrams, deduplicateChunks } from "./util";

// Test 4: Verify types compile
const testOptions: MultiSourceRetrievalManagerOptions = {} as any;
const testArgs: RetrievalArguments = {
  query: "test",
  tags: [],
  nRetrieve: 10,
};
const testConfig: RetrievalSourceConfig = DEFAULT_SOURCE_CONFIG;
const testSources: EnhancedRetrievalSources = createEmptyRetrievalSources();
const testEnabled = getEnabledSources(testConfig);

// Test 5: Verify class instantiation compiles
const manager = new MultiSourceRetrievalManager(testOptions);

// Test 6: Verify method signatures compile
async function testMethods() {
  const result: EnhancedRetrievalResult = await manager.retrieveAll(testArgs);
  return result;
}

// Test 7: Verify util functions compile
const trigrams = getCleanedTrigrams("test query");
const dedupedChunks = deduplicateChunks([]);

console.log("✅ All imports and exports work correctly!");
console.log("✅ Phase 1.2 type checking passed!");

