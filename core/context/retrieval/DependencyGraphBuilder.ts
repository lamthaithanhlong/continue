/**
 * Dependency Graph Builder
 *
 * Builds and queries a dependency graph based on import relationships between files.
 * Uses ImportDefinitionsService to extract imports and provides BFS traversal,
 * import chain finding, and circular dependency detection.
 */

import { IDE } from "../..";
import { ImportDefinitionsService } from "../../autocomplete/context/ImportDefinitionsService";
import {
  DependencyGraph,
  DependencyGraphBuildOptions,
  DependencyGraphStats,
  DependencyNode,
  FindRelatedFilesOptions,
  ImportChain,
  RelatedFilesResult,
} from "./types/DependencyGraphTypes";

/**
 * Main class for building and querying dependency graphs
 */
export class DependencyGraphBuilder {
  private graph: DependencyGraph;
  private importService: ImportDefinitionsService;

  constructor(private readonly ide: IDE) {
    this.importService = new ImportDefinitionsService(ide);
    this.graph = {
      nodes: new Map(),
      metadata: {
        nodeCount: 0,
        edgeCount: 0,
        lastBuilt: Date.now(),
      },
    };
  }

  /**
   * Build the dependency graph for a list of files
   */
  async buildGraph(
    files: string[],
    options: DependencyGraphBuildOptions = {},
  ): Promise<DependencyGraph> {
    const startTime = Date.now();

    // Clear existing graph
    this.graph.nodes.clear();

    // Build nodes for each file
    for (const filepath of files) {
      await this.addFileToGraph(filepath);
    }

    // Update metadata
    this.graph.metadata.nodeCount = this.graph.nodes.size;
    this.graph.metadata.edgeCount = this.countEdges();
    this.graph.metadata.lastBuilt = Date.now();

    // Detect circular dependencies if requested
    if (options.detectCircular) {
      this.graph.metadata.circularDependencies =
        this.detectCircularDependencies();
    }

    return this.graph;
  }

  /**
   * Add a single file to the graph
   */
  async addFileToGraph(filepath: string): Promise<void> {
    // Skip if already in graph
    if (this.graph.nodes.has(filepath)) {
      return;
    }

    // Create node
    const node: DependencyNode = {
      filepath,
      imports: new Set(),
      importedBy: new Set(),
      metadata: {
        lastUpdated: Date.now(),
        importCount: 0,
        importedByCount: 0,
      },
    };

    // Get imports for this file
    const fileInfo = this.importService.get(filepath);
    if (fileInfo) {
      // Extract unique file paths from imports
      const importedFiles = new Set<string>();
      for (const importDefs of Object.values(fileInfo.imports)) {
        for (const def of importDefs) {
          importedFiles.add(def.filepath);
        }
      }

      // Add to node
      node.imports = importedFiles;
      node.metadata!.importCount = importedFiles.size;

      // Update reverse edges (importedBy)
      for (const importedFile of importedFiles) {
        // Ensure imported file has a node
        if (!this.graph.nodes.has(importedFile)) {
          const importedNode: DependencyNode = {
            filepath: importedFile,
            imports: new Set(),
            importedBy: new Set(),
            metadata: {
              lastUpdated: Date.now(),
              importCount: 0,
              importedByCount: 0,
            },
          };
          this.graph.nodes.set(importedFile, importedNode);
        }

        // Add reverse edge
        const importedNode = this.graph.nodes.get(importedFile)!;
        importedNode.importedBy.add(filepath);
        importedNode.metadata!.importedByCount = importedNode.importedBy.size;
      }
    }

    // Add node to graph
    this.graph.nodes.set(filepath, node);
  }

