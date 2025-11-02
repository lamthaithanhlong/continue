// @ts-ignore
import nlp from "wink-nlp-utils";

import {
  BranchAndDir,
  Chunk,
  ContextItem,
  ContinueConfig,
  IDE,
  ILLM,
  Tool,
  ToolExtras,
} from "../../../";
import { openedFilesLruCache } from "../../../autocomplete/util/openedFilesLruCache";
import { chunkDocument } from "../../../indexing/chunk/chunk";
import { FullTextSearchCodebaseIndex } from "../../../indexing/FullTextSearchCodebaseIndex";
import { LanceDbIndex } from "../../../indexing/LanceDbIndex";
import { BuiltInToolNames } from "../../../tools/builtIn";
import { callBuiltInTool } from "../../../tools/callTool";
import { globSearchTool } from "../../../tools/definitions/globSearch";
import { grepSearchTool } from "../../../tools/definitions/grepSearch";
import { lsTool } from "../../../tools/definitions/ls";
import { readFileTool } from "../../../tools/definitions/readFile";
import { viewRepoMapTool } from "../../../tools/definitions/viewRepoMap";
import { viewSubdirectoryTool } from "../../../tools/definitions/viewSubdirectory";
import { DependencyGraphBuilder } from "../DependencyGraphBuilder";
import { logDebug, logError, logInfo, LogSource } from "../LogCollector.js";
import {
  MultiSourceRetrievalManager,
  MultiSourceRetrievalManagerOptions,
} from "../MultiSourceRetrievalManager";
import {
  EnhancedRetrievalResult,
  EnhancedRetrievalSources,
  IEnhancedRetrievalPipeline,
} from "../types/EnhancedRetrievalTypes";

const DEFAULT_CHUNK_SIZE = 384;

const AVAILABLE_TOOLS: Tool[] = [
  globSearchTool,
  grepSearchTool,
  lsTool,
  readFileTool,
  viewRepoMapTool,
  viewSubdirectoryTool,
];

export interface RetrievalPipelineOptions {
  llm: ILLM;
  config: ContinueConfig;
  ide: IDE;
  input: string;
  nRetrieve: number;
  nFinal: number;
  tags: BranchAndDir[];
  filterDirectory?: string;
  // Phase 1.4: Optional enhanced retrieval configuration
  multiSourceOptions?: Partial<MultiSourceRetrievalManagerOptions>;
}

export interface RetrievalPipelineRunArguments {
  query: string;
  tags: BranchAndDir[];
  filterDirectory?: string;
  includeEmbeddings: boolean;
}

export interface IRetrievalPipeline {
  run(args: RetrievalPipelineRunArguments): Promise<Chunk[]>;
}

