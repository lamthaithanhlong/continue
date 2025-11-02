/**
 * Enhanced Retrieval Types for Multi-Source Context Engine
 *
 * This file defines the enhanced retrieval pipeline interfaces that support
 * multiple context sources beyond the basic FTS, embeddings, and recently edited files.
 *
 * Phase 1.1 of Context Engine Enhancement
 * @see CONTEXT_ENGINE_IMPROVEMENT_ROADMAP.md
 */

import { BranchAndDir, Chunk } from "../../../index.d.js";

// Re-export types for convenience
export type { BranchAndDir, Chunk };

/**
 * Configuration for individual retrieval sources
 */
export interface RetrievalSourceConfig {
  /** Enable/disable Full-Text Search */
  enableFts?: boolean;
  /** Enable/disable Vector Embeddings */
  enableEmbeddings?: boolean;
  /** Enable/disable Recently Edited Files */
  enableRecentlyEdited?: boolean;
  /** Enable/disable Repo Map */
  enableRepoMap?: boolean;
  /** Enable/disable LSP Definitions (NEW) */
  enableLspDefinitions?: boolean;
  /** Enable/disable Import Analysis (NEW) */
  enableImportAnalysis?: boolean;
  /** Enable/disable Recently Visited Ranges (NEW) */
  enableRecentlyVisitedRanges?: boolean;
  /** Enable/disable Static Context Analysis (NEW) */
  enableStaticContext?: boolean;
  /** Enable/disable Tool-Based Search (NEW) */
  enableToolBasedSearch?: boolean;
}

/**
 * Default configuration
 *
 * Phase 1 sources (implemented): enabled by default
 * Phase 2 sources (placeholders): disabled by default
 */
export const DEFAULT_SOURCE_CONFIG: RetrievalSourceConfig = {
  // Phase 1 sources (implemented)
  enableFts: true,
  enableEmbeddings: true,
  enableRecentlyEdited: true,
  enableRepoMap: true,

  // Phase 2 sources
  enableLspDefinitions: true, // ✅ Phase 2.1 - Implemented
  enableImportAnalysis: false, // TODO: Phase 2.2
  enableRecentlyVisitedRanges: false, // TODO: Phase 2.3
  enableStaticContext: false, // TODO: Phase 2.4
  enableToolBasedSearch: false, // TODO: Phase 2.5
};

/**
 * Results from multiple retrieval sources
 *
 * This interface aggregates chunks from all available context sources.
 * Each source is optional to allow for graceful degradation if a source fails.
 */
export interface EnhancedRetrievalSources {
  // ===== EXISTING SOURCES =====

  /** Chunks from Full-Text Search (trigram-based) */
  fts: Chunk[];

  /** Chunks from Vector Embeddings (LanceDB) */
  embeddings: Chunk[];

  /** Chunks from Recently Edited Files (LRU cache) */
  recentlyEdited: Chunk[];

  /** Chunks from Repository Map (LLM-generated structure) */
  repoMap: Chunk[];

  // ===== NEW SOURCES =====

  /** Chunks from LSP Definitions (IDE language server) */
  lspDefinitions: Chunk[];

  /** Chunks from Import Analysis (dependency graph) */
  importAnalysis: Chunk[];

  /** Chunks from Recently Visited Ranges (user navigation patterns) */
  recentlyVisitedRanges: Chunk[];

  /** Chunks from Static Context Analysis (pattern matching) */
  staticContext: Chunk[];

  /** Chunks from Tool-Based Search (intelligent tool calling) */
  toolBasedSearch: Chunk[];
}

/**
 * Metadata about retrieval performance for each source
 */
export interface RetrievalSourceMetadata {
  /** Source name */
  source: keyof EnhancedRetrievalSources;
  /** Number of chunks retrieved */
  count: number;
  /** Time taken in milliseconds */
  timeMs: number;
  /** Whether retrieval succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Complete retrieval result with metadata
 */
export interface EnhancedRetrievalResult {
  /** Retrieved chunks from all sources */
  sources: EnhancedRetrievalSources;
  /** Metadata about each source's performance */
  metadata: RetrievalSourceMetadata[];
  /** Total time taken for all retrievals */
  totalTimeMs: number;
}

/**
 * Options for the fusion process
 */
export interface FusionOptions {
  /** Maximum number of final chunks to return */
  maxChunks: number;
  /** Enable semantic deduplication */
  enableSemanticDedup?: boolean;
  /** Enable cross-reference analysis */
  enableCrossReference?: boolean;
  /** Weights for each source (will be normalized) */
  sourceWeights?: Partial<Record<keyof EnhancedRetrievalSources, number>>;
}

/**
 * Default fusion options
 */
export const DEFAULT_FUSION_OPTIONS: FusionOptions = {
  maxChunks: 30,
  enableSemanticDedup: true,
  enableCrossReference: true,
  sourceWeights: {
    fts: 0.15,
    embeddings: 0.25,
    recentlyEdited: 0.15,
    repoMap: 0.1,
    lspDefinitions: 0.15,
    importAnalysis: 0.1,
    recentlyVisitedRanges: 0.05,
    staticContext: 0.03,
    toolBasedSearch: 0.02,
  },
};

/**
 * Arguments for running the enhanced retrieval pipeline
 * Extends the basic RetrievalPipelineRunArguments
 */
export interface EnhancedRetrievalPipelineRunArguments {
  /** Search query */
  query: string;
  /** Repository branches and directories to search */
  tags: BranchAndDir[];
  /** Optional directory filter */
  filterDirectory?: string;
  /** Whether to include embeddings (for backward compatibility) */
  includeEmbeddings: boolean;
  /** Configuration for which sources to use */
  sourceConfig?: RetrievalSourceConfig;
  /** Options for fusion process */
  fusionOptions?: FusionOptions;
  /** Current file path (for context-aware retrieval) */
  currentFilePath?: string;
}

/**
 * Enhanced Retrieval Pipeline Interface
 *
 * Extends the basic IRetrievalPipeline with multi-source capabilities.
 * Maintains backward compatibility while adding new functionality.
 */
export interface IEnhancedRetrievalPipeline {
  /**
   * Run the basic retrieval pipeline (backward compatible)
   * @param args Basic retrieval arguments
   * @returns Array of chunks
   */
  run(args: {
    query: string;
    tags: BranchAndDir[];
    filterDirectory?: string;
    includeEmbeddings: boolean;
  }): Promise<Chunk[]>;

