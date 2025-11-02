/**
 * Type definitions for Dependency Graph Builder
 *
 * This module defines types for building and querying dependency graphs
 * based on import relationships between files.
 */

/**
 * Represents a node in the dependency graph
 */
export interface DependencyNode {
  /** Absolute file path */
  filepath: string;

  /** Files that this file imports (outgoing edges) */
  imports: Set<string>;

  /** Files that import this file (incoming edges) */
  importedBy: Set<string>;

  /** Metadata about the file */
  metadata?: {
    /** Last time this node was updated */
    lastUpdated?: number;

    /** Number of imports */
    importCount?: number;

    /** Number of files importing this */
    importedByCount?: number;
  };
}

/**
 * Represents the entire dependency graph
 */
export interface DependencyGraph {
  /** Map from filepath to dependency node */
  nodes: Map<string, DependencyNode>;

  /** Metadata about the graph */
  metadata: {
    /** Total number of nodes */
    nodeCount: number;

    /** Total number of edges (import relationships) */
    edgeCount: number;

    /** When the graph was last built */
    lastBuilt: number;

    /** Files that have circular dependencies */
    circularDependencies?: string[][];
  };
}

/**
 * Options for building the dependency graph
 */
export interface DependencyGraphBuildOptions {
  /** Maximum depth to traverse when analyzing imports */
  maxDepth?: number;

  /** Whether to detect circular dependencies */
  detectCircular?: boolean;

  /** File patterns to exclude from analysis */
  excludePatterns?: string[];

  /** Whether to include node_modules or similar */
  includeExternal?: boolean;
}

/**
 * Options for finding related files
 */
export interface FindRelatedFilesOptions {
  /** Maximum depth to traverse (default: 2) */
  maxDepth?: number;

  /** Direction to traverse: 'imports', 'importedBy', or 'both' */
  direction?: "imports" | "importedBy" | "both";

  /** Maximum number of files to return */
  maxFiles?: number;

  /** Whether to include the source file in results */
  includeSelf?: boolean;
}

/**
 * Represents a path between two files in the dependency graph
 */
export interface ImportChain {
  /** Starting file */
  from: string;

  /** Ending file */
  to: string;

  /** Ordered list of files in the path (including from and to) */
  path: string[];

  /** Length of the path */
  length: number;
}

/**
 * Result of finding related files
 */
export interface RelatedFilesResult {
  /** The source file */
  sourceFile: string;

  /** Related files grouped by depth */
  filesByDepth: Map<number, Set<string>>;

  /** All related files (flattened) */
  allFiles: string[];

  /** Total number of related files found */
  count: number;
}

/**
 * Statistics about the dependency graph
 */
export interface DependencyGraphStats {
  /** Total number of files */
  totalFiles: number;

  /** Total number of import relationships */
  totalImports: number;

  /** Average imports per file */
  avgImportsPerFile: number;

  /** Files with most imports (top 10) */
  mostImports: Array<{ filepath: string; count: number }>;

  /** Files most imported by others (top 10) */
  mostImportedBy: Array<{ filepath: string; count: number }>;

  /** Number of circular dependencies detected */
  circularDependencyCount: number;

  /** Files with no imports */
  isolatedFiles: string[];
}

/**
 * Event emitted when the graph is updated
 */
export interface DependencyGraphUpdateEvent {
  /** Type of update */
  type: "add" | "remove" | "update";

  /** Files affected */
  files: string[];

  /** Timestamp */
  timestamp: number;
}
