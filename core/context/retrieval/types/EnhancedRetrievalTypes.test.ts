/**
 * Unit tests for Enhanced Retrieval Types
 * 
 * Tests type definitions, helper functions, and default configurations
 * for the enhanced multi-source retrieval pipeline.
 */

import { describe, it, expect } from "vitest";
import {
  EnhancedRetrievalSources,
  RetrievalSourceConfig,
  FusionOptions,
  DEFAULT_SOURCE_CONFIG,
  DEFAULT_FUSION_OPTIONS,
  getEnabledSources,
  createEmptyRetrievalSources,
  countTotalChunks,
  mergeAllChunks,
  EnhancedRetrievalPipelineRunArguments,
} from "./EnhancedRetrievalTypes";
import { Chunk } from "../../../index.d.js";

describe("EnhancedRetrievalTypes", () => {
  describe("Default Configurations", () => {
    it("should have all sources enabled by default", () => {
      expect(DEFAULT_SOURCE_CONFIG.enableFts).toBe(true);
      expect(DEFAULT_SOURCE_CONFIG.enableEmbeddings).toBe(true);
      expect(DEFAULT_SOURCE_CONFIG.enableRecentlyEdited).toBe(true);
      expect(DEFAULT_SOURCE_CONFIG.enableRepoMap).toBe(true);
      expect(DEFAULT_SOURCE_CONFIG.enableLspDefinitions).toBe(true);
      expect(DEFAULT_SOURCE_CONFIG.enableImportAnalysis).toBe(true);
      expect(DEFAULT_SOURCE_CONFIG.enableRecentlyVisitedRanges).toBe(true);
      expect(DEFAULT_SOURCE_CONFIG.enableStaticContext).toBe(true);
      expect(DEFAULT_SOURCE_CONFIG.enableToolBasedSearch).toBe(true);
    });

    it("should have valid default fusion options", () => {
      expect(DEFAULT_FUSION_OPTIONS.maxChunks).toBeGreaterThan(0);
      expect(DEFAULT_FUSION_OPTIONS.enableSemanticDedup).toBe(true);
      expect(DEFAULT_FUSION_OPTIONS.enableCrossReference).toBe(true);
      expect(DEFAULT_FUSION_OPTIONS.sourceWeights).toBeDefined();
    });

    it("should have source weights that sum to approximately 1.0", () => {
      const weights = DEFAULT_FUSION_OPTIONS.sourceWeights!;
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });

  describe("getEnabledSources", () => {
    it("should return all enabled when using default config", () => {
      const enabled = getEnabledSources(DEFAULT_SOURCE_CONFIG);
      
      expect(enabled.fts).toBe(true);
      expect(enabled.embeddings).toBe(true);
      expect(enabled.recentlyEdited).toBe(true);
      expect(enabled.repoMap).toBe(true);
      expect(enabled.lspDefinitions).toBe(true);
      expect(enabled.importAnalysis).toBe(true);
      expect(enabled.recentlyVisitedRanges).toBe(true);
      expect(enabled.staticContext).toBe(true);
      expect(enabled.toolBasedSearch).toBe(true);
    });

    it("should respect custom config", () => {
      const customConfig: RetrievalSourceConfig = {
        enableFts: true,
        enableEmbeddings: false,
        enableLspDefinitions: true,
        enableImportAnalysis: false,
      };

      const enabled = getEnabledSources(customConfig);
      
      expect(enabled.fts).toBe(true);
      expect(enabled.embeddings).toBe(false);
      expect(enabled.lspDefinitions).toBe(true);
      expect(enabled.importAnalysis).toBe(false);
    });

    it("should use defaults for undefined config", () => {
      const enabled = getEnabledSources();
      
      expect(enabled.fts).toBe(true);
      expect(enabled.embeddings).toBe(true);
    });
  });

  describe("createEmptyRetrievalSources", () => {
    it("should create sources with all empty arrays", () => {
      const sources = createEmptyRetrievalSources();
      
      expect(sources.fts).toEqual([]);
      expect(sources.embeddings).toEqual([]);
      expect(sources.recentlyEdited).toEqual([]);
      expect(sources.repoMap).toEqual([]);
      expect(sources.lspDefinitions).toEqual([]);
      expect(sources.importAnalysis).toEqual([]);
      expect(sources.recentlyVisitedRanges).toEqual([]);
      expect(sources.staticContext).toEqual([]);
      expect(sources.toolBasedSearch).toEqual([]);
    });

    it("should create a new object each time", () => {
      const sources1 = createEmptyRetrievalSources();
      const sources2 = createEmptyRetrievalSources();
      
      expect(sources1).not.toBe(sources2);
      sources1.fts.push(createMockChunk("test"));
      expect(sources2.fts).toEqual([]);
    });
  });

  describe("countTotalChunks", () => {
    it("should return 0 for empty sources", () => {
      const sources = createEmptyRetrievalSources();
      expect(countTotalChunks(sources)).toBe(0);
    });

    it("should count chunks from all sources", () => {
      const sources: EnhancedRetrievalSources = {
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

      expect(countTotalChunks(sources)).toBe(7);
    });
  });

  describe("mergeAllChunks", () => {
    it("should return empty array for empty sources", () => {
      const sources = createEmptyRetrievalSources();
      expect(mergeAllChunks(sources)).toEqual([]);
    });

    it("should merge all chunks in order", () => {
      const chunk1 = createMockChunk("fts1");
      const chunk2 = createMockChunk("emb1");
      const chunk3 = createMockChunk("lsp1");

      const sources: EnhancedRetrievalSources = {
        fts: [chunk1],
        embeddings: [chunk2],
        recentlyEdited: [],
        repoMap: [],
        lspDefinitions: [chunk3],
        importAnalysis: [],
        recentlyVisitedRanges: [],
        staticContext: [],
        toolBasedSearch: [],
      };

      const merged = mergeAllChunks(sources);
      expect(merged).toHaveLength(3);
      expect(merged[0]).toBe(chunk1);
      expect(merged[1]).toBe(chunk2);
      expect(merged[2]).toBe(chunk3);
    });

    it("should preserve chunk order within each source", () => {
      const sources: EnhancedRetrievalSources = {
        fts: [createMockChunk("fts1"), createMockChunk("fts2")],
        embeddings: [createMockChunk("emb1"), createMockChunk("emb2")],
        recentlyEdited: [],
        repoMap: [],
        lspDefinitions: [],
        importAnalysis: [],
        recentlyVisitedRanges: [],
        staticContext: [],
        toolBasedSearch: [],
      };

      const merged = mergeAllChunks(sources);
      expect(merged[0].content).toBe("fts1");
      expect(merged[1].content).toBe("fts2");
      expect(merged[2].content).toBe("emb1");
      expect(merged[3].content).toBe("emb2");
    });
  });

  describe("Type Compatibility", () => {
    it("should allow valid EnhancedRetrievalPipelineRunArguments", () => {
      const args: EnhancedRetrievalPipelineRunArguments = {
        query: "test query",
        tags: [{ directory: "/test", branch: "main" }],
        includeEmbeddings: true,
      };

      expect(args.query).toBe("test query");
      expect(args.tags).toHaveLength(1);
    });

    it("should allow optional fields in run arguments", () => {
      const args: EnhancedRetrievalPipelineRunArguments = {
        query: "test",
        tags: [],
        includeEmbeddings: true,
        filterDirectory: "/src",
        currentFilePath: "/src/test.ts",
        sourceConfig: {
          enableFts: true,
          enableEmbeddings: false,
        },
        fusionOptions: {
          maxChunks: 50,
        },
      };

      expect(args.filterDirectory).toBe("/src");
      expect(args.currentFilePath).toBe("/src/test.ts");
      expect(args.sourceConfig?.enableFts).toBe(true);
      expect(args.fusionOptions?.maxChunks).toBe(50);
    });
  });

  describe("RetrievalSourceConfig", () => {
    it("should allow partial configuration", () => {
      const config: RetrievalSourceConfig = {
        enableFts: true,
        enableLspDefinitions: true,
      };

      expect(config.enableFts).toBe(true);
      expect(config.enableLspDefinitions).toBe(true);
      expect(config.enableEmbeddings).toBeUndefined();
    });

    it("should allow empty configuration", () => {
      const config: RetrievalSourceConfig = {};
      expect(Object.keys(config)).toHaveLength(0);
    });
  });

  describe("FusionOptions", () => {
    it("should allow partial source weights", () => {
      const options: FusionOptions = {
        maxChunks: 20,
        sourceWeights: {
          fts: 0.5,
          embeddings: 0.5,
        },
      };

      expect(options.sourceWeights?.fts).toBe(0.5);
      expect(options.sourceWeights?.embeddings).toBe(0.5);
      expect(options.sourceWeights?.lspDefinitions).toBeUndefined();
    });

    it("should allow minimal configuration", () => {
      const options: FusionOptions = {
        maxChunks: 10,
      };

      expect(options.maxChunks).toBe(10);
      expect(options.enableSemanticDedup).toBeUndefined();
    });
  });
});

// ===== Helper Functions =====

/**
 * Create a mock chunk for testing
 */
function createMockChunk(content: string): Chunk {
  return {
    content,
    startLine: 0,
    endLine: 10,
    digest: `digest-${content}`,
    filepath: `/test/${content}.ts`,
    index: 0,
  };
}

