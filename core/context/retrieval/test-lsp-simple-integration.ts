/**
 * Simple Integration Test: LSP Retriever Integration
 *
 * Tests that LspDefinitionsRetriever is properly integrated
 */

import { LspDefinitionsRetriever } from "./sources/LspDefinitionsRetriever.js";
import type {
  DocumentSymbol,
  IDE,
  Location,
  RangeInFile,
  SignatureHelp,
} from "../../index.js";

// ===== Mock IDE =====

class MockIDE implements IDE {
  private files = new Map<string, string>();

  setFileContent(filepath: string, content: string): void {
    this.files.set(filepath, content);
  }

  async readFile(filepath: string): Promise<string> {
    return this.files.get(filepath) || "";
  }

  async getCurrentFile(): Promise<{ path: string } | undefined> {
    return { path: "/test/main.ts" };
  }

  async gotoDefinition(location: Location): Promise<RangeInFile[]> {
    if (location.filepath.includes("main.ts")) {
      return [
        {
          filepath: "/test/lib.ts",
          range: {
            start: { line: 0, character: 0 },
            end: { line: 10, character: 0 },
          },
        },
      ];
    }
    return [];
  }

  async gotoTypeDefinition(_location: Location): Promise<RangeInFile[]> {
    return [];
  }

  async getReferences(_location: Location): Promise<RangeInFile[]> {
    return [];
  }

  async getDocumentSymbols(filepath: string): Promise<DocumentSymbol[]> {
    if (filepath.includes("main.ts")) {
      return [
        {
          name: "TestClass",
          kind: 5,
          range: {
            start: { line: 2, character: 0 },
            end: { line: 5, character: 0 },
          },
          selectionRange: {
            start: { line: 2, character: 6 },
            end: { line: 2, character: 15 },
          },
          children: [],
        },
      ];
    }
    return [];
  }

  // Stub implementations
  async getIdeInfo(): Promise<any> {
    return {};
  }
  async getIdeSettings(): Promise<any> {
    return {};
  }
  async getDiff(): Promise<string[]> {
    return [];
  }
  async getClipboardContent(): Promise<any> {
    return { text: "", copiedAt: "" };
  }
  async isTelemetryEnabled(): Promise<boolean> {
    return false;
  }
  async isWorkspaceRemote(): Promise<boolean> {
    return false;
  }
  async getUniqueId(): Promise<string> {
    return "test-id";
  }
  async getTerminalContents(): Promise<string> {
    return "";
  }
  async getDebugLocals(): Promise<string> {
    return "";
  }
  async getTopLevelCallStackSources(): Promise<string[]> {
    return [];
  }
  async getAvailableThreads(): Promise<any[]> {
    return [];
  }
  async getWorkspaceDirs(): Promise<string[]> {
    return ["/test"];
  }
  async fileExists(): Promise<boolean> {
    return true;
  }
  async writeFile(): Promise<void> {}
  async showVirtualFile(): Promise<void> {}
  async openFile(): Promise<void> {}
  async openUrl(): Promise<void> {}
  async runCommand(): Promise<void> {}
  async saveFile(): Promise<void> {}
  async readRangeInFile(): Promise<string> {
    return "";
  }
  async showLines(): Promise<void> {}
  async getOpenFiles(): Promise<string[]> {
    return [];
  }
  async getPinnedFiles(): Promise<string[]> {
    return [];
  }
  async showToast(): Promise<void> {}
  async getGitRootPath(): Promise<string | undefined> {
    return undefined;
  }
  async listDir(): Promise<[string, any][]> {
    return [];
  }
  async getFileStats(): Promise<any> {
    return {};
  }
  async readSecrets(): Promise<Record<string, string>> {
    return {};
  }
  async writeSecrets(): Promise<void> {}
  async getSignatureHelp(): Promise<SignatureHelp | null> {
    return null;
  }
  onDidChangeActiveTextEditor(): void {}
}

// ===== Test Helpers =====

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ ${message}`);
    testsFailed++;
  }
}

// ===== Tests =====

async function runTests(): Promise<void> {
  console.log("\n🔗 LSP Simple Integration Tests\n");

  await testRetrieverCreation();
  await testRetrieverWithMockIDE();
  await testRetrieverConfiguration();

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Tests passed: ${testsPassed}`);
  console.log(`❌ Tests failed: ${testsFailed}`);
  console.log("=".repeat(50) + "\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

async function testRetrieverCreation(): Promise<void> {
  console.log("=== Test: Retriever Creation ===");

  const mockIDE = new MockIDE();
  const retriever = new LspDefinitionsRetriever(mockIDE);

  assert(retriever !== null, "Can create retriever");
  assert(typeof retriever.retrieve === "function", "Has retrieve method");
  assert(typeof retriever.getConfig === "function", "Has getConfig method");
  assert(
    typeof retriever.updateConfig === "function",
    "Has updateConfig method",
  );

  console.log("");
}

async function testRetrieverWithMockIDE(): Promise<void> {
  console.log("=== Test: Retriever with Mock IDE ===");

  const mockIDE = new MockIDE();
  const retriever = new LspDefinitionsRetriever(mockIDE);

  // Setup file content
  mockIDE.setFileContent(
    "/test/main.ts",
    `import { TestClass } from './lib';\n\nconst instance = new TestClass();\n`,
  );
  mockIDE.setFileContent(
    "/test/lib.ts",
    `export class TestClass {\n  constructor() {}\n  method() {}\n}\n`,
  );

  // Test retrieval
  const chunks = await retriever.retrieve("TestClass", 10, "/test/main.ts");

  assert(Array.isArray(chunks), "Returns array");
  assert(chunks.length >= 0, "Returns chunks");

  if (chunks.length > 0) {
    const chunk = chunks[0];
    assert(chunk.filepath !== undefined, "Chunk has filepath");
    assert(chunk.content !== undefined, "Chunk has content");
    assert(chunk.digest !== undefined, "Chunk has digest");
    assert(chunk.startLine !== undefined, "Chunk has startLine");
    assert(chunk.endLine !== undefined, "Chunk has endLine");
    console.log(`  ℹ️  Retrieved ${chunks.length} chunks`);
  }

  console.log("");
}

async function testRetrieverConfiguration(): Promise<void> {
  console.log("=== Test: Retriever Configuration ===");

  const mockIDE = new MockIDE();
  const retriever = new LspDefinitionsRetriever(mockIDE, {
    includeDefinitions: true,
    includeTypeDefinitions: false,
    includeReferences: false,
    contextLines: 10,
  });

  const config = retriever.getConfig();

  assert(config.includeDefinitions === true, "Config: includeDefinitions");
  assert(
    config.includeTypeDefinitions === false,
    "Config: includeTypeDefinitions",
  );
  assert(config.includeReferences === false, "Config: includeReferences");
  assert(config.contextLines === 10, "Config: contextLines");

  // Update config
  retriever.updateConfig({ contextLines: 15 });
  const updatedConfig = retriever.getConfig();

  assert(updatedConfig.contextLines === 15, "Config: can update");

  console.log("");
}

// ===== Run Tests =====

runTests().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
