/**
 * LSP Definitions Retriever
 *
 * Retrieves code context using Language Server Protocol (LSP) to find:
 * - Symbol definitions
 * - Type definitions
 * - References
 * - Document symbols
 *
 * This provides precise, IDE-powered code navigation for better context retrieval.
 */

import {
  Chunk,
  DocumentSymbol,
  IDE,
  Location,
  RangeInFile,
} from "../../../index.js";
import { logDebug, logError, logInfo, LogSource } from "../LogCollector.js";

/**
 * Configuration for LSP retrieval
 */
export interface LspRetrievalConfig {
  /**
   * Whether to include definitions (default: true)
   */
  includeDefinitions?: boolean;

  /**
   * Whether to include type definitions (default: true)
   */
  includeTypeDefinitions?: boolean;

  /**
   * Whether to include references (default: false)
   * Note: Can be expensive for popular symbols
   */
  includeReferences?: boolean;

  /**
   * Maximum number of references to retrieve per symbol (default: 10)
   */
  maxReferencesPerSymbol?: number;

  /**
   * Maximum chunk size for chunking file content (default: 512)
   */
  maxChunkSize?: number;

  /**
   * Context lines to include around the target range (default: 5)
   */
  contextLines?: number;
}

const DEFAULT_CONFIG: Required<LspRetrievalConfig> = {
  includeDefinitions: true,
  includeTypeDefinitions: true,
  includeReferences: false,
  maxReferencesPerSymbol: 10,
  maxChunkSize: 512,
  contextLines: 5,
};

/**
 * Symbol information extracted from query
 */
interface SymbolInfo {
  name: string;
  location?: Location; // If we know the location (e.g., from current file)
}

/**
 * LSP Definitions Retriever
 *
 * Uses IDE's LSP capabilities to retrieve relevant code context
 */
export class LspDefinitionsRetriever {
  private config: Required<LspRetrievalConfig>;

  constructor(
    private readonly ide: IDE,
    config: LspRetrievalConfig = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Retrieve chunks using LSP
   *
   * @param query - User query containing symbols
   * @param n - Maximum number of chunks to return
   * @param currentFile - Optional current file path for context
   * @returns Array of chunks with LSP-retrieved content
   */
  async retrieve(
    query: string,
    n: number,
    currentFile?: string,
  ): Promise<Chunk[]> {
    const startTime = Date.now();

    try {
      logInfo(LogSource.RETRIEVAL, "LSP retrieval started", {
        query: query.substring(0, 100),
        n,
        currentFile,
        config: this.config,
      });

      // 1. Extract symbols from query
      const symbols = this.extractSymbols(query);

      if (symbols.length === 0) {
        logDebug(
          LogSource.RETRIEVAL,
          "LSP retrieval skipped: no symbols found",
        );
        return [];
      }

      logDebug(LogSource.RETRIEVAL, "Symbols extracted from query", {
        symbols: symbols.map((s) => s.name),
        count: symbols.length,
      });

      // 2. Get LSP locations for symbols
      const allRanges: RangeInFile[] = [];

      for (const symbol of symbols) {
        const ranges = await this.getSymbolLocations(symbol, currentFile);
        allRanges.push(...ranges);
      }

      if (allRanges.length === 0) {
        logDebug(LogSource.RETRIEVAL, "LSP retrieval: no locations found");
        return [];
      }

      logDebug(LogSource.RETRIEVAL, "LSP locations retrieved", {
        totalRanges: allRanges.length,
        uniqueFiles: new Set(allRanges.map((r) => r.filepath)).size,
      });

      // 3. Deduplicate ranges
      const uniqueRanges = this.deduplicateRanges(allRanges);

      // 4. Convert ranges to chunks
      const chunks = await this.rangesToChunks(uniqueRanges);

      // 5. Limit to n chunks
      const finalChunks = chunks.slice(0, n);

      const duration = Date.now() - startTime;
      logInfo(LogSource.RETRIEVAL, "LSP retrieval completed", {
        query: query.substring(0, 100),
        symbols: symbols.length,
        ranges: allRanges.length,
        uniqueRanges: uniqueRanges.length,
        chunks: finalChunks.length,
        durationMs: duration,
      });

      return finalChunks;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(
        LogSource.RETRIEVAL,
        "LSP retrieval failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          query: query.substring(0, 100),
          n,
          durationMs: duration,
        },
      );
      // Return empty array instead of throwing to allow graceful degradation
      return [];
    }
  }

  /**
   * Extract symbols from query
   *
   * Looks for:
   * - PascalCase identifiers (classes, types)
   * - camelCase identifiers (functions, variables)
   * - UPPER_CASE identifiers (constants)
   *
   * @param query - User query
   * @returns Array of symbol information
   */
  private extractSymbols(query: string): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const seen = new Set<string>();

    // Pattern 1: PascalCase (classes, types, interfaces)
    const pascalCaseRegex = /\b[A-Z][a-zA-Z0-9]*\b/g;
    const pascalMatches = query.match(pascalCaseRegex) || [];

    // Pattern 2: camelCase (functions, variables)
    const camelCaseRegex = /\b[a-z][a-zA-Z0-9]*\b/g;
    const camelMatches = query.match(camelCaseRegex) || [];

    // Pattern 3: UPPER_CASE (constants)
    const upperCaseRegex = /\b[A-Z][A-Z0-9_]+\b/g;
    const upperMatches = query.match(upperCaseRegex) || [];

