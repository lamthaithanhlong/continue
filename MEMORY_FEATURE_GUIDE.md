# Memory Feature Guide

## 📚 Overview

The Memory Feature enables Continue.dev to remember and recall information across sessions, providing:

- **Persistent Context**: Remember conversations, code snippets, and project information
- **Smart Retrieval**: Automatically find relevant memories based on current context
- **User Preferences**: Learn and remember user coding style and preferences
- **Project Knowledge**: Store project-specific information and conventions

---

## 🎯 Key Features

### 1. **Memory Types**

| Type             | Description                | Use Case                         |
| ---------------- | -------------------------- | -------------------------------- |
| **Conversation** | Chat history and context   | Remember previous discussions    |
| **Code**         | Code snippets and patterns | Reuse code examples              |
| **Preference**   | User preferences and style | Maintain consistency             |
| **Project**      | Project-specific info      | Remember tech stack, conventions |
| **File**         | File-specific notes        | Context for specific files       |
| **Knowledge**    | General facts and info     | Store useful information         |

### 2. **Memory Importance Levels**

- **Critical**: Always retrieved, never auto-deleted
- **High**: Frequently relevant, high priority
- **Medium**: Sometimes relevant, normal priority
- **Low**: Rarely relevant, low priority

### 3. **Memory Scopes**

- **Global**: Available across all projects
- **Workspace**: Specific to current workspace/project
- **File**: Specific to a file or directory
- **Session**: Current session only (not persisted)

---

## 🚀 Quick Start

### Installation

The memory feature is built into Continue.dev. No additional installation required.

### Basic Usage

```typescript
import { MemoryManager } from "./MemoryManager";

// Initialize memory manager
const memoryManager = new MemoryManager({
  storeConfig: {
    storagePath: "~/.continue/memory",
  },
  enabled: true,
  autoSaveConversations: true,
});

await memoryManager.initialize("/path/to/workspace");

// Remember a conversation
await memoryManager.rememberConversation(
  "How do I implement authentication?",
  "Here's how to implement JWT authentication...",
  {
    tags: ["authentication", "security"],
  },
);

// Remember a code snippet
await memoryManager.rememberCode("const jwt = require('jsonwebtoken');", {
  language: "javascript",
  description: "JWT import",
  tags: ["authentication", "jwt"],
});

// Remember a preference
await memoryManager.rememberPreference(
  "Always use async/await instead of .then()",
  {
    category: "coding-style",
  },
);

// Search memories
const results = await memoryManager.searchMemories({
  query: "authentication",
  types: [MemoryType.CODE, MemoryType.CONVERSATION],
  limit: 5,
});

// Get relevant memories for current context
const relevant = await memoryManager.getRelevantMemories(
  "implementing user login",
  { limit: 5 },
);
```

---

## 📖 API Reference

### MemoryManager

#### Constructor

```typescript
new MemoryManager(config: MemoryManagerConfig)
```

**Config Options**:

- `storeConfig`: Storage configuration
  - `storagePath`: Where to store memories (default: `~/.continue/memory`)
  - `maxMemories`: Maximum number of memories (default: 10,000)
  - `maxStorageSize`: Maximum storage size in bytes (default: 100MB)
  - `autoCleanup`: Enable automatic cleanup (default: true)
- `enabled`: Enable/disable memory feature (default: true)
- `defaultImportance`: Default importance level (default: MEDIUM)
- `defaultScope`: Default scope (default: WORKSPACE)
- `autoSaveConversations`: Auto-save chat history (default: true)
- `autoSaveCode`: Auto-save code snippets (default: false)

#### Methods

##### `initialize(workspacePath?: string): Promise<void>`

Initialize the memory manager with optional workspace path.

##### `createMemory(options: CreateMemoryOptions): Promise<Memory>`

Create a new memory manually.

```typescript
await memoryManager.createMemory({
  content: "Use camelCase for variable names",
  type: MemoryType.PREFERENCE,
  importance: MemoryImportance.HIGH,
  scope: MemoryScope.GLOBAL,
  tags: ["naming", "style"],
});
```

##### `rememberConversation(userMessage: string, assistantMessage: string, context?): Promise<Memory>`

Remember a conversation exchange.

##### `rememberCode(code: string, context): Promise<Memory>`

Remember a code snippet.

##### `rememberPreference(preference: string, context?): Promise<Memory>`

Remember a user preference.

##### `rememberProject(information: string, context?): Promise<Memory>`

Remember project information.

##### `searchMemories(query: MemoryQuery): Promise<MemorySearchResult[]>`

Search memories with filters.

```typescript
const results = await memoryManager.searchMemories({
  query: "authentication",
  types: [MemoryType.CODE],
  importance: [MemoryImportance.HIGH],
  tags: ["security"],
  limit: 10,
  minScore: 0.5,
});
```

##### `getRelevantMemories(query: string, options?): Promise<MemorySearchResult[]>`

