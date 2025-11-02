/**
 * Functional Test for Phase 1.2
 * 
 * Test that MultiSourceRetrievalManager actually works correctly,
 * not just type checking.
 * 
 * Run: cd core && npm run vitest -- context/retrieval/functional-test-phase-1-2.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MultiSourceRetrievalManager } from "./MultiSourceRetrievalManager";
import { Chunk } from "../../index.d.js";

// Mock dependencies
const mockChunk = (content: string, filepath: string = "/test.ts"): Chunk => ({
  content,
  filepath,
  startLine: 0,
  endLine: 10,
  digest: `digest-${content}`,
  index: 0,
});

describe("MultiSourceRetrievalManager - Functional Tests", () => {
  let manager: MultiSourceRetrievalManager;

  beforeEach(() => {
    const mockIDE = {
      getOpenFiles: vi.fn().mockResolvedValue(["/file1.ts", "/file2.ts"]),
      readFile: vi.fn().mockResolvedValue("mock file content\nline 2\nline 3"),
    } as any;

    const mockLLM = {
      chat: vi.fn(),
      complete: vi.fn(),
    } as any;

    const mockConfig = {
      selectedModelByRole: {
        embed: null, // No embeddings for basic tests
      },
      experimental: {},
    } as any;

    manager = new MultiSourceRetrievalManager({
      llm: mockLLM,
      config: mockConfig,
      ide: mockIDE,
      lanceDbIndex: null,
    });
  });

  describe("retrieveAll() - Basic Functionality", () => {
    it("should return EnhancedRetrievalResult structure", async () => {
      const result = await manager.retrieveAll({
        query: "test query",
        tags: [{ directory: "/test", branch: "main" }],
        nRetrieve: 10,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("sources");
      expect(result).toHaveProperty("metadata");
      expect(result).toHaveProperty("totalTimeMs");
    });

    it("should have all 9 sources in result", async () => {
      const result = await manager.retrieveAll({
        query: "test",
        tags: [],
        nRetrieve: 10,
      });

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

    it("should return arrays for all sources", async () => {
      const result = await manager.retrieveAll({
        query: "test",
        tags: [],
        nRetrieve: 10,
      });

      expect(Array.isArray(result.sources.fts)).toBe(true);
      expect(Array.isArray(result.sources.embeddings)).toBe(true);
      expect(Array.isArray(result.sources.recentlyEdited)).toBe(true);
      expect(Array.isArray(result.sources.repoMap)).toBe(true);
      expect(Array.isArray(result.sources.lspDefinitions)).toBe(true);
      expect(Array.isArray(result.sources.importAnalysis)).toBe(true);
      expect(Array.isArray(result.sources.recentlyVisitedRanges)).toBe(true);
      expect(Array.isArray(result.sources.staticContext)).toBe(true);
      expect(Array.isArray(result.sources.toolBasedSearch)).toBe(true);
    });
  });

  describe("Metadata Tracking", () => {
    it("should track metadata for each enabled source", async () => {
      const result = await manager.retrieveAll({
        query: "test",
        tags: [],
        nRetrieve: 10,
      });

      expect(Array.isArray(result.metadata)).toBe(true);
      expect(result.metadata.length).toBeGreaterThan(0);

      result.metadata.forEach((meta) => {
        expect(meta).toHaveProperty("source");
        expect(meta).toHaveProperty("count");
        expect(meta).toHaveProperty("timeMs");
        expect(meta).toHaveProperty("success");
        
        expect(typeof meta.source).toBe("string");
        expect(typeof meta.count).toBe("number");
        expect(typeof meta.timeMs).toBe("number");
        expect(typeof meta.success).toBe("boolean");
        
        expect(meta.count).toBeGreaterThanOrEqual(0);
        expect(meta.timeMs).toBeGreaterThanOrEqual(0);
      });
    });

    it("should track total time", async () => {
      const result = await manager.retrieveAll({
        query: "test",
        tags: [],
        nRetrieve: 10,
      });

      expect(typeof result.totalTimeMs).toBe("number");
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("should have totalTimeMs >= max(individual times)", async () => {
      const result = await manager.retrieveAll({
        query: "test",
        tags: [],
        nRetrieve: 10,
      });

      const maxIndividualTime = Math.max(...result.metadata.map((m) => m.timeMs));
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(maxIndividualTime);
    });
  });

  describe("Source Configuration", () => {
    it("should respect enableFts=false", async () => {
      const result = await manager.retrieveAll({
        query: "test",
        tags: [],
        nRetrieve: 10,
        sourceConfig: {
          enableFts: false,
          enableEmbeddings: true,
          enableRecentlyEdited: true,
          enableRepoMap: true,
          enableLspDefinitions: true,
          enableImportAnalysis: true,
          enableRecentlyVisitedRanges: true,
          enableStaticContext: true,
          enableToolBasedSearch: true,
        },
      });

      const ftsMetadata = result.metadata.find((m) => m.source === "fts");
      expect(ftsMetadata).toBeUndefined();
    });

    it("should only retrieve from enabled sources", async () => {
      const result = await manager.retrieveAll({
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

      expect(result.metadata.length).toBe(1);
      expect(result.metadata[0].source).toBe("fts");
    });
  });

  describe("Empty Query Handling", () => {
    it("should handle empty query", async () => {
      const result = await manager.retrieveAll({
        query: "",
        tags: [],
        nRetrieve: 10,
      });

      expect(result).toBeDefined();
      expect(result.sources.fts).toEqual([]);
    });

    it("should handle whitespace-only query", async () => {
      const result = await manager.retrieveAll({
        query: "   ",
        tags: [],
        nRetrieve: 10,
      });

      expect(result).toBeDefined();
      expect(result.sources.fts).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should not throw when a source fails", async () => {
      const errorIDE = {
        getOpenFiles: vi.fn().mockResolvedValue([]),
        readFile: vi.fn().mockRejectedValue(new Error("Read error")),
      } as any;

      const errorManager = new MultiSourceRetrievalManager({
        llm: {} as any,
        config: { selectedModelByRole: {}, experimental: {} } as any,
        ide: errorIDE,
        lanceDbIndex: null,
      });

      await expect(
        errorManager.retrieveAll({
          query: "test",
          tags: [],
          nRetrieve: 10,
        })
      ).resolves.toBeDefined();
    });

    it("should mark failed sources in metadata", async () => {
      const errorIDE = {
        getOpenFiles: vi.fn().mockResolvedValue(["/test.ts"]),
        readFile: vi.fn().mockRejectedValue(new Error("Read error")),
      } as any;

      const errorManager = new MultiSourceRetrievalManager({
        llm: {} as any,
        config: { selectedModelByRole: {}, experimental: {} } as any,
        ide: errorIDE,
        lanceDbIndex: null,
      });

      const result = await errorManager.retrieveAll({
        query: "test",
        tags: [],
        nRetrieve: 10,
      });

      const recentlyEditedMeta = result.metadata.find(
        (m) => m.source === "recentlyEdited"
      );

      if (recentlyEditedMeta) {
        expect(recentlyEditedMeta.success).toBe(false);
        expect(recentlyEditedMeta.error).toBeDefined();
        expect(typeof recentlyEditedMeta.error).toBe("string");
      }
    });
  });

  describe("Performance", () => {
    it("should complete in reasonable time", async () => {
      const startTime = Date.now();
      
      await manager.retrieveAll({
        query: "test",
        tags: [],
        nRetrieve: 10,
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });
});

