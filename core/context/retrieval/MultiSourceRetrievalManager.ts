/**
 * Multi-Source Retrieval Manager
 *
 * Coordinates parallel retrieval from multiple context sources:
 * - FTS (Full-Text Search)
 * - Embeddings (Vector Search)
 * - Recently Edited Files
 * - Repo Map
 * - LSP Definitions (NEW)
 * - Import Analysis (NEW)
 * - Recently Visited Ranges (NEW)
 * - Static Context (NEW)
 * - Tool-Based Search (NEW)
 *
 * Phase 1.2 of Context Engine Enhancement
 * @see CONTEXT_ENGINE_IMPROVEMENT_ROADMAP.md
 */

import { openedFilesLruCache } from "../../autocomplete/util/openedFilesLruCache.js";
import {
  BranchAndDir,
  Chunk,
  ContinueConfig,
  IDE,
  ILLM,
} from "../../index.d.js";
import { chunkDocument } from "../../indexing/chunk/chunk.js";
import { FullTextSearchCodebaseIndex } from "../../indexing/FullTextSearchCodebaseIndex.js";
import { LanceDbIndex } from "../../indexing/LanceDbIndex.js";
import { Telemetry } from "../../util/posthog.js";
import { requestFilesFromRepoMap } from "./repoMapRequest.js";
import RetrievalLogger, {
  type RetrievalLoggerConfig,
} from "./RetrievalLogger.js";
import { getCleanedTrigrams } from "./util.js";

import {
  DEFAULT_SOURCE_CONFIG,
  EnhancedRetrievalResult,
  EnhancedRetrievalSources,
  RetrievalSourceConfig,
  RetrievalSourceMetadata,
  createEmptyRetrievalSources,
  getEnabledSources,
} from "./types/EnhancedRetrievalTypes.js";

const DEFAULT_CHUNK_SIZE = 384;

/**
 * Options for MultiSourceRetrievalManager
 */
export interface MultiSourceRetrievalManagerOptions {
  llm: ILLM;
  config: ContinueConfig;
  ide: IDE;
  ftsIndex?: FullTextSearchCodebaseIndex;
  lanceDbIndex?: LanceDbIndex | null;
  loggerConfig?: RetrievalLoggerConfig;
}

/**
 * Arguments for retrieval
 */
export interface RetrievalArguments {
  query: string;
  tags: BranchAndDir[];
  filterDirectory?: string;
  nRetrieve: number;
  sourceConfig?: RetrievalSourceConfig;
}

/**
 * MultiSourceRetrievalManager
 *
 * Manages parallel retrieval from all enabled context sources.
 * Handles errors gracefully and tracks performance metrics.
 */
export class MultiSourceRetrievalManager {
  private ftsIndex: FullTextSearchCodebaseIndex;
  private lanceDbIndex: LanceDbIndex | null = null;
  private logger: RetrievalLogger;

  constructor(private readonly options: MultiSourceRetrievalManagerOptions) {
    this.ftsIndex = options.ftsIndex || new FullTextSearchCodebaseIndex();
    this.lanceDbIndex = options.lanceDbIndex || null;
    this.logger = RetrievalLogger.getInstance(options.loggerConfig);
  }

  /**
   * Retrieve from all enabled sources in parallel
   */
  async retrieveAll(
    args: RetrievalArguments,
  ): Promise<EnhancedRetrievalResult> {
    const startTime = Date.now();
    const sourceConfig = args.sourceConfig || DEFAULT_SOURCE_CONFIG;
    const enabled = getEnabledSources(sourceConfig);

    // Log retrieval start
    const enabledSourceNames = Object.entries(enabled)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([name, _]) => name);
    const retrievalId = this.logger.logRetrievalStart(
      args.query,
      args.nRetrieve,
      enabledSourceNames,
    );

    const sources = createEmptyRetrievalSources();
    const metadata: RetrievalSourceMetadata[] = [];

    // Create retrieval promises for all enabled sources
    const retrievalPromises: Promise<void>[] = [];