Get relevant memories for a query (simplified search).

##### `getMemory(id: string): Promise<Memory | undefined>`

Get a specific memory by ID.

##### `updateMemory(options: UpdateMemoryOptions): Promise<Memory | undefined>`

Update an existing memory.

##### `deleteMemory(id: string): Promise<boolean>`

Delete a memory.

##### `getStats(): Promise<MemoryStats>`

Get memory statistics.

##### `export(workspacePath?: string): Promise<MemoryExport>`

Export memories to JSON.

##### `import(data: MemoryExport): Promise<number>`

Import memories from JSON.

##### `clearAll(): Promise<void>`

Clear all memories.

---

## 🔧 Configuration

### User Config (`~/.continue/config.json`)

```json
{
  "memory": {
    "enabled": true,
    "storagePath": "~/.continue/memory",
    "maxMemories": 10000,
    "autoSaveConversations": true,
    "autoSaveCode": false,
    "defaultImportance": "medium",
    "defaultScope": "workspace"
  }
}
```

### Workspace Config (`.continue/config.json`)

```json
{
  "memory": {
    "enabled": true,
    "autoSaveConversations": true,
    "projectInfo": {
      "techStack": "React, TypeScript, Vite",
      "conventions": "Use functional components, hooks",
      "testingFramework": "Vitest"
    }
  }
}
```

---

## 💡 Use Cases

### 1. **Remember Coding Preferences**

```typescript
// User tells Continue: "I prefer using const over let"
await memoryManager.rememberPreference(
  "Prefer const over let for variable declarations",
  { category: "coding-style" },
);

// Later, when generating code, Continue retrieves this preference
const preferences = await memoryManager.getRelevantMemories(
  "variable declaration",
  { types: [MemoryType.PREFERENCE] },
);
```

### 2. **Remember Project Context**

```typescript
// Remember tech stack
await memoryManager.rememberProject(
  "This project uses React 18, TypeScript, Vite, and Vitest for testing",
  { title: "Tech Stack", tags: ["react", "typescript", "vite"] },
);

// Remember conventions
await memoryManager.rememberProject(
  "Always use functional components with hooks. Avoid class components.",
  { title: "Component Conventions", tags: ["react", "conventions"] },
);
```

### 3. **Remember Code Patterns**

```typescript
// User shows Continue a preferred pattern
await memoryManager.rememberCode(
  `
  // Error handling pattern
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error) {
    logger.error(error);
    return { success: false, error: error.message };
  }
  `,
  {
    language: "typescript",
    description: "Preferred error handling pattern",
    tags: ["error-handling", "pattern"],
  },
);
```

### 4. **Remember Conversations**

```typescript
// Automatically saved when user chats with Continue
await memoryManager.rememberConversation(
  "How do I implement authentication in this project?",
  "Based on your tech stack (React + TypeScript), I recommend using JWT...",
  {
    tags: ["authentication", "jwt", "react"],
    metadata: { timestamp: Date.now() },
  },
);
```

---

## 🧪 Testing

Run the memory system tests:

```bash
cd core
npx tsx context/retrieval/test-memory-system.ts
```

Expected output:

```
🧪 Memory System Test Suite

=== Testing Memory Creation ===
✅ Can create conversation memory
✅ Can create code memory
✅ Can create preference memory
✅ Can create project memory

=== Testing Memory Retrieval ===
✅ Can retrieve memory by ID
✅ Can search memories by text query
✅ Can search memories by type
✅ Can search memories by tags
...

🎉 All memory system tests passed!
```

---

## 📊 Memory Statistics

Get insights into your memories:

```typescript
const stats = await memoryManager.getStats();

console.log(`Total memories: ${stats.total}`);
console.log(`By type:`, stats.byType);
console.log(`By importance:`, stats.byImportance);
console.log(`Storage size: ${stats.storageSize} bytes`);
console.log(`Most accessed:`, stats.mostAccessed);
```

---

## 🔒 Privacy & Security

- **Local Storage**: All memories are stored locally in `~/.continue/memory`
- **No Cloud Sync**: Memories are never sent to external servers
- **User Control**: Users can view, edit, and delete all memories
- **Export/Import**: Easy backup and migration

---

## 🚀 Next Steps

1. **Run Tests**: `npx tsx context/retrieval/test-memory-system.ts`
2. **Integrate with Pipeline**: Add memory retrieval to BaseRetrievalPipeline
3. **Enable in Extension**: Configure memory in VS Code extension
4. **Test with Real Usage**: Use Continue.dev and observe memory behavior

---

## 📝 Notes

- Memories are automatically cleaned up based on importance and access patterns
- Critical memories are never auto-deleted
- Session-scoped memories are cleared when session ends
- Export memories regularly for backup

---

**Memory Feature Version**: 1.0.0  
**Last Updated**: 2025-11-02  
**Status**: ✅ Ready for Integration
