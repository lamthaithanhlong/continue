/**
 * Integration Tests for Phase 1.4 - BaseRetrievalPipeline with MultiSourceRetrievalManager
 *
 * Tests the integration of:
 * - MultiSourceRetrievalManager
 * - DependencyGraphBuilder
 * - BaseRetrievalPipeline
 */

import { Chunk, IDE, ILLM } from "../../index";
import BaseRetrievalPipeline, {
  RetrievalPipelineOptions,
  RetrievalPipelineRunArguments,
} from "./pipelines/BaseRetrievalPipeline";

// ===== Mock IDE =====
class MockIDE implements Partial<IDE> {
  async readFile(filepath: string): Promise<string> {
    const mockFiles: Record<string, string> = {
      "/src/App.ts": `
import { Component } from './Component';
import { Utils } from './utils/Utils';

export class App {
  render() {
    return Component.create();
  }
}
      `,
      "/src/Component.ts": `
export class Component {
  static create() {
    return new Component();
  }
}
      `,
      "/src/utils/Utils.ts": `
export class Utils {
  static format(str: string) {
    return str.trim();
  }
}
      `,
    };

    return mockFiles[filepath] || "";
  }

  async getDefinition(filepath: string, line: number, character: number) {
    return [];
  }

  async getReferencesForSymbol(
    filepath: string,
    line: number,
    character: number,
  ) {
    return [];
  }
}

// ===== Mock LLM =====
class MockLLM implements Partial<ILLM> {
  model = "gpt-4";
  contextLength = 8192;

  async chat(messages: any[], signal: AbortSignal) {
    return {
      role: "assistant" as const,
      content: "Mock response",
    };
  }

  async *streamChat(messages: any[], signal: AbortSignal) {
    yield {
      role: "assistant" as const,
      content: "Mock response",
    };
  }
}

// ===== Mock Config =====
const mockConfig: any = {
  selectedModelByRole: {
    embed: null, // No embeddings for basic test
    rerank: null,
  },
  experimental: {},
};

// ===== Test Suite =====

