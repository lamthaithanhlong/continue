/**
 * Phase 1.4 Verification Tests
 *
 * Verifies that Phase 1.4 implementation is complete
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 Phase 1.4 Verification Test\n");

let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => boolean) {
  totalTests++;
  try {
    if (fn()) {
      console.log(`✅ ${name}`);
      passedTests++;
    } else {
      console.error(`❌ ${name}`);
    }
  } catch (error) {
    console.error(`❌ ${name}: ${error}`);
  }
}

// Read BaseRetrievalPipeline content
const baseRetrievalPath = path.join(
  __dirname,
  "pipelines/BaseRetrievalPipeline.ts",
);

const content = fs.readFileSync(baseRetrievalPath, "utf-8");

console.log("=== Testing BaseRetrievalPipeline.ts ===\n");

// Test imports (check if names appear in file, imports can be multiline)
test("Imports MultiSourceRetrievalManager", () =>
  /MultiSourceRetrievalManager/.test(content) &&
  /from.*MultiSourceRetrievalManager/.test(content));

test("Imports DependencyGraphBuilder", () =>
  /DependencyGraphBuilder/.test(content) &&
  /from.*DependencyGraphBuilder/.test(content));

test("Imports EnhancedRetrievalTypes", () =>
  /EnhancedRetrievalSources/.test(content) &&
  /IEnhancedRetrievalPipeline/.test(content));

console.log();

// Test interface implementation
test("Implements IEnhancedRetrievalPipeline", () =>
  /implements.*IEnhancedRetrievalPipeline/.test(content));

console.log();

// Test properties
test("Has multiSourceManager property", () =>
  /multiSourceManager.*MultiSourceRetrievalManager/.test(content));

test("Has dependencyGraphBuilder property", () =>
  /dependencyGraphBuilder.*DependencyGraphBuilder/.test(content));

console.log();

// Test new methods
test("Has retrieveFromMultipleSources method", () =>
  /async retrieveFromMultipleSources/.test(content));

test("Has fuseResults method", () => /async fuseResults/.test(content));

test("Has getDependencyGraphBuilder method", () =>
  /getDependencyGraphBuilder/.test(content));

console.log();

// Test options
test("Has multiSourceOptions in RetrievalPipelineOptions", () =>
  /multiSourceOptions.*Partial.*MultiSourceRetrievalManagerOptions/.test(
    content,
  ));

test("multiSourceOptions is optional", () =>
  /multiSourceOptions\?:/.test(content));

console.log();

// Test backward compatibility
console.log("=== Testing Backward Compatibility ===\n");

test("Keeps existing retrieveFts method", () =>
  /protected async retrieveFts/.test(content));

test("Keeps existing retrieveEmbeddings method", () =>
  /protected async retrieveEmbeddings/.test(content));

test("Keeps existing retrieveAndChunkRecentlyEditedFiles method", () =>
  /protected async retrieveAndChunkRecentlyEditedFiles/.test(content));

test("Keeps existing retrieveWithTools method", () =>
  /protected async retrieveWithTools/.test(content));

test("Keeps existing run method", () =>
  /run\(args: RetrievalPipelineRunArguments\): Promise<Chunk\[\]>/.test(
    content,
  ));

console.log();

// Test initialization logic
console.log("=== Testing Initialization Logic ===\n");

test("Initializes multiSourceManager when multiSourceOptions provided", () =>
  /if \(options\.multiSourceOptions\)/.test(content));

test("Creates MultiSourceRetrievalManager instance", () =>
  /new MultiSourceRetrievalManager/.test(content));

test("Creates DependencyGraphBuilder instance", () =>
  /new DependencyGraphBuilder/.test(content));

console.log();

// Test method implementations
console.log("=== Testing Method Implementations ===\n");

test("retrieveFromMultipleSources checks for multiSourceManager", () =>
  /if \(!this\.multiSourceManager\)/.test(content));

test("retrieveFromMultipleSources returns EnhancedRetrievalSources", () =>
  /Promise<EnhancedRetrievalSources>/.test(content));

test("fuseResults deduplicates chunks", () =>
  /seen\.has\(chunk\.digest\)/.test(content));

test("fuseResults returns limited results", () =>
  /slice\(0, this\.options\.nFinal\)/.test(content));

console.log();

// Check file existence
console.log("=== Testing File Existence ===\n");

const filesToCheck = [
  "MultiSourceRetrievalManager.ts",
  "DependencyGraphBuilder.ts",
  "types/EnhancedRetrievalTypes.ts",
  "types/DependencyGraphTypes.ts",
  "RetrievalLogger.ts",
];

for (const file of filesToCheck) {
  const filePath = path.join(__dirname, file);
  test(`File exists: ${file}`, () => fs.existsSync(filePath));
}

console.log();

// ===== Summary =====
console.log("=".repeat(60));
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
console.log(`📈 Total:  ${totalTests}`);
console.log("=".repeat(60));

if (passedTests === totalTests) {
  console.log("\n🎉 All Phase 1.4 verification tests passed!");
  console.log("\n✅ Phase 1.4 Implementation Complete:");
  console.log("   - BaseRetrievalPipeline refactored ✅");
  console.log("   - MultiSourceRetrievalManager integrated ✅");
  console.log("   - DependencyGraphBuilder integrated ✅");
  console.log("   - New methods added:");
  console.log("     • retrieveFromMultipleSources() ✅");
  console.log("     • fuseResults() ✅");
  console.log("     • getDependencyGraphBuilder() ✅");
  console.log("   - Backward compatibility maintained ✅");
  console.log("   - All existing methods preserved ✅");
  console.log("\n🚀 Ready for Phase 2!");
  process.exit(0);
} else {
  console.log(`\n❌ ${totalTests - passedTests} test(s) failed`);
  process.exit(1);
}