  /**
   * Retrieve chunks from multiple sources in parallel
   *
   * This method coordinates retrieval from all enabled sources and returns
   * the raw results without fusion. Useful for debugging or custom fusion logic.
   *
   * @param args Enhanced retrieval arguments
   * @returns Results from all sources with metadata
   */
  retrieveFromMultipleSources(
    args: EnhancedRetrievalPipelineRunArguments,
  ): Promise<EnhancedRetrievalResult>;

  /**
   * Fuse results from multiple sources into a single ranked list
   *
   * This method takes raw results from multiple sources and:
   * 1. Deduplicates chunks (semantic or exact)
   * 2. Analyzes cross-references between chunks
   * 3. Ranks chunks based on composite scoring
   * 4. Returns top N chunks
   *
   * @param sources Raw retrieval results from all sources
   * @param options Fusion options (weights, dedup, etc.)
   * @returns Fused and ranked chunks
   */
  fuseResults(
    sources: EnhancedRetrievalSources,
    options?: FusionOptions,
  ): Promise<Chunk[]>;

  /**
   * Run the enhanced pipeline end-to-end
   *
   * Convenience method that combines retrieveFromMultipleSources and fuseResults.
   * This is the recommended way to use the enhanced pipeline.
   *
   * @param args Enhanced retrieval arguments
   * @returns Fused and ranked chunks
   */
  runEnhanced(args: EnhancedRetrievalPipelineRunArguments): Promise<Chunk[]>;
}

/**
 * Helper type to check if a source is enabled
 */
export type EnabledSources = {
  [K in keyof EnhancedRetrievalSources]: boolean;
};

/**
 * Helper function to get enabled sources from config
 */
export function getEnabledSources(
  config: RetrievalSourceConfig = DEFAULT_SOURCE_CONFIG,
): EnabledSources {
  return {
    fts: config.enableFts ?? true,
    embeddings: config.enableEmbeddings ?? true,
    recentlyEdited: config.enableRecentlyEdited ?? true,
    repoMap: config.enableRepoMap ?? true,
    lspDefinitions: config.enableLspDefinitions ?? true,
    importAnalysis: config.enableImportAnalysis ?? true,
    recentlyVisitedRanges: config.enableRecentlyVisitedRanges ?? true,
    staticContext: config.enableStaticContext ?? true,
    toolBasedSearch: config.enableToolBasedSearch ?? true,
  };
}

/**
 * Helper function to create empty retrieval sources
 */
export function createEmptyRetrievalSources(): EnhancedRetrievalSources {
  return {
    fts: [],
    embeddings: [],
    recentlyEdited: [],
    repoMap: [],
    lspDefinitions: [],
    importAnalysis: [],
    recentlyVisitedRanges: [],
    staticContext: [],
    toolBasedSearch: [],
  };
}

/**
 * Helper function to count total chunks across all sources
 */
export function countTotalChunks(sources: EnhancedRetrievalSources): number {
  return (
    sources.fts.length +
    sources.embeddings.length +
    sources.recentlyEdited.length +
    sources.repoMap.length +
    sources.lspDefinitions.length +
    sources.importAnalysis.length +
    sources.recentlyVisitedRanges.length +
    sources.staticContext.length +
    sources.toolBasedSearch.length
  );
}

/**
 * Helper function to merge all chunks from sources into a single array
 */
export function mergeAllChunks(sources: EnhancedRetrievalSources): Chunk[] {
  return [
    ...sources.fts,
    ...sources.embeddings,
    ...sources.recentlyEdited,
    ...sources.repoMap,
    ...sources.lspDefinitions,
    ...sources.importAnalysis,
    ...sources.recentlyVisitedRanges,
    ...sources.staticContext,
    ...sources.toolBasedSearch,
  ];
}
