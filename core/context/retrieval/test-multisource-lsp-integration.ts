/**
 * Integration Test: MultiSourceRetrievalManager + LspDefinitionsRetriever
 *
 * Tests the full integration of LSP retrieval into the multi-source manager
 */

import type {
  BranchAndDir,
  ContinueConfig,
  DocumentSymbol,
  IDE,
  ILLM,
  Location,
  RangeInFile,
  SignatureHelp,
} from "../../index.js";
import {
  MultiSourceRetrievalManager,
  type MultiSourceRetrievalManagerOptions,
  type RetrievalArguments,
} from "./MultiSourceRetrievalManager.js";

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

// ===== Mock LLM =====

class MockLLM implements ILLM {
  async *streamComplete(): AsyncGenerator<string> {
    yield "test";
  }
  async *streamChat(): AsyncGenerator<any> {
    yield { role: "assistant", content: "test" };
  }
  async complete(): Promise<string> {
    return "test";
  }
  async chat(): Promise<any> {
    return { role: "assistant", content: "test" };
  }
  async countTokens(): Promise<number> {
    return 10;
  }
  async embed(): Promise<number[]> {
    return [0.1, 0.2, 0.3];
  }
  supportsFim(): boolean {
    return false;
  }
  supportsImages(): boolean {
    return false;
  }
  supportsCompletions(): boolean {
    return true;
  }
  supportsPrefill(): boolean {
    return false;
  }
  uniqueId: string = "mock-llm";
  model: string = "mock-model";
  title?: string = "Mock LLM";
  provider: string = "mock";
  systemMessage?: string;
  contextLength: number = 4096;
  completionOptions: any = {};
  requestOptions?: any;
  template?: any;
  promptTemplates?: any;
  templateMessages?: any;
  writeLog?: any;
  llmRequestHook?: any;
  apiKey?: string;
  apiBase?: string;
}

// ===== Mock Config =====

const mockConfig: ContinueConfig = {
  models: [],
  selectedModelByRole: {},
  tabAutocompleteModel: undefined,
  tabAutocompleteOptions: {},
  embeddingsProvider: undefined,
  reranker: undefined,
  contextProviders: [],
  slashCommands: [],
  customCommands: [],
  experimental: {},
  allowAnonymousTelemetry: false,
  docs: [],
  ui: {},
};

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

// ===== Integration Tests =====

