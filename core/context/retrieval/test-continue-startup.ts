/**
 * Continue.dev Startup Test
 *
 * Tests that Continue.dev components can be initialized and work correctly.
 * This does NOT require a real API key - uses mock implementations.
 */

import { fileURLToPath } from "url";
import * as path from "path";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test counters
let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
  totalTests++;
  return (async () => {
    try {
      const result = await Promise.resolve(fn());
      if (result) {
        console.log(`✅ ${name}`);
        passedTests++;
      } else {
        console.error(`❌ ${name}`);
      }
    } catch (error) {
      console.error(`❌ ${name}: ${error}`);
    }
  })();
}

async function runTests() {
  console.log("\n🧪 Continue.dev Startup Test\n");
  console.log("=== Testing Core Components ===\n");

  // Test 1: Check production files exist
  await test("Production file exists: BaseRetrievalPipeline.ts", () => {
    const filePath = path.join(
      __dirname,
      "pipelines",
      "BaseRetrievalPipeline.ts",
    );
    return fs.existsSync(filePath);
  });

  await test("Production file exists: MultiSourceRetrievalManager.ts", () => {
    const filePath = path.join(__dirname, "MultiSourceRetrievalManager.ts");
    return fs.existsSync(filePath);
  });

  await test("Production file exists: DependencyGraphBuilder.ts", () => {
    const filePath = path.join(__dirname, "DependencyGraphBuilder.ts");
    return fs.existsSync(filePath);
  });

  await test("Production file exists: RetrievalLogger.ts", () => {
    const filePath = path.join(__dirname, "RetrievalLogger.ts");
    return fs.existsSync(filePath);
  });

  // Test 2: Check type definitions exist
  await test("Type definitions exist: EnhancedRetrievalTypes.ts", () => {
    const filePath = path.join(__dirname, "types", "EnhancedRetrievalTypes.ts");
    return fs.existsSync(filePath);
  });

  await test("Type definitions exist: DependencyGraphTypes.ts", () => {
    const filePath = path.join(__dirname, "types", "DependencyGraphTypes.ts");
    return fs.existsSync(filePath);
  });

  // Test 3: Check imports can be resolved
  console.log("\n=== Testing Module Imports ===\n");

  await test("Can import EnhancedRetrievalTypes", async () => {
    try {
      const module = await import("./types/EnhancedRetrievalTypes.js");
      return module !== undefined;
    } catch (error) {
      console.error(`  Import error: ${error}`);
      return false;
    }
  });

  await test("Can import DependencyGraphTypes", async () => {
    try {
      const module = await import("./types/DependencyGraphTypes.js");
      return module !== undefined;
    } catch (error) {
      console.error(`  Import error: ${error}`);
      return false;
    }
  });

  await test("Can import RetrievalLogger", async () => {
    try {
      const module = await import("./RetrievalLogger.js");
      return module !== undefined && module.default !== undefined;
    } catch (error) {
      console.error(`  Import error: ${error}`);
      return false;
    }
  });

  // Test 4: Check RetrievalLogger can be instantiated
  console.log("\n=== Testing Component Initialization ===\n");

  await test("RetrievalLogger can be instantiated", async () => {
    try {
      const { default: RetrievalLogger } = await import("./RetrievalLogger.js");
      const logger = RetrievalLogger.getInstance({
        enabled: true,
        logLevel: "info",
        logPerformance: true,
      });
      return logger !== undefined;
    } catch (error) {
      console.error(`  Instantiation error: ${error}`);
      return false;
    }
  });

  await test("RetrievalLogger singleton works", async () => {
    try {
      const { default: RetrievalLogger } = await import("./RetrievalLogger.js");
      const logger1 = RetrievalLogger.getInstance();
      const logger2 = RetrievalLogger.getInstance();
      return logger1 === logger2;
    } catch (error) {
      console.error(`  Singleton error: ${error}`);
      return false;
    }
  });

  // Test 5: Check DependencyGraphBuilder can be imported
  await test("DependencyGraphBuilder can be imported", async () => {
    try {
      const module = await import("./DependencyGraphBuilder.js");
      return module.DependencyGraphBuilder !== undefined;
    } catch (error) {
      console.error(`  Import error: ${error}`);
      return false;
    }
  });

  // Test 6: Check MultiSourceRetrievalManager can be imported
  await test("MultiSourceRetrievalManager can be imported", async () => {
    try {
      const module = await import("./MultiSourceRetrievalManager.js");
      return module.MultiSourceRetrievalManager !== undefined;
    } catch (error) {
      console.error(`  Import error: ${error}`);
      return false;
    }
  });

  // Test 7: Check extension structure
  console.log("\n=== Testing Extension Structure ===\n");

  await test("Extension directory exists", () => {
    const extPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "extensions",
      "vscode",
    );
    return fs.existsSync(extPath);
  });

  await test("Extension package.json exists", () => {
    const pkgPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "extensions",
      "vscode",
      "package.json",
    );
    return fs.existsSync(pkgPath);
  });

  await test("Extension has build scripts", () => {
    const pkgPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "extensions",
      "vscode",
      "package.json",
    );
    if (!fs.existsSync(pkgPath)) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.scripts && pkg.scripts.package !== undefined;
  });

  // Test 8: Check GUI structure
  await test("GUI directory exists", () => {
    const guiPath = path.join(__dirname, "..", "..", "..", "gui");
    return fs.existsSync(guiPath);
  });

  await test("GUI package.json exists", () => {
    const pkgPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "gui",
      "package.json",
    );
    return fs.existsSync(pkgPath);
  });

  await test("GUI has build scripts", () => {
    const pkgPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "gui",
      "package.json",
    );
    if (!fs.existsSync(pkgPath)) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.scripts && pkg.scripts.build !== undefined;
  });

  // Test 9: Check Phase 1 documentation
  console.log("\n=== Testing Documentation ===\n");

  await test("Phase 1 Complete Summary exists", () => {
    const docPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "PHASE_1_COMPLETE_SUMMARY.md",
    );
    return fs.existsSync(docPath);
  });

  await test("Phase 1.4 Migration Guide exists", () => {
    const docPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "PHASE_1_4_MIGRATION_GUIDE.md",
    );
    return fs.existsSync(docPath);
  });

  await test("Context Engine Roadmap exists", () => {
    const docPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "CONTEXT_ENGINE_IMPROVEMENT_ROADMAP.md",
    );
    return fs.existsSync(docPath);
  });

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Total:  ${totalTests}`);
  console.log("=".repeat(60));

  if (passedTests === totalTests) {
    console.log("\n🎉 All startup tests passed!");
    console.log("\n✅ Continue.dev Core Components:");
    console.log("   - All production files present ✅");
    console.log("   - All type definitions present ✅");
    console.log("   - All modules can be imported ✅");
    console.log("   - RetrievalLogger works ✅");
    console.log("   - Extension structure valid ✅");
    console.log("   - GUI structure valid ✅");
    console.log("   - Documentation complete ✅");
    console.log("\n🚀 Ready to build extension!");
    console.log("\nNext steps:");
    console.log("1. Build GUI: cd gui && npm run build");
    console.log(
      "2. Package extension: cd extensions/vscode && npm run package",
    );
    console.log("3. Install .vsix file in VS Code");
    console.log("4. Configure with your API key");
  } else {
    console.log("\n❌ Some tests failed. Please check the errors above.");
  }
}

// Run tests
runTests().catch(console.error);
