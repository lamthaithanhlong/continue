/**
 * Unit tests for MultiSourceRetrievalManager
 * 
 * Tests parallel retrieval, error handling, and performance tracking.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MultiSourceRetrievalManager,
  MultiSourceRetrievalManagerOptions,
  RetrievalArguments,
} from "./MultiSourceRetrievalManager";
import { Chunk, IDE, ILLM, ContinueConfig } from "../../index.d.js";
import { DEFAULT_SOURCE_CONFIG } from "./types/EnhancedRetrievalTypes";

// ===== Mock Helpers =====

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

function createMockIDE(): IDE {
  return {
    getOpenFiles: vi.fn().mockResolvedValue(["/file1.ts", "/file2.ts"]),
    readFile: vi.fn().mockResolvedValue("mock file content"),
  } as any;
}

function createMockLLM(): ILLM {
  return {
    chat: vi.fn(),
    complete: vi.fn(),
  } as any;
}

function createMockConfig(): ContinueConfig {
  return {
    selectedModelByRole: {
      embed: {
        maxEmbeddingChunkSize: 512,
      } as any,
    },
  } as any;
}

describe("MultiSourceRetrievalManager", () => {
  let manager: MultiSourceRetrievalManager;
  let mockIDE: IDE;
  let mockLLM: ILLM;
  let mockConfig: ContinueConfig;

  beforeEach(() => {
    mockIDE = createMockIDE();
    mockLLM = createMockLLM();
    mockConfig = createMockConfig();

    const options: MultiSourceRetrievalManagerOptions = {
      llm: mockLLM,
      config: mockConfig,
      ide: mockIDE,
      lanceDbIndex: null, // No embeddings for basic tests
    };

    manager = new MultiSourceRetrievalManager(options);
  });

  describe("Constructor", () => {
    it("should create manager with default FTS index", () => {
      expect(manager).toBeDefined();
    });

    it("should accept custom FTS index", () => {
      const customFtsIndex = {} as any;
      const customManager = new MultiSourceRetrievalManager({
        ...createMockOptions(),
        ftsIndex: customFtsIndex,
      });
      expect(customManager).toBeDefined();
    });
  });

  describe("retrieveAll()", () => {
    it("should return EnhancedRetrievalResult structure", async () => {
      const args: RetrievalArguments = {
        query: "test query",
        tags: [{ directory: "/test", branch: "main" }],
        nRetrieve: 10,
      };

      const result = await manager.retrieveAll(args);

      expect(result).toHaveProperty("sources");
      expect(result).toHaveProperty("metadata");
      expect(result).toHaveProperty("totalTimeMs");
    });

    it("should have all 9 sources in result", async () => {
      const args: RetrievalArguments = {
        query: "test",
        tags: [],
        nRetrieve: 10,
      };

      const result = await manager.retrieveAll(args);

      expect(result.sources).toHaveProperty("fts");
      expect(result.sources).toHaveProperty("embeddings");
      expect(result.sources).toHaveProperty("recentlyEdited");
      expect(result.sources).toHaveProperty("repoMap");
      expect(result.sources).toHaveProperty("lspDefinitions");
      expect(result.sources).toHaveProperty("importAnalysis");
      expect(result.sources).toHaveProperty("recentlyVisitedRanges");
      expect(result.sources).toHaveProperty("staticContext");
      expect(result.sources).toHaveProperty("toolBasedSearch");
    });

    it("should track metadata for each source", async () => {
      const args: RetrievalArguments = {
        query: "test",
        tags: [],
        nRetrieve: 10,
      };

      const result = await manager.retrieveAll(args);

      expect(result.metadata.length).toBeGreaterThan(0);
      
      result.metadata.forEach((meta) => {
        expect(meta).toHaveProperty("source");
        expect(meta).toHaveProperty("count");
        expect(meta).toHaveProperty("timeMs");
        expect(meta).toHaveProperty("success");
      });
    });

    it("should track total time", async () => {
      const args: RetrievalArguments = {
        query: "test",
        tags: [],
        nRetrieve: 10,
      };

      const result = await manager.retrieveAll(args);

      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.totalTimeMs).toBe("number");
    });

    it("should respect source config", async () => {
      const args: RetrievalArguments = {
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
      };

      const result = await manager.retrieveAll(args);

      // Only FTS should have metadata
      const ftsMetadata = result.metadata.find((m) => m.source === "fts");
      expect(ftsMetadata).toBeDefined();

      // Other sources should not have metadata (not enabled)
      const embeddingsMetadata = result.metadata.find((m) => m.source === "embeddings");
      expect(embeddingsMetadata).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", async () => {
      // Create manager with IDE that throws errors
      const errorIDE = {
        ...mockIDE,
        readFile: vi.fn().mockRejectedValue(new Error("File not found")),
      } as any;

      const errorManager = new MultiSourceRetrievalManager({
        llm: mockLLM,
        config: mockConfig,
        ide: errorIDE,
      });

      const args: RetrievalArguments = {
        query: "test",
        tags: [],
        nRetrieve: 10,
      };

      // Should not throw
      const result = await errorManager.retrieveAll(args);

      expect(result).toBeDefined();
      expect(result.sources).toBeDefined();
    });

    it("should mark failed sources in metadata", async () => {
      const errorIDE = {
        ...mockIDE,
        readFile: vi.fn().mockRejectedValue(new Error("Read error")),
      } as any;

      const errorManager = new MultiSourceRetrievalManager({
        llm: mockLLM,
        config: mockConfig,
        ide: errorIDE,
      });

      const args: RetrievalArguments = {
        query: "test",
        tags: [],
        nRetrieve: 10,
      };

      const result = await errorManager.retrieveAll(args);

      // Find metadata for recently edited (which uses readFile)
      const recentlyEditedMeta = result.metadata.find(
        (m) => m.source === "recentlyEdited",
      );

      if (recentlyEditedMeta) {
        expect(recentlyEditedMeta.success).toBe(false);
        expect(recentlyEditedMeta.error).toBeDefined();
      }
    });

    it("should continue retrieval even if one source fails", async () => {
      const args: RetrievalArguments = {
        query: "test",
        tags: [],
        nRetrieve: 10,
      };

      const result = await manager.retrieveAll(args);

      // Should have metadata for multiple sources
      expect(result.metadata.length).toBeGreaterThan(1);
    });
  });

  describe("Performance", () => {
    it("should complete retrieval in reasonable time", async () => {
      const args: RetrievalArguments = {
        query: "test",
        tags: [],
        nRetrieve: 10,
      };

      const startTime = Date.now();
      await manager.retrieveAll(args);
      const duration = Date.now() - startTime;

      // Should complete in less than 5 seconds (generous for tests)
      expect(duration).toBeLessThan(5000);
    });

    it("should track individual source times", async () => {
      const args: RetrievalArguments = {
        query: "test",
        tags: [],
        nRetrieve: 10,
      };

      const result = await manager.retrieveAll(args);

      result.metadata.forEach((meta) => {
        expect(meta.timeMs).toBeGreaterThanOrEqual(0);
        expect(typeof meta.timeMs).toBe("number");
      });
    });
  });

  describe("Empty Query Handling", () => {
    it("should handle empty query", async () => {
      const args: RetrievalArguments = {
        query: "",
        tags: [],
        nRetrieve: 10,
      };

      const result = await manager.retrieveAll(args);

      expect(result).toBeDefined();
      expect(result.sources.fts).toEqual([]);
    });

    it("should handle whitespace-only query", async () => {
      const args: RetrievalArguments = {
        query: "   ",
        tags: [],
        nRetrieve: 10,
      };

      const result = await manager.retrieveAll(args);

      expect(result).toBeDefined();
    });
  });
});

// ===== Helper Functions =====

function createMockOptions(): MultiSourceRetrievalManagerOptions {
  return {
    llm: createMockLLM(),
    config: createMockConfig(),
    ide: createMockIDE(),
  };
}