async function runTests() {
  console.log("🧪 BaseRetrievalPipeline Integration Test Suite\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Basic pipeline without multi-source (backward compatibility)
  try {
    console.log(
      "Test 1: Backward compatibility - pipeline without multi-source",
    );

    const ide = new MockIDE() as IDE;
    const llm = new MockLLM() as ILLM;

    const options: RetrievalPipelineOptions = {
      llm,
      config: mockConfig,
      ide,
      input: "test query",
      nRetrieve: 10,
      nFinal: 5,
      tags: [{ directory: "/src", branch: "main" }],
    };

    const pipeline = new BaseRetrievalPipeline(options);

    // Should not have multi-source manager
    if (pipeline.getDependencyGraphBuilder() !== undefined) {
      throw new Error(
        "Expected no dependency graph builder without multiSourceOptions",
      );
    }

    console.log("✅ Test 1 passed: Backward compatibility maintained\n");
    passed++;
  } catch (error) {
    console.error("❌ Test 1 failed:", error);
    failed++;
  }

  // Test 2: Pipeline with multi-source enabled
  try {
    console.log("Test 2: Pipeline with multi-source enabled");

    const ide = new MockIDE() as IDE;
    const llm = new MockLLM() as ILLM;

    const options: RetrievalPipelineOptions = {
      llm,
      config: mockConfig,
      ide,
      input: "test query",
      nRetrieve: 10,
      nFinal: 5,
      tags: [{ directory: "/src", branch: "main" }],
      multiSourceOptions: {
        enabled: true,
        sources: {
          fts: { enabled: true, weight: 1.0 },
          embeddings: { enabled: false, weight: 0.5 },
          lsp: { enabled: false, weight: 0.8 },
        },
      },
    };

    const pipeline = new BaseRetrievalPipeline(options);

    // Should have multi-source manager and dependency graph builder
    const graphBuilder = pipeline.getDependencyGraphBuilder();
    if (!graphBuilder) {
      throw new Error(
        "Expected dependency graph builder with multiSourceOptions",
      );
    }

    console.log("✅ Test 2 passed: Multi-source components initialized\n");
    passed++;
  } catch (error) {
    console.error("❌ Test 2 failed:", error);
    failed++;
  }

  // Test 3: retrieveFromMultipleSources without multi-source manager
  try {
    console.log(
      "Test 3: retrieveFromMultipleSources without multi-source manager",
    );

    const ide = new MockIDE() as IDE;
    const llm = new MockLLM() as ILLM;

    const options: RetrievalPipelineOptions = {
      llm,
      config: mockConfig,
      ide,
      input: "test query",
      nRetrieve: 10,
      nFinal: 5,
      tags: [{ directory: "/src", branch: "main" }],
      // No multiSourceOptions
    };

    const pipeline = new BaseRetrievalPipeline(options);

    const args: RetrievalPipelineRunArguments = {
      query: "Component",
      tags: [{ directory: "/src", branch: "main" }],
      includeEmbeddings: false,
    };

    const sources = await pipeline.retrieveFromMultipleSources(args);

    // Should return empty sources with warning
    if (sources.metadata.totalSources !== 0) {
      throw new Error("Expected empty sources without multi-source manager");
    }

    console.log(
      "✅ Test 3 passed: Graceful fallback without multi-source manager\n",
    );
    passed++;
  } catch (error) {
    console.error("❌ Test 3 failed:", error);
    failed++;
  }

  // Test 4: retrieveFromMultipleSources with multi-source manager
  try {
    console.log(
      "Test 4: retrieveFromMultipleSources with multi-source manager",
    );

    const ide = new MockIDE() as IDE;
    const llm = new MockLLM() as ILLM;

    const options: RetrievalPipelineOptions = {
      llm,
      config: mockConfig,
      ide,
      input: "test query",
      nRetrieve: 10,
      nFinal: 5,
      tags: [{ directory: "/src", branch: "main" }],
      multiSourceOptions: {
        enabled: true,
        sources: {
          fts: { enabled: true, weight: 1.0 },
        },
      },
    };

    const pipeline = new BaseRetrievalPipeline(options);

    const args: RetrievalPipelineRunArguments = {
      query: "Component",
      tags: [{ directory: "/src", branch: "main" }],
      includeEmbeddings: false,
    };

    const sources = await pipeline.retrieveFromMultipleSources(args);

    // Should have metadata
    if (!sources.metadata) {
      throw new Error("Expected metadata in sources");
    }

    console.log(`   Sources retrieved: ${sources.metadata.totalSources}`);
    console.log(`   Total chunks: ${sources.metadata.totalChunks}`);
    console.log(`   Time: ${sources.metadata.timeMs}ms`);

    console.log("✅ Test 4 passed: Multi-source retrieval working\n");
    passed++;
  } catch (error) {
    console.error("❌ Test 4 failed:", error);
    failed++;
  }

  // Test 5: fuseResults method
  try {
    console.log("Test 5: fuseResults deduplication");

    const ide = new MockIDE() as IDE;
    const llm = new MockLLM() as ILLM;

    const options: RetrievalPipelineOptions = {
      llm,
      config: mockConfig,
      ide,
      input: "test query",
      nRetrieve: 10,
      nFinal: 5,
      tags: [{ directory: "/src", branch: "main" }],
    };

    const pipeline = new BaseRetrievalPipeline(options);

    // Create mock sources with duplicates
    const chunk1: Chunk = {
      content: "test content 1",
      startLine: 0,
      endLine: 10,
      digest: "digest1",
      filepath: "/src/test.ts",
      index: 0,
    };

    const chunk2: Chunk = {
      content: "test content 2",
      startLine: 10,
      endLine: 20,
      digest: "digest2",
      filepath: "/src/test.ts",
      index: 1,
    };

    const sources = {
      fts: [chunk1, chunk2],
      embeddings: [chunk1], // Duplicate
      lsp: [],
      treeSitter: [],
      git: [],
      docs: [],
      codebase: [],
      file: [],
      folder: [],
      metadata: {
        totalSources: 2,
        totalChunks: 3,
        timeMs: 100,
        sources: [],
      },
    };

    const fused = await pipeline.fuseResults(sources);

    // Should deduplicate
    if (fused.length !== 2) {
      throw new Error(
        `Expected 2 chunks after deduplication, got ${fused.length}`,
      );
    }

    console.log(`   Input chunks: 3 (with 1 duplicate)`);
    console.log(`   Output chunks: ${fused.length}`);

    console.log("✅ Test 5 passed: Deduplication working\n");
    passed++;
  } catch (error) {
    console.error("❌ Test 5 failed:", error);
    failed++;
  }

  // ===== Summary =====
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${passed}/${passed + failed}`);
  console.log(`❌ Failed: ${failed}/${passed + failed}`);
  console.log(`📈 Total:  ${passed + failed}`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