export default class BaseRetrievalPipeline
  implements IRetrievalPipeline, IEnhancedRetrievalPipeline
{
  private ftsIndex = new FullTextSearchCodebaseIndex();
  private lanceDbIndex: LanceDbIndex | null = null;
  private lanceDbInitPromise: Promise<void> | null = null;

  // Phase 1.4: Enhanced retrieval infrastructure (optional)
  protected multiSourceManager?: MultiSourceRetrievalManager;
  protected dependencyGraphBuilder?: DependencyGraphBuilder;

  constructor(protected readonly options: RetrievalPipelineOptions) {
    void this.initLanceDb();

    // Phase 1.4: Initialize enhanced retrieval components if configured
    if (options.multiSourceOptions) {
      this.multiSourceManager = new MultiSourceRetrievalManager({
        llm: options.llm,
        config: options.config,
        ide: options.ide,
        ftsIndex: this.ftsIndex,
        lanceDbIndex: this.lanceDbIndex,
        ...options.multiSourceOptions,
      });
      this.dependencyGraphBuilder = new DependencyGraphBuilder(options.ide);
    }
  }

  protected async initLanceDb() {
    const embedModel = this.options.config.selectedModelByRole.embed;

    if (!embedModel) {
      return;
    }

    this.lanceDbIndex = await LanceDbIndex.create(embedModel, (uri) =>
      this.options.ide.readFile(uri),
    );
  }

  protected async ensureLanceDbInitialized(): Promise<boolean> {
    if (this.lanceDbIndex) {
      return true;
    }

    if (this.lanceDbInitPromise) {
      await this.lanceDbInitPromise;
      return this.lanceDbIndex !== null;
    }

    this.lanceDbInitPromise = this.initLanceDb();
    await this.lanceDbInitPromise;
    this.lanceDbInitPromise = null; // clear after init

    return this.lanceDbIndex !== null;
  }

  private getCleanedTrigrams(
    query: RetrievalPipelineRunArguments["query"],
  ): string[] {
    let text = nlp.string.removeExtraSpaces(query);
    text = nlp.string.stem(text);

    let tokens = nlp.string
      .tokenize(text, true)
      .filter((token: any) => token.tag === "word")
      .map((token: any) => token.value);

    tokens = nlp.tokens.removeWords(tokens);
    tokens = nlp.tokens.setOfWords(tokens);

    const cleanedTokens = [...tokens].join(" ");
    const trigrams = nlp.string.ngram(cleanedTokens, 3);

    return trigrams.map(this.escapeFtsQueryString);
  }

  private escapeFtsQueryString(query: string): string {
    const escapedDoubleQuotes = query.replace(/"/g, '""');
    return `"${escapedDoubleQuotes}"`;
  }

  protected async retrieveFts(
    args: RetrievalPipelineRunArguments,
    n: number,
  ): Promise<Chunk[]> {
    const startTime = Date.now();

    try {
      logDebug(LogSource.RETRIEVAL, "FTS retrieval started", {
        query: args.query,
        n,
        filterDirectory: args.filterDirectory,
      });

      if (args.query.trim() === "") {
        logDebug(LogSource.RETRIEVAL, "FTS retrieval skipped: empty query");
        return [];
      }

      const tokens = this.getCleanedTrigrams(args.query).join(" OR ");

      const results = await this.ftsIndex.retrieve({
        n,
        text: tokens,
        tags: args.tags,
        directory: args.filterDirectory,
      });

      const duration = Date.now() - startTime;
      logInfo(LogSource.RETRIEVAL, "FTS retrieval completed", {
        query: args.query,
        chunks: results.length,
        durationMs: duration,
      });

      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(
        LogSource.RETRIEVAL,
        "FTS retrieval failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          query: args.query,
          n,
          durationMs: duration,
        },
      );
      throw error;
    }
  }

  protected async retrieveAndChunkRecentlyEditedFiles(
    n: number,
  ): Promise<Chunk[]> {
    const recentlyEditedFilesSlice = Array.from(
      openedFilesLruCache.keys(),
    ).slice(0, n);

    // If the number of recently edited files is less than the retrieval limit,
    // include additional open files. This is useful in the case where a user
    // has many tabs open and reloads their IDE. They now have 0 recently edited files,
    // but many open tabs that represent what they were working on prior to reload.
    if (recentlyEditedFilesSlice.length < n) {
      const openFiles = await this.options.ide.getOpenFiles();
      recentlyEditedFilesSlice.push(
        ...openFiles.slice(0, n - recentlyEditedFilesSlice.length),
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

    return chunks.slice(0, n);
  }

  protected async retrieveEmbeddings(
    input: string,
    n: number,
  ): Promise<Chunk[]> {
    const startTime = Date.now();

    try {
      logDebug(LogSource.RETRIEVAL, "Embeddings retrieval started", {
        input: input.substring(0, 100),
        n,
      });

      const initialized = await this.ensureLanceDbInitialized();

      if (!initialized || !this.lanceDbIndex) {
        logDebug(
          LogSource.RETRIEVAL,
          "Embeddings retrieval skipped: LanceDB not available",
        );
        console.warn(
          "LanceDB index not available, skipping embeddings retrieval",
        );
        return [];
      }

      const results = await this.lanceDbIndex.retrieve(
        input,
        n,
        this.options.tags,
        this.options.filterDirectory,
      );

      const duration = Date.now() - startTime;
      logInfo(LogSource.RETRIEVAL, "Embeddings retrieval completed", {
        input: input.substring(0, 100),
        chunks: results.length,
        durationMs: duration,
      });

      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(
        LogSource.RETRIEVAL,
        "Embeddings retrieval failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          input: input.substring(0, 100),
          n,
          durationMs: duration,
        },
      );
      throw error;
    }
  }

  run(args: RetrievalPipelineRunArguments): Promise<Chunk[]> {
    throw new Error("Not implemented");
  }

  // ===== Phase 1.4: Enhanced Multi-Source Retrieval =====

  /**
   * Retrieve from multiple sources using MultiSourceRetrievalManager
   * This is the new enhanced retrieval method that coordinates all sources
   *
   * @param args - Retrieval arguments
   * @returns EnhancedRetrievalResult with results from all enabled sources and metadata
   */
  async retrieveFromMultipleSources(
    args: RetrievalPipelineRunArguments,
  ): Promise<EnhancedRetrievalResult> {
    const startTime = Date.now();

    try {
      logInfo(LogSource.RETRIEVAL, "Multi-source retrieval started", {
        query: args.query,
        nRetrieve: this.options.nRetrieve,
        filterDirectory: args.filterDirectory,
      });

      if (!this.multiSourceManager) {
        // Fallback: If multi-source manager not initialized, return empty result
        logDebug(
          LogSource.RETRIEVAL,
          "Multi-source retrieval skipped: manager not initialized",
        );
        console.warn(
          "MultiSourceRetrievalManager not initialized. Enable by passing multiSourceOptions to constructor.",
        );
        return {
          sources: {
            fts: [],
            embeddings: [],
            recentlyEdited: [],
            repoMap: [],
            lspDefinitions: [],
            importAnalysis: [],
            recentlyVisitedRanges: [],
            staticContext: [],
            toolBasedSearch: [],
          },
          metadata: [],
          totalTimeMs: 0,
        };
      }

      // Use MultiSourceRetrievalManager to retrieve from all sources
      const result = await this.multiSourceManager.retrieveAll({
        query: args.query,
        nRetrieve: this.options.nRetrieve,
        tags: args.tags,
        filterDirectory: args.filterDirectory,
      });

      const duration = Date.now() - startTime;

      // Count total chunks from all sources
      const totalChunks = Object.values(result.sources).reduce(
        (sum, chunks) => sum + chunks.length,
        0,
      );

      logInfo(LogSource.RETRIEVAL, "Multi-source retrieval completed", {
        query: args.query,
        totalChunks,
        sources: Object.entries(result.sources)
          .filter(([_, chunks]) => chunks.length > 0)
          .map(([source, chunks]) => `${source}:${chunks.length}`)
          .join(", "),
        durationMs: duration,
        totalTimeMs: result.totalTimeMs,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(
        LogSource.RETRIEVAL,
        "Multi-source retrieval failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          query: args.query,
          nRetrieve: this.options.nRetrieve,
          durationMs: duration,
        },
      );
      throw error;
    }
  }

  /**
   * Fuse results from multiple sources into a single ranked list
   * This method can be overridden by subclasses for custom fusion strategies
   *
   * @param sources - Results from all retrieval sources
   * @returns Fused and ranked chunks
   */
  async fuseResults(sources: EnhancedRetrievalSources): Promise<Chunk[]> {
    const startTime = Date.now();

    try {
      logDebug(LogSource.RETRIEVAL, "Fusing results from multiple sources", {
        sourceCounts: {
          fts: sources.fts.length,
          embeddings: sources.embeddings.length,
          recentlyEdited: sources.recentlyEdited.length,
          repoMap: sources.repoMap.length,
          lspDefinitions: sources.lspDefinitions.length,
          importAnalysis: sources.importAnalysis.length,
          recentlyVisitedRanges: sources.recentlyVisitedRanges.length,
          staticContext: sources.staticContext.length,
          toolBasedSearch: sources.toolBasedSearch.length,
        },
      });

      // Default implementation: Simple concatenation
      // Subclasses can override for more sophisticated fusion (e.g., reranking)
      const allChunks: Chunk[] = [
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

      // Remove duplicates based on digest
      const seen = new Set<string>();
      const deduplicated = allChunks.filter((chunk) => {
        if (seen.has(chunk.digest)) {
          return false;
        }
        seen.add(chunk.digest);
        return true;
      });

      const final = deduplicated.slice(0, this.options.nFinal);

      const duration = Date.now() - startTime;
      logInfo(LogSource.RETRIEVAL, "Results fusion completed", {
        totalChunks: allChunks.length,
        deduplicatedChunks: deduplicated.length,
        finalChunks: final.length,
        duplicatesRemoved: allChunks.length - deduplicated.length,
        durationMs: duration,
      });

      return final;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(
        LogSource.RETRIEVAL,
        "Results fusion failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          durationMs: duration,
        },
      );
      throw error;
    }
  }

  /**
   * Get dependency graph builder instance
   * Useful for finding related files based on import relationships
   */
  getDependencyGraphBuilder(): DependencyGraphBuilder | undefined {
    return this.dependencyGraphBuilder;
  }

  /**
   * Run the enhanced pipeline end-to-end
   * Convenience method that combines retrieveFromMultipleSources and fuseResults
   *
   * @param args - Enhanced retrieval arguments
   * @returns Fused and ranked chunks
   */
  async runEnhanced(args: RetrievalPipelineRunArguments): Promise<Chunk[]> {
    const result = await this.retrieveFromMultipleSources(args);
    return this.fuseResults(result.sources);
  }

  protected async retrieveWithTools(input: string): Promise<Chunk[]> {
    const toolSelectionPrompt = `Given the following user input: "${input}"

Available tools:
${AVAILABLE_TOOLS.map((tool) => {
  const requiredParams = tool.function.parameters?.required || [];
  const properties = tool.function.parameters?.properties || {};
  const paramDescriptions = requiredParams
    .map(
      (param: any) => `${param}: ${properties[param]?.description || "string"}`,
    )
    .join(", ");

  return `- ${tool.function.name}: ${tool.function.description}
  Required arguments: ${paramDescriptions || "none"}`;
}).join("\n")}

Determine which tools should be used to answer this query. You should feel free to use multiple tools when they would be helpful for comprehensive results. Respond ONLY a JSON object containing the following and nothing else:
{
  "tools": [
    {
      "name": "<tool_name>",
      "args": { "<required_parameter_name>": "<required_parameter_value>" }
    }
  ]
}`;

    // Get LLM response for tool selection
    const toolSelectionResponse = await this.options.llm.chat(
      [{ role: "user", content: toolSelectionPrompt }],
      new AbortController().signal,
    );

    let toolCalls: { name: string; args: any }[] = [];
    try {
      const responseContent =
        typeof toolSelectionResponse.content === "string"
          ? toolSelectionResponse.content
          : toolSelectionResponse.content
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("");
      const parsed = JSON.parse(responseContent);
      toolCalls = parsed.tools || [];
    } catch (e) {
      console.log(
        `Failed to parse tool selection response: ${toolSelectionResponse.content}\n\n`,
        e,
      );
      return [];
    }

    // Execute tools and collect results
    const allContextItems: ContextItem[] = [];

    const toolExtras: ToolExtras = {
      ide: this.options.ide,
      llm: this.options.llm,
      fetch: fetch,
      tool: grepSearchTool,
      config: this.options.config,
    };

    for (const toolCall of toolCalls) {
      const tool = AVAILABLE_TOOLS.find(
        (t) => t.function.name === toolCall.name,
      )!;

      const args = toolCall.args;
      if (toolCall.name === BuiltInToolNames.GrepSearch) {
        args.splitByFile = true;
      }

      toolExtras.tool = tool;
      const contextItems = await callBuiltInTool(
        toolCall.name,
        args,
        toolExtras,
      );
      allContextItems.push(...contextItems);
    }

    const chunks: Chunk[] = [];

    // Transform ContextItem[] to Chunk[]
    for (let i = 0; i < allContextItems.length; i++) {
      const contextItem = allContextItems[i];
      const filepath = contextItem.uri?.value || contextItem.name || "unknown";
      const cleanedFilepath = filepath.replace(/^file:\/\/\//, "");

      chunks.push({
        content: contextItem.content,
        startLine: -1,
        endLine: -1,
        digest: `file:///${cleanedFilepath}`,
        filepath: `file:///${cleanedFilepath}`,
        index: i,
      });
    }

    console.log("retrieveWithTools chunks", chunks);
    return chunks;
  }
}