async function runIntegrationTests(): Promise<void> {
  console.log("\n🔗 MultiSource + LSP Integration Tests\n");

  await testLspIntegration();
  await testLspInResults();
  await testLspMetadata();
  await testLspDisabled();

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Tests passed: ${testsPassed}`);
  console.log(`❌ Tests failed: ${testsFailed}`);
  console.log("=".repeat(50) + "\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

async function testLspIntegration(): Promise<void> {
  console.log("=== Test: LSP Integration ===");

  const mockIDE = new MockIDE();
  const mockLLM = new MockLLM();

  // Setup file content
  mockIDE.setFileContent(
    "/test/main.ts",
    `import { TestClass } from './lib';\n\nconst instance = new TestClass();\n`,
  );
  mockIDE.setFileContent(
    "/test/lib.ts",
    `export class TestClass {\n  constructor() {}\n  method() {}\n}\n`,
  );

  const options: MultiSourceRetrievalManagerOptions = {
    llm: mockLLM,
    config: mockConfig,
    ide: mockIDE,
  };

  const manager = new MultiSourceRetrievalManager(options);

  const args: RetrievalArguments = {
    query: "TestClass",
    tags: [] as BranchAndDir[],
    nRetrieve: 10,
    sourceConfig: {
      enableFts: false,
      enableEmbeddings: false,
      enableRecentlyEdited: false,
      enableRepoMap: false,
      enableLspDefinitions: true,
    },
  };

  const result = await manager.retrieveAll(args);

  assert(result !== null, "Returns result");
  assert(result.sources !== undefined, "Has sources");
  assert(result.metadata !== undefined, "Has metadata");

  console.log("");
}

async function testLspInResults(): Promise<void> {
  console.log("=== Test: LSP in Results ===");

  const mockIDE = new MockIDE();
  const mockLLM = new MockLLM();

  mockIDE.setFileContent(
    "/test/lib.ts",
    `export class TestClass {\n  method() {}\n}\n`,
  );

  const options: MultiSourceRetrievalManagerOptions = {
    llm: mockLLM,
    config: mockConfig,
    ide: mockIDE,
  };

  const manager = new MultiSourceRetrievalManager(options);

  const args: RetrievalArguments = {
    query: "TestClass method implementation",
    tags: [] as BranchAndDir[],
    nRetrieve: 10,
    sourceConfig: {
      enableFts: false,
      enableEmbeddings: false,
      enableRecentlyEdited: false,
      enableRepoMap: false,
      enableLspDefinitions: true,
    },
  };

  const result = await manager.retrieveAll(args);

  assert(result.sources.lspDefinitions !== undefined, "Has lspDefinitions");
  assert(
    Array.isArray(result.sources.lspDefinitions),
    "lspDefinitions is array",
  );

  console.log(`  ℹ️  LSP chunks: ${result.sources.lspDefinitions.length}`);

  console.log("");
}

async function testLspMetadata(): Promise<void> {
  console.log("=== Test: LSP Metadata ===");

  const mockIDE = new MockIDE();
  const mockLLM = new MockLLM();

  const options: MultiSourceRetrievalManagerOptions = {
    llm: mockLLM,
    config: mockConfig,
    ide: mockIDE,
  };

  const manager = new MultiSourceRetrievalManager(options);

  const args: RetrievalArguments = {
    query: "TestClass",
    tags: [] as BranchAndDir[],
    nRetrieve: 10,
    sourceConfig: {
      enableFts: false,
      enableEmbeddings: false,
      enableRecentlyEdited: false,
      enableRepoMap: false,
      enableLspDefinitions: true,
    },
  };

  const result = await manager.retrieveAll(args);

  const lspMetadata = result.metadata.find(
    (m) => m.source === "lspDefinitions",
  );

  assert(lspMetadata !== undefined, "Has LSP metadata");
  if (lspMetadata) {
    assert(lspMetadata.count >= 0, "Metadata has count");
    assert(lspMetadata.timeMs >= 0, "Metadata has timeMs");
    assert(lspMetadata.success !== undefined, "Metadata has success");
    console.log(`  ℹ️  LSP metadata: ${JSON.stringify(lspMetadata)}`);
  }

  console.log("");
}

async function testLspDisabled(): Promise<void> {
  console.log("=== Test: LSP Disabled ===");

  const mockIDE = new MockIDE();
  const mockLLM = new MockLLM();

  const options: MultiSourceRetrievalManagerOptions = {
    llm: mockLLM,
    config: mockConfig,
    ide: mockIDE,
  };

  const manager = new MultiSourceRetrievalManager(options);

  const args: RetrievalArguments = {
    query: "TestClass",
    tags: [] as BranchAndDir[],
    nRetrieve: 10,
    sourceConfig: {
      enableFts: false,
      enableEmbeddings: false,
      enableRecentlyEdited: false,
      enableRepoMap: false,
      enableLspDefinitions: false, // Disabled
    },
  };

  const result = await manager.retrieveAll(args);

  const lspMetadata = result.metadata.find(
    (m) => m.source === "lspDefinitions",
  );

  assert(lspMetadata === undefined, "No LSP metadata when disabled");
  assert(
    result.sources.lspDefinitions.length === 0,
    "No LSP chunks when disabled",
  );

  console.log("");
}

// ===== Run Tests =====

runIntegrationTests().catch((error) => {
  console.error("Integration test execution failed:", error);
  process.exit(1);
});
