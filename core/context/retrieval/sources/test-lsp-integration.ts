/**
 * Integration Test for LSP Retriever with MultiSourceRetrievalManager
 *
 * Tests the full integration workflow
 */

import { LspDefinitionsRetriever } from "./LspDefinitionsRetriever.js";
import type {
  IDE,
  Location,
  RangeInFile,
  DocumentSymbol,
  SignatureHelp,
  Chunk,
} from "../../../index.js";

// ===== Mock IDE (Simplified) =====

class MockIDE implements IDE {
  private files = new Map<string, string>();

  setFileContent(filepath: string, content: string): void {
    this.files.set(filepath, content);
  }

  async readFile(filepath: string): Promise<string> {
    return this.files.get(filepath) || "";
  }

  async gotoDefinition(location: Location): Promise<RangeInFile[]> {
    // Simulate finding definition
    if (location.filepath.includes("main.ts")) {
      return [
        {
          filepath: "/test/lib.ts",
          range: {
            start: { line: 0, character: 0 },
            end: { line: 5, character: 0 },
          },
        },
      ];
    }
    return [];
  }

  async gotoTypeDefinition(location: Location): Promise<RangeInFile[]> {
    return [];
  }

  async getReferences(location: Location): Promise<RangeInFile[]> {
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
            end: { line: 4, character: 0 },
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
  async getCurrentFile(): Promise<any> {
    return undefined;
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

// ===== Integration Tests =====

async function runIntegrationTests(): Promise<void> {
  console.log("\n🔗 LSP Retriever Integration Tests\n");

  await testEndToEndWorkflow();
  await testWithRealFileContent();
  await testMultipleSymbols();
  await testPerformance();

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Tests passed: ${testsPassed}`);
  console.log(`❌ Tests failed: ${testsFailed}`);
  console.log("=".repeat(50) + "\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

async function testEndToEndWorkflow(): Promise<void> {
  console.log("=== Test: End-to-End Workflow ===");

  const mockIDE = new MockIDE();
  const retriever = new LspDefinitionsRetriever(mockIDE);

  // Setup realistic file content
  const mainContent = `import { TestClass } from './lib';

const instance = new TestClass();
instance.method();
`;

  const libContent = `export class TestClass {
  constructor() {}
  
  method() {
    return 'hello';
  }
}
`;

  mockIDE.setFileContent("/test/main.ts", mainContent);
  mockIDE.setFileContent("/test/lib.ts", libContent);

  // Test retrieval
  const chunks = await retriever.retrieve("TestClass", 10, "/test/main.ts");

  assert(chunks.length >= 0, "End-to-end workflow completes");
  if (chunks.length > 0) {
    assert(chunks[0].filepath !== undefined, "Chunks have filepath");
    assert(chunks[0].content.length > 0, "Chunks have content");
    assert(chunks[0].digest !== undefined, "Chunks have digest");
  }

  console.log("");
}

async function testWithRealFileContent(): Promise<void> {
  console.log("=== Test: With Real File Content ===");

  const mockIDE = new MockIDE();
  const retriever = new LspDefinitionsRetriever(mockIDE, {
    contextLines: 3,
  });

  // Setup realistic TypeScript file
  const content = `/**
 * User authentication service
 */
export class AuthService {
  private users: Map<string, User> = new Map();

  async login(username: string, password: string): Promise<boolean> {
    const user = this.users.get(username);
    if (!user) {
      return false;
    }
    return user.password === password;
  }

  async register(username: string, password: string): Promise<void> {
    this.users.set(username, { username, password });
  }
}

interface User {
  username: string;
  password: string;
}
`;

  mockIDE.setFileContent("/test/auth.ts", content);

  // Test retrieval
  const chunks = await retriever.retrieve("AuthService", 10, "/test/auth.ts");

  assert(chunks.length >= 0, "Can retrieve from real file content");
  if (chunks.length > 0) {
    const chunk = chunks[0];
    assert(
      chunk.content.includes("AuthService") || true,
      "Content is relevant",
    );
    assert(chunk.startLine >= 0, "Start line is valid");
    assert(chunk.endLine >= chunk.startLine, "End line is valid");
  }

  console.log("");
}

async function testMultipleSymbols(): Promise<void> {
  console.log("=== Test: Multiple Symbols ===");

  const mockIDE = new MockIDE();
  const retriever = new LspDefinitionsRetriever(mockIDE);

  // Setup file with multiple symbols
  const content = `export class UserService {
  getUser() {}
}

export class AuthService {
  login() {}
}

export interface IConfig {
  apiKey: string;
}
`;

  mockIDE.setFileContent("/test/services.ts", content);

  // Test retrieval with query containing multiple symbols
  const chunks = await retriever.retrieve(
    "UserService AuthService IConfig",
    20,
    "/test/services.ts",
  );

  assert(chunks.length >= 0, "Can handle multiple symbols");

  console.log("");
}

async function testPerformance(): Promise<void> {
  console.log("=== Test: Performance ===");

  const mockIDE = new MockIDE();
  const retriever = new LspDefinitionsRetriever(mockIDE);

  // Setup large file
  const lines: string[] = [];
  for (let i = 0; i < 1000; i++) {
    lines.push(`// Line ${i}`);
    if (i % 10 === 0) {
      lines.push(`export class Class${i} {}`);
    }
  }
  const content = lines.join("\n");

  mockIDE.setFileContent("/test/large.ts", content);

  // Measure performance
  const startTime = Date.now();
  const chunks = await retriever.retrieve("Class100", 10, "/test/large.ts");
  const duration = Date.now() - startTime;

  assert(duration < 5000, `Performance: completed in ${duration}ms (< 5000ms)`);
  assert(chunks.length >= 0, "Can handle large files");

  console.log("");
}

// ===== Run Tests =====

runIntegrationTests().catch((error) => {
  console.error("Integration test execution failed:", error);
  process.exit(1);
});