    // FTS
    if (enabled.fts) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "fts",
          () => this.retrieveFts(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // Embeddings
    if (enabled.embeddings) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "embeddings",
          () => this.retrieveEmbeddings(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // Recently Edited
    if (enabled.recentlyEdited) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "recentlyEdited",
          () => this.retrieveRecentlyEdited(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // Repo Map
    if (enabled.repoMap) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "repoMap",
          () => this.retrieveRepoMap(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // LSP Definitions (NEW - placeholder for Phase 2.1)
    if (enabled.lspDefinitions) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "lspDefinitions",
          () => this.retrieveLspDefinitions(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // Import Analysis (NEW - placeholder for Phase 2.2)
    if (enabled.importAnalysis) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "importAnalysis",
          () => this.retrieveImportAnalysis(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // Recently Visited Ranges (NEW - placeholder for Phase 2.3)
    if (enabled.recentlyVisitedRanges) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "recentlyVisitedRanges",
          () => this.retrieveRecentlyVisitedRanges(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // Static Context (NEW - placeholder for Phase 2.4)
    if (enabled.staticContext) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "staticContext",
          () => this.retrieveStaticContext(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // Tool-Based Search (NEW - placeholder for Phase 2.5)
    if (enabled.toolBasedSearch) {
      retrievalPromises.push(
        this.retrieveFromSource(
          "toolBasedSearch",
          () => this.retrieveToolBased(args),
          sources,
          metadata,
          retrievalId,
        ),
      );
    }

    // Wait for all retrievals to complete
    await Promise.all(retrievalPromises);

    const totalTimeMs = Date.now() - startTime;

    // Count total chunks
    const totalChunks = Object.values(sources).reduce(
      (sum, chunks) => sum + chunks.length,
      0,
    );

    // Log retrieval completion
    this.logger.logRetrievalComplete(retrievalId, totalChunks);

    return {
      sources,
      metadata,
      totalTimeMs,
    };
  }

  /**
   * Helper to retrieve from a single source with error handling and metrics
   */
  private async retrieveFromSource(
    sourceName: keyof EnhancedRetrievalSources,
    retrieveFn: () => Promise<Chunk[]>,
    sources: EnhancedRetrievalSources,
    metadata: RetrievalSourceMetadata[],
    retrievalId?: string,
  ): Promise<void> {
    const startTime = Date.now();

    // Log source start
    if (retrievalId) {
      this.logger.logSourceStart(retrievalId, sourceName);
    }

    try {
      const chunks = await retrieveFn();
      sources[sourceName] = chunks;

      // Log source completion
      if (retrievalId) {
        this.logger.logSourceComplete(
          retrievalId,
          sourceName,
          chunks.length,
          startTime,
        );
      }

      metadata.push({
        source: sourceName,
        count: chunks.length,
        timeMs: Date.now() - startTime,
        success: true,
      });
    } catch (error) {
      // Log error
      if (retrievalId && error instanceof Error) {
        this.logger.logSourceError(retrievalId, sourceName, error, startTime);
      }

      // Log error but don't fail the entire retrieval
      console.error(`Error retrieving from ${sourceName}:`, error);
      await Telemetry.captureError(
        `multi_source_${sourceName}_retrieval`,
        error,
      );

      sources[sourceName] = [];
      metadata.push({
        source: sourceName,
        count: 0,
        timeMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ===== Existing Source Implementations =====

  /**
   * Retrieve from Full-Text Search
   */
  private async retrieveFts(args: RetrievalArguments): Promise<Chunk[]> {
    if (args.query.trim() === "") {
      return [];
    }

    const tokens = getCleanedTrigrams(args.query).join(" OR ");

    return await this.ftsIndex.retrieve({
      n: args.nRetrieve,
      text: tokens,
      tags: args.tags,
      directory: args.filterDirectory,
    });
  }

  /**
   * Retrieve from Vector Embeddings
   */
  private async retrieveEmbeddings(args: RetrievalArguments): Promise<Chunk[]> {
    if (!this.lanceDbIndex) {
      return [];
    }

    if (!this.options.config.selectedModelByRole.embed) {
      return [];
    }

    return await this.lanceDbIndex.retrieve(
      args.query,
      args.nRetrieve,
      args.tags,
      args.filterDirectory,
    );
  }

  /**
   * Retrieve from Recently Edited Files
   */
  private async retrieveRecentlyEdited(
    args: RetrievalArguments,
  ): Promise<Chunk[]> {
    const recentlyEditedFilesSlice = Array.from(
      openedFilesLruCache.keys(),
    ).slice(0, args.nRetrieve);

    // Include open files if not enough recently edited
    if (recentlyEditedFilesSlice.length < args.nRetrieve) {
      const openFiles = await this.options.ide.getOpenFiles();
      recentlyEditedFilesSlice.push(
        ...openFiles.slice(0, args.nRetrieve - recentlyEditedFilesSlice.length),
      );
    }

    const chunks: Chunk[] = [];

    for (const filepath of recentlyEditedFilesSlice) {
      const contents = await this.options.ide.readFile(filepath);
      const fileChunks = chunkDocument({
        filepath,
        contents,
        maxChunkSize:
          this.options.config.selectedModelByRole.embed
            ?.maxEmbeddingChunkSize ?? DEFAULT_CHUNK_SIZE,
        digest: filepath,
      });

      for await (const chunk of fileChunks) {
        chunks.push(chunk);
      }
    }

    return chunks.slice(0, args.nRetrieve);
  }

  /**
   * Retrieve from Repo Map
   */
  private async retrieveRepoMap(args: RetrievalArguments): Promise<Chunk[]> {
    return await requestFilesFromRepoMap(
      this.options.llm,
      this.options.config,
      this.options.ide,
      args.query,
      args.filterDirectory,
    );
  }

  // ===== New Source Implementations (Placeholders for Phase 2) =====

  /**
   * Retrieve from LSP Definitions
   * TODO: Implement in Phase 2.1
   */
  private async retrieveLspDefinitions(
    _args: RetrievalArguments,
  ): Promise<Chunk[]> {
    // Placeholder - will be implemented in Phase 2.1
    return [];
  }

  /**
   * Retrieve from Import Analysis
   * TODO: Implement in Phase 2.2
   */
  private async retrieveImportAnalysis(
    _args: RetrievalArguments,
  ): Promise<Chunk[]> {
    // Placeholder - will be implemented in Phase 2.2
    return [];
  }

  /**
   * Retrieve from Recently Visited Ranges
   * TODO: Implement in Phase 2.3
   */
  private async retrieveRecentlyVisitedRanges(
    _args: RetrievalArguments,
  ): Promise<Chunk[]> {
    // Placeholder - will be implemented in Phase 2.3
    return [];
  }

  /**
   * Retrieve from Static Context
   * TODO: Implement in Phase 2.4
   */
  private async retrieveStaticContext(
    _args: RetrievalArguments,
  ): Promise<Chunk[]> {
    // Placeholder - will be implemented in Phase 2.4
    return [];
  }

  /**
   * Retrieve from Tool-Based Search
   * TODO: Implement in Phase 2.5
   */
  private async retrieveToolBased(_args: RetrievalArguments): Promise<Chunk[]> {
    // Placeholder - will be implemented in Phase 2.5
    return [];
  }
}
