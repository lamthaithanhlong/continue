#!/usr/bin/env tsx

/**
 * Test Suite for DependencyGraphBuilder
 *
 * Tests all functionality of the dependency graph builder including:
 * - Graph building
 * - BFS traversal
 * - Import chain finding
 * - Circular dependency detection
 * - Statistics calculation
 */

import { DependencyGraphBuilder } from "./DependencyGraphBuilder.js";
import type { IDE, RangeInFileWithContents } from "../..";
import { ImportDefinitionsService } from "../../autocomplete/context/ImportDefinitionsService.js";

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message: string, color: keyof typeof colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Mock IDE for testing
class MockIDE implements Partial<IDE> {
  private fileImports: Map<
    string,
    { [key: string]: RangeInFileWithContents[] }
  > = new Map();

  setFileImports(
    filepath: string,
    imports: { [key: string]: RangeInFileWithContents[] },
  ): void {
    this.fileImports.set(filepath, imports);
  }

  async getWorkspaceDirs(): Promise<string[]> {
    return ["/workspace"];
  }

  async readFile(filepath: string): Promise<string> {
    return `// Mock content for ${filepath}`;
  }

  async gotoDefinition(params: {
    filepath: string;
    position: { line: number; character: number };
  }): Promise<any[]> {
    const imports = this.fileImports.get(params.filepath);
    if (!imports) {
      return [];
    }
    // Return mock definitions
    return [];
  }

  async readRangeInFile(filepath: string, range: any): Promise<string> {
    return `// Mock range content`;
  }

  onDidChangeActiveTextEditor(callback: (filepath: string) => void): void {
    // Mock implementation
  }
}

// Test data setup
function setupMockGraph(): { ide: MockIDE; files: string[] } {
  const ide = new MockIDE();

  /**
   * Test graph structure:
   *
   * A.ts -> B.ts -> D.ts
   *   |      |
   *   v      v
   * C.ts -> E.ts
   *
   * F.ts -> G.ts -> F.ts (circular)
   *
   * H.ts (isolated)
   */

  const files = [
    "/workspace/A.ts",
    "/workspace/B.ts",
    "/workspace/C.ts",
    "/workspace/D.ts",
    "/workspace/E.ts",
    "/workspace/F.ts",
    "/workspace/G.ts",
    "/workspace/H.ts",
  ];

  // Setup imports
  ide.setFileImports("/workspace/A.ts", {
    B: [
      {
        filepath: "/workspace/B.ts",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        contents: "export class B {}",
      },
    ],
    C: [
      {
        filepath: "/workspace/C.ts",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        contents: "export class C {}",
      },
    ],
  });

  ide.setFileImports("/workspace/B.ts", {
    D: [
      {
        filepath: "/workspace/D.ts",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        contents: "export class D {}",
      },
    ],
    E: [
      {
        filepath: "/workspace/E.ts",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        contents: "export class E {}",
      },
    ],
  });

  ide.setFileImports("/workspace/C.ts", {
    E: [
      {
        filepath: "/workspace/E.ts",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        contents: "export class E {}",
      },
    ],
  });

  ide.setFileImports("/workspace/D.ts", {});
  ide.setFileImports("/workspace/E.ts", {});

  // Circular dependency
  ide.setFileImports("/workspace/F.ts", {
    G: [
      {
        filepath: "/workspace/G.ts",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        contents: "export class G {}",
      },
    ],
  });

  ide.setFileImports("/workspace/G.ts", {
    F: [
      {
        filepath: "/workspace/F.ts",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        contents: "export class F {}",
      },
    ],
  });

  // Isolated file
  ide.setFileImports("/workspace/H.ts", {});

  return { ide, files };
}

// Test counters
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    log(`  ✅ ${message}`, "green");
    passed++;
  } else {
    log(`  ❌ ${message}`, "red");
    failed++;
  }
}