  /**
   * Find files related to a target file using BFS traversal
   */
  findRelatedFiles(
    targetFile: string,
    options: FindRelatedFilesOptions = {},
  ): RelatedFilesResult {
    const {
      maxDepth = 2,
      direction = "both",
      maxFiles = 100,
      includeSelf = false,
    } = options;

    const filesByDepth = new Map<number, Set<string>>();
    const visited = new Set<string>();
    const queue: Array<{ file: string; depth: number }> = [];

    // Start with target file
    queue.push({ file: targetFile, depth: 0 });
    visited.add(targetFile);

    while (queue.length > 0) {
      const { file, depth } = queue.shift()!;

      // Add to results (skip depth 0 if not including self)
      if (depth > 0 || includeSelf) {
        if (!filesByDepth.has(depth)) {
          filesByDepth.set(depth, new Set());
        }
        filesByDepth.get(depth)!.add(file);
      }

      // Stop if reached max depth or max files
      if (depth >= maxDepth) {
        continue;
      }

      const totalFiles = Array.from(filesByDepth.values()).reduce(
        (sum, set) => sum + set.size,
        0,
      );
      if (totalFiles >= maxFiles) {
        break;
      }

      // Get neighbors based on direction
      const node = this.graph.nodes.get(file);
      if (!node) {
        continue;
      }

      const neighbors: string[] = [];
      if (direction === "imports" || direction === "both") {
        neighbors.push(...Array.from(node.imports));
      }
      if (direction === "importedBy" || direction === "both") {
        neighbors.push(...Array.from(node.importedBy));
      }

      // Add unvisited neighbors to queue
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ file: neighbor, depth: depth + 1 });
        }
      }
    }

    // Flatten results
    const allFiles: string[] = [];
    for (const files of filesByDepth.values()) {
      allFiles.push(...Array.from(files));
    }

    return {
      sourceFile: targetFile,
      filesByDepth,
      allFiles,
      count: allFiles.length,
    };
  }

  /**
   * Find the shortest import chain between two files
   */
  getImportChain(from: string, to: string): ImportChain | null {
    // BFS to find shortest path
    const queue: Array<{ file: string; path: string[] }> = [];
    const visited = new Set<string>();

    queue.push({ file: from, path: [from] });
    visited.add(from);

    while (queue.length > 0) {
      const { file, path } = queue.shift()!;

      // Found target
      if (file === to) {
        return {
          from,
          to,
          path,
          length: path.length - 1,
        };
      }

      // Get neighbors (files this file imports)
      const node = this.graph.nodes.get(file);
      if (!node) {
        continue;
      }

      for (const neighbor of node.imports) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({
            file: neighbor,
            path: [...path, neighbor],
          });
        }
      }
    }

    // No path found
    return null;
  }

  /**
   * Detect circular dependencies in the graph
   */
  detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (file: string, path: string[]): void => {
      visited.add(file);
      recursionStack.add(file);
      path.push(file);

      const node = this.graph.nodes.get(file);
      if (node) {
        for (const neighbor of node.imports) {
          if (!visited.has(neighbor)) {
            dfs(neighbor, [...path]);
          } else if (recursionStack.has(neighbor)) {
            // Found a cycle
            const cycleStart = path.indexOf(neighbor);
            const cycle = path.slice(cycleStart);
            cycles.push([...cycle, neighbor]);
          }
        }
      }

      recursionStack.delete(file);
    };

    // Run DFS from each unvisited node
    for (const file of this.graph.nodes.keys()) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    return cycles;
  }

  /**
   * Get statistics about the dependency graph
   */
  getStats(): DependencyGraphStats {
    const nodes = Array.from(this.graph.nodes.values());

    // Calculate statistics
    const totalFiles = nodes.length;
    const totalImports = nodes.reduce(
      (sum, node) => sum + node.imports.size,
      0,
    );
    const avgImportsPerFile = totalFiles > 0 ? totalImports / totalFiles : 0;

    // Find files with most imports
    const mostImports = nodes
      .map((node) => ({ filepath: node.filepath, count: node.imports.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Find files most imported by others
    const mostImportedBy = nodes
      .map((node) => ({
        filepath: node.filepath,
        count: node.importedBy.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Find isolated files (no imports and not imported)
    const isolatedFiles = nodes
      .filter((node) => node.imports.size === 0 && node.importedBy.size === 0)
      .map((node) => node.filepath);

    return {
      totalFiles,
      totalImports,
      avgImportsPerFile,
      mostImports,
      mostImportedBy,
      circularDependencyCount:
        this.graph.metadata.circularDependencies?.length || 0,
      isolatedFiles,
    };
  }

  /**
   * Get the current graph
   */
  getGraph(): DependencyGraph {
    return this.graph;
  }

  /**
   * Count total edges in the graph
   */
  private countEdges(): number {
    return Array.from(this.graph.nodes.values()).reduce(
      (sum, node) => sum + node.imports.size,
      0,
    );
  }
}