    // Combine all matches
    const allMatches = [...pascalMatches, ...camelMatches, ...upperMatches];

    // Filter out common words and duplicates
    const commonWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
      "I",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
    ]);

    for (const match of allMatches) {
      const lower = match.toLowerCase();
      if (!seen.has(lower) && !commonWords.has(lower) && match.length > 2) {
        seen.add(lower);
        symbols.push({ name: match });
      }
    }

    return symbols;
  }

  /**
   * Get LSP locations for a symbol
   *
   * @param symbol - Symbol information
   * @param currentFile - Optional current file for context
   * @returns Array of ranges where symbol is defined/referenced
   */
  private async getSymbolLocations(
    symbol: SymbolInfo,
    currentFile?: string,
  ): Promise<RangeInFile[]> {
    const ranges: RangeInFile[] = [];

    try {
      // If we have a location, use it directly
      if (symbol.location) {
        if (this.config.includeDefinitions) {
          const definitions = await this.ide.gotoDefinition(symbol.location);
          ranges.push(...definitions);
        }

        if (this.config.includeTypeDefinitions) {
          const typeDefinitions = await this.ide.gotoTypeDefinition(
            symbol.location,
          );
          ranges.push(...typeDefinitions);
        }

        if (this.config.includeReferences) {
          const references = await this.ide.getReferences(symbol.location);
          ranges.push(
            ...references.slice(0, this.config.maxReferencesPerSymbol),
          );
        }
      } else if (currentFile) {
        // Try to find symbol in current file using document symbols
        const docSymbols = await this.ide.getDocumentSymbols(currentFile);
        const matchingSymbols = this.findMatchingSymbols(
          docSymbols,
          symbol.name,
        );

        for (const docSymbol of matchingSymbols) {
          const location: Location = {
            filepath: currentFile,
            position: {
              line: docSymbol.range.start.line,
              character: docSymbol.range.start.character,
            },
          };

          // Recursively get locations for this symbol
          const symbolRanges = await this.getSymbolLocations(
            { ...symbol, location },
            currentFile,
          );
          ranges.push(...symbolRanges);
        }
      }
    } catch (error) {
      logDebug(
        LogSource.RETRIEVAL,
        `Failed to get LSP locations for symbol: ${symbol.name}`,
        { error: error instanceof Error ? error.message : String(error) },
      );
    }

    return ranges;
  }

  /**
   * Find matching symbols in document symbols tree
   *
   * @param symbols - Document symbols (can be nested)
   * @param name - Symbol name to find
   * @returns Array of matching document symbols
   */
  private findMatchingSymbols(
    symbols: DocumentSymbol[],
    name: string,
  ): DocumentSymbol[] {
    const matches: DocumentSymbol[] = [];

    for (const symbol of symbols) {
      // Check if this symbol matches
      if (symbol.name === name || symbol.name.includes(name)) {
        matches.push(symbol);
      }

      // Recursively check children
      if (symbol.children && symbol.children.length > 0) {
        const childMatches = this.findMatchingSymbols(symbol.children, name);
        matches.push(...childMatches);
      }
    }

    return matches;
  }

  /**
   * Deduplicate ranges based on filepath and range
   *
   * @param ranges - Array of ranges
   * @returns Deduplicated array
   */
  private deduplicateRanges(ranges: RangeInFile[]): RangeInFile[] {
    const seen = new Set<string>();
    const unique: RangeInFile[] = [];

    for (const range of ranges) {
      const key = `${range.filepath}:${range.range.start.line}:${range.range.start.character}:${range.range.end.line}:${range.range.end.character}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(range);
      }
    }

    return unique;
  }

  /**
   * Convert ranges to chunks
   *
   * Reads file content and creates chunks with context
   *
   * @param ranges - Array of ranges
   * @returns Array of chunks
   */
  private async rangesToChunks(ranges: RangeInFile[]): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    const fileCache = new Map<string, string>();

    for (const range of ranges) {
      try {
        // Get file content (with caching)
        let content: string;
        if (fileCache.has(range.filepath)) {
          content = fileCache.get(range.filepath)!;
        } else {
          content = await this.ide.readFile(range.filepath);
          fileCache.set(range.filepath, content);
        }

        // Calculate lines with context
        const lines = content.split("\n");
        const startLine = Math.max(
          0,
          range.range.start.line - this.config.contextLines,
        );
        const endLine = Math.min(
          lines.length - 1,
          range.range.end.line + this.config.contextLines,
        );

        // Extract content
        const chunkContent = lines.slice(startLine, endLine + 1).join("\n");

        // Create chunk
        const chunk: Chunk = {
          content: chunkContent,
          startLine,
          endLine,
          digest: `${range.filepath}:${startLine}:${endLine}`,
          filepath: range.filepath,
          index: chunks.length,
          otherMetadata: {
            source: "lsp",
            targetRange: range.range,
            contextLines: this.config.contextLines,
          },
        };

        chunks.push(chunk);
      } catch (error) {
        logDebug(
          LogSource.RETRIEVAL,
          `Failed to read file for LSP range: ${range.filepath}`,
          { error: error instanceof Error ? error.message : String(error) },
        );
      }
    }

    return chunks;
  }

  /**
   * Get configuration
   */
  getConfig(): Required<LspRetrievalConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LspRetrievalConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