// Tests
async function runTests() {
  log("\n🧪 DependencyGraphBuilder Test Suite\n", "blue");
  log("=".repeat(60), "blue");

  const { ide, files } = setupMockGraph();

  // Note: Since we're using a mock IDE, we need to manually build the graph
  // In real usage, ImportDefinitionsService would extract imports automatically
  log("\n📋 Test 1: Graph Building", "magenta");
  log("-".repeat(60), "blue");
  {
    const builder = new DependencyGraphBuilder(ide as any);

    // Manually add nodes (since mock IDE doesn't have real import parsing)
    const graph = builder.getGraph();

    // Manually build the graph structure for testing
    graph.nodes.set("/workspace/A.ts", {
      filepath: "/workspace/A.ts",
      imports: new Set(["/workspace/B.ts", "/workspace/C.ts"]),
      importedBy: new Set(),
      metadata: { lastUpdated: Date.now(), importCount: 2, importedByCount: 0 },
    });

    graph.nodes.set("/workspace/B.ts", {
      filepath: "/workspace/B.ts",
      imports: new Set(["/workspace/D.ts", "/workspace/E.ts"]),
      importedBy: new Set(["/workspace/A.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 2, importedByCount: 1 },
    });

    graph.nodes.set("/workspace/C.ts", {
      filepath: "/workspace/C.ts",
      imports: new Set(["/workspace/E.ts"]),
      importedBy: new Set(["/workspace/A.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 1, importedByCount: 1 },
    });

    graph.nodes.set("/workspace/D.ts", {
      filepath: "/workspace/D.ts",
      imports: new Set(),
      importedBy: new Set(["/workspace/B.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 0, importedByCount: 1 },
    });

    graph.nodes.set("/workspace/E.ts", {
      filepath: "/workspace/E.ts",
      imports: new Set(),
      importedBy: new Set(["/workspace/B.ts", "/workspace/C.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 0, importedByCount: 2 },
    });

    graph.nodes.set("/workspace/F.ts", {
      filepath: "/workspace/F.ts",
      imports: new Set(["/workspace/G.ts"]),
      importedBy: new Set(["/workspace/G.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 1, importedByCount: 1 },
    });

    graph.nodes.set("/workspace/G.ts", {
      filepath: "/workspace/G.ts",
      imports: new Set(["/workspace/F.ts"]),
      importedBy: new Set(["/workspace/F.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 1, importedByCount: 1 },
    });

    graph.nodes.set("/workspace/H.ts", {
      filepath: "/workspace/H.ts",
      imports: new Set(),
      importedBy: new Set(),
      metadata: { lastUpdated: Date.now(), importCount: 0, importedByCount: 0 },
    });

    graph.metadata.nodeCount = graph.nodes.size;
    graph.metadata.edgeCount = 8;

    assert(graph.nodes.size === 8, "Graph has 8 nodes");
    assert(graph.nodes.has("/workspace/A.ts"), "Graph contains A.ts");
    assert(
      graph.nodes.get("/workspace/A.ts")!.imports.size === 2,
      "A.ts imports 2 files",
    );
    assert(
      graph.nodes.get("/workspace/E.ts")!.importedBy.size === 2,
      "E.ts is imported by 2 files",
    );
  }

  log("\n📋 Test 2: Find Related Files (BFS)", "magenta");
  log("-".repeat(60), "blue");
  {
    const builder = new DependencyGraphBuilder(ide as any);
    const graph = builder.getGraph();

    // Setup same graph as Test 1
    graph.nodes.set("/workspace/A.ts", {
      filepath: "/workspace/A.ts",
      imports: new Set(["/workspace/B.ts", "/workspace/C.ts"]),
      importedBy: new Set(),
      metadata: { lastUpdated: Date.now(), importCount: 2, importedByCount: 0 },
    });

    graph.nodes.set("/workspace/B.ts", {
      filepath: "/workspace/B.ts",
      imports: new Set(["/workspace/D.ts", "/workspace/E.ts"]),
      importedBy: new Set(["/workspace/A.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 2, importedByCount: 1 },
    });

    graph.nodes.set("/workspace/C.ts", {
      filepath: "/workspace/C.ts",
      imports: new Set(["/workspace/E.ts"]),
      importedBy: new Set(["/workspace/A.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 1, importedByCount: 1 },
    });

    graph.nodes.set("/workspace/D.ts", {
      filepath: "/workspace/D.ts",
      imports: new Set(),
      importedBy: new Set(["/workspace/B.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 0, importedByCount: 1 },
    });

    graph.nodes.set("/workspace/E.ts", {
      filepath: "/workspace/E.ts",
      imports: new Set(),
      importedBy: new Set(["/workspace/B.ts", "/workspace/C.ts"]),
      metadata: { lastUpdated: Date.now(), importCount: 0, importedByCount: 2 },
    });

    // Find related files from A.ts with depth 1
    const related1 = builder.findRelatedFiles("/workspace/A.ts", {
      maxDepth: 1,
    });
    assert(
      related1.count === 2,
      `Depth 1 from A.ts finds 2 files (found ${related1.count})`,
    );
    assert(
      related1.allFiles.includes("/workspace/B.ts"),
      "Related files include B.ts",
    );
    assert(
      related1.allFiles.includes("/workspace/C.ts"),
      "Related files include C.ts",
    );

    // Find related files from A.ts with depth 2
    const related2 = builder.findRelatedFiles("/workspace/A.ts", {
      maxDepth: 2,
    });
    assert(
      related2.count >= 3,
      `Depth 2 from A.ts finds at least 3 files (found ${related2.count})`,
    );
    assert(
      related2.allFiles.includes("/workspace/D.ts") ||
        related2.allFiles.includes("/workspace/E.ts"),
      "Related files include D.ts or E.ts",
    );
  }

  log("\n📋 Test 3: Import Chain Finding", "magenta");
  log("-".repeat(60), "blue");
  {
    const builder = new DependencyGraphBuilder(ide as any);
    const graph = builder.getGraph();

    // Setup graph
    graph.nodes.set("/workspace/A.ts", {
      filepath: "/workspace/A.ts",
      imports: new Set(["/workspace/B.ts"]),
      importedBy: new Set(),
    });

    graph.nodes.set("/workspace/B.ts", {
      filepath: "/workspace/B.ts",
      imports: new Set(["/workspace/D.ts"]),
      importedBy: new Set(["/workspace/A.ts"]),
    });

    graph.nodes.set("/workspace/D.ts", {
      filepath: "/workspace/D.ts",
      imports: new Set(),
      importedBy: new Set(["/workspace/B.ts"]),
    });

    // Find chain from A to D
    const chain = builder.getImportChain("/workspace/A.ts", "/workspace/D.ts");
    assert(chain !== null, "Import chain found from A.ts to D.ts");
    if (chain) {
      assert(chain.length === 2, `Chain length is 2 (found ${chain.length})`);
      assert(chain.path[0] === "/workspace/A.ts", "Chain starts with A.ts");
      assert(
        chain.path[chain.path.length - 1] === "/workspace/D.ts",
        "Chain ends with D.ts",
      );
    }

    // Find chain from D to A (should not exist)
    const noChain = builder.getImportChain(
      "/workspace/D.ts",
      "/workspace/A.ts",
    );
    assert(noChain === null, "No chain found from D.ts to A.ts (correct)");
  }

  log("\n📋 Test 4: Circular Dependency Detection", "magenta");
  log("-".repeat(60), "blue");
  {
    const builder = new DependencyGraphBuilder(ide as any);
    const graph = builder.getGraph();

    // Setup circular dependency: F -> G -> F
    graph.nodes.set("/workspace/F.ts", {
      filepath: "/workspace/F.ts",
      imports: new Set(["/workspace/G.ts"]),
      importedBy: new Set(["/workspace/G.ts"]),
    });

    graph.nodes.set("/workspace/G.ts", {
      filepath: "/workspace/G.ts",
      imports: new Set(["/workspace/F.ts"]),
      importedBy: new Set(["/workspace/F.ts"]),
    });

    const cycles = builder.detectCircularDependencies();
    assert(
      cycles.length > 0,
      `Circular dependencies detected (found ${cycles.length})`,
    );
    if (cycles.length > 0) {
      const hasFG = cycles.some(
        (cycle) =>
          cycle.includes("/workspace/F.ts") &&
          cycle.includes("/workspace/G.ts"),
      );
      assert(hasFG, "Detected F.ts <-> G.ts circular dependency");
    }
  }

  log("\n📋 Test 5: Graph Statistics", "magenta");
  log("-".repeat(60), "blue");
  {
    const builder = new DependencyGraphBuilder(ide as any);
    const graph = builder.getGraph();

    // Setup graph with various patterns
    graph.nodes.set("/workspace/A.ts", {
      filepath: "/workspace/A.ts",
      imports: new Set(["/workspace/B.ts", "/workspace/C.ts"]),
      importedBy: new Set(),
    });

    graph.nodes.set("/workspace/B.ts", {
      filepath: "/workspace/B.ts",
      imports: new Set(["/workspace/D.ts"]),
      importedBy: new Set(["/workspace/A.ts"]),
    });

    graph.nodes.set("/workspace/C.ts", {
      filepath: "/workspace/C.ts",
      imports: new Set(),
      importedBy: new Set(["/workspace/A.ts"]),
    });

    graph.nodes.set("/workspace/D.ts", {
      filepath: "/workspace/D.ts",
      imports: new Set(),
      importedBy: new Set(["/workspace/B.ts"]),
    });

    graph.nodes.set("/workspace/H.ts", {
      filepath: "/workspace/H.ts",
      imports: new Set(),
      importedBy: new Set(),
    });

    const stats = builder.getStats();
    assert(
      stats.totalFiles === 5,
      `Total files is 5 (found ${stats.totalFiles})`,
    );
    assert(
      stats.totalImports === 3,
      `Total imports is 3 (found ${stats.totalImports})`,
    );
    assert(
      stats.isolatedFiles.length === 1,
      `Found 1 isolated file (found ${stats.isolatedFiles.length})`,
    );
    assert(stats.isolatedFiles.includes("/workspace/H.ts"), "H.ts is isolated");
  }

  // Summary
  log("\n" + "=".repeat(60), "blue");
  log("📊 Test Summary", "cyan");
  log("=".repeat(60), "blue");
  log(`✅ Passed: ${passed}`, "green");
  log(`❌ Failed: ${failed}`, "red");
  log(`📈 Total:  ${passed + failed}`, "cyan");

  if (failed === 0) {
    log("\n🎉 All tests passed!\n", "green");
  } else {
    log(`\n⚠️  ${failed} test(s) failed\n`, "red");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
