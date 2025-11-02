/**
 * Memory Manager
 *
 * High-level API for managing memories in Continue.dev.
 * Provides user-friendly methods for creating, searching, and managing memories.
 *
 * Part of Context Engine Enhancement - Memory Feature
 */

import { MemoryStore } from "./MemoryStore.js";
import {
  CreateMemoryOptions,
  Memory,
  MemoryExport,
  MemoryImportance,
  MemoryManagerConfig,
  MemoryQuery,
  MemoryScope,
  MemorySearchResult,
  MemoryStats,
  MemoryType,
  UpdateMemoryOptions,
} from "./types/MemoryTypes.js";

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MemoryManagerConfig> = {
  storeConfig: {
    storagePath: "",
    maxMemories: 10000,
    maxStorageSize: 100 * 1024 * 1024,
    autoCleanup: true,
    cleanupInterval: 24 * 60 * 60 * 1000,
    enableEmbeddings: false,
    embeddingModel: "text-embedding-ada-002",
  },
  enabled: true,
  defaultImportance: MemoryImportance.MEDIUM,
  defaultScope: MemoryScope.WORKSPACE,
  autoSaveConversations: true,
  autoSaveCode: false,
  maxConversationHistory: 100,
};

/**
 * Memory Manager
 *
 * Manages memories with automatic categorization, search, and retrieval.
 */
export class MemoryManager {
  private store: MemoryStore;
  private config: Required<MemoryManagerConfig>;
  private initialized = false;
  private currentWorkspacePath?: string;

  constructor(config: MemoryManagerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = new MemoryStore(this.config.storeConfig);
  }

  /**
   * Initialize the memory manager
   */
  async initialize(workspacePath?: string): Promise<void> {
    if (this.initialized) return;

    this.currentWorkspacePath = workspacePath;
    await this.store.initialize();
    this.initialized = true;

    if (this.config.enabled) {
      console.log(
        `[MemoryManager] Initialized for workspace: ${workspacePath || "global"}`,
      );
    }
  }

  /**
   * Create a new memory
   */
  async createMemory(options: CreateMemoryOptions): Promise<Memory> {
    if (!this.config.enabled) {
      throw new Error("Memory feature is disabled");
    }

    const memory = await this.store.create({
      content: options.content,
      type: options.type,
      title: options.title,
      importance: options.importance || this.config.defaultImportance,
      scope: options.scope || this.config.defaultScope,
      workspacePath: options.workspacePath || this.currentWorkspacePath,
      filePath: options.filePath,
      tags: options.tags || [],
      metadata: options.metadata || {},
    });

    if (this.config.enabled) {
      console.log(
        `[MemoryManager] Memory created: ${memory.id} (${memory.type})`,
      );
    }

    return memory;
  }

  /**
   * Get a memory by ID
   */
  async getMemory(id: string): Promise<Memory | undefined> {
    return this.store.get(id);
  }

  /**
   * Update a memory
   */
  async updateMemory(
    options: UpdateMemoryOptions,
  ): Promise<Memory | undefined> {
    const memory = await this.store.update(options.id, {
      content: options.content,
      title: options.title,
      importance: options.importance,
      tags: options.tags,
      metadata: options.metadata,
    });

    if (memory && this.config.enabled) {
      console.log(`[MemoryManager] Memory updated: ${memory.id}`);
    }

    return memory;
  }

  /**
   * Delete a memory
   */
  async deleteMemory(id: string): Promise<boolean> {
    const success = await this.store.delete(id);

    if (success && this.config.enabled) {
      console.log(`[MemoryManager] Memory deleted: ${id}`);
    }

    return success;
  }

  /**
   * Search memories
   */
  async searchMemories(query: MemoryQuery): Promise<MemorySearchResult[]> {
    const startTime = Date.now();

    const memories = await this.store.search(query.query, {
      types: query.types,
      importance: query.importance,
      scopes: query.scopes,
      workspacePath: query.workspacePath || this.currentWorkspacePath,
      filePath: query.filePath,
      tags: query.tags,
      limit: query.limit || 10,
    });

    const results: MemorySearchResult[] = memories.map((memory) => ({
      memory,
      score: this.calculateScore(memory, query),
      reason: this.getRetrievalReason(memory, query),
    }));

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Apply min score filter
    const filtered = query.minScore
      ? results.filter((r) => r.score >= query.minScore!)
      : results;

    const timeMs = Date.now() - startTime;

    if (this.config.enabled) {
      console.log(
        `[MemoryManager] Search completed: ${filtered.length} results in ${timeMs}ms`,
      );
    }

    return filtered;
  }

  /**
   * Remember a conversation
   */
  async rememberConversation(
    userMessage: string,
    assistantMessage: string,
    context?: {
      filePath?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<Memory> {
    if (!this.config.autoSaveConversations) {
      throw new Error("Auto-save conversations is disabled");
    }

    const content = `User: ${userMessage}\n\nAssistant: ${assistantMessage}`;

    return this.createMemory({
      content,
      type: MemoryType.CONVERSATION,
      title: userMessage.substring(0, 100),
      importance: MemoryImportance.MEDIUM,
      scope: context?.filePath ? MemoryScope.FILE : MemoryScope.WORKSPACE,
      filePath: context?.filePath,
      tags: context?.tags || ["conversation"],
      metadata: {
        ...context?.metadata,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Remember a code snippet
   */
  async rememberCode(
    code: string,
    context: {
      language?: string;
      filePath?: string;
      description?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<Memory> {
    if (!this.config.autoSaveCode) {
      throw new Error("Auto-save code is disabled");
    }

    return this.createMemory({
      content: code,
      type: MemoryType.CODE,
      title: context.description || "Code snippet",
      importance: MemoryImportance.MEDIUM,
      scope: context.filePath ? MemoryScope.FILE : MemoryScope.WORKSPACE,
      filePath: context.filePath,
      tags: context.tags || [context.language || "code"],
      metadata: {
        ...context.metadata,
        language: context.language,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Remember a preference
   */
  async rememberPreference(
    preference: string,
    context?: {
      category?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<Memory> {
    return this.createMemory({
      content: preference,
      type: MemoryType.PREFERENCE,
      title: context?.category || "User preference",
      importance: MemoryImportance.HIGH,
      scope: MemoryScope.GLOBAL,
      tags: context?.tags || ["preference", context?.category || "general"],
      metadata: {
        ...context?.metadata,
        category: context?.category,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Remember project information
   */
  async rememberProject(
    information: string,
    context?: {
      title?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    },
  ): Promise<Memory> {
    return this.createMemory({
      content: information,
      type: MemoryType.PROJECT,
      title: context?.title || "Project information",
      importance: MemoryImportance.HIGH,
      scope: MemoryScope.WORKSPACE,
      tags: context?.tags || ["project"],
      metadata: {
        ...context?.metadata,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get relevant memories for a query
   */
  async getRelevantMemories(
    query: string,
    options?: {
      types?: MemoryType[];
      limit?: number;
      minScore?: number;
    },
  ): Promise<MemorySearchResult[]> {
    return this.searchMemories({
      query,
      types: options?.types,
      scopes: [MemoryScope.GLOBAL, MemoryScope.WORKSPACE],
      limit: options?.limit || 5,
      minScore: options?.minScore || 0.1,
    });
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<MemoryStats> {
    return this.store.getStats();
  }

  /**
   * Clear all memories
   */
  async clearAll(): Promise<void> {
    await this.store.clear();
    if (this.config.enabled) {
      console.log("[MemoryManager] All memories cleared");
    }
  }

  /**
   * Export memories
   */
  async export(workspacePath?: string): Promise<MemoryExport> {
    const memories = await this.store.getAll();
    const stats = await this.store.getStats();

    const filtered = workspacePath
      ? memories.filter((m) => m.workspacePath === workspacePath)
      : memories;

    return {
      version: "1.0.0",
      exportedAt: Date.now(),
      workspacePath,
      memories: filtered,
      stats,
    };
  }

  /**
   * Import memories
   */
  async import(data: MemoryExport): Promise<number> {
    let imported = 0;

    for (const memory of data.memories) {
      try {
        await this.store.create(memory);
        imported++;
      } catch (error) {
        console.error(
          `[MemoryManager] Failed to import memory ${memory.id}:`,
          error,
        );
      }
    }

    if (this.config.enabled) {
      console.log(
        `[MemoryManager] Imported ${imported}/${data.memories.length} memories`,
      );
    }

    return imported;
  }

  /**
   * Calculate relevance score for a memory
   */
  private calculateScore(memory: Memory, query: MemoryQuery): number {
    let score = 0;

    // Importance score
    const importanceScores = {
      [MemoryImportance.CRITICAL]: 1.0,
      [MemoryImportance.HIGH]: 0.8,
      [MemoryImportance.MEDIUM]: 0.5,
      [MemoryImportance.LOW]: 0.3,
    };
    score += importanceScores[memory.importance];

    // Recency score (more recent = higher score)
    const daysSinceAccess =
      (Date.now() - memory.lastAccessedAt) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceAccess / 30); // Decay over 30 days
    score += recencyScore * 0.5;

    // Access count score (normalized)
    const accessScore = Math.min(1, memory.accessCount / 100);
    score += accessScore * 0.3;

    // Tag match score
    if (query.tags && query.tags.length > 0) {
      const matchingTags = query.tags.filter((tag) =>
        memory.tags.includes(tag),
      );
      score += (matchingTags.length / query.tags.length) * 0.5;
    }

    return score;
  }

  /**
   * Get retrieval reason for debugging
   */
  private getRetrievalReason(memory: Memory, query: MemoryQuery): string {
    const reasons: string[] = [];

    if (query.types?.includes(memory.type)) {
      reasons.push(`type:${memory.type}`);
    }

    if (query.importance?.includes(memory.importance)) {
      reasons.push(`importance:${memory.importance}`);
    }

    if (query.tags && query.tags.some((tag) => memory.tags.includes(tag))) {
      reasons.push("tag-match");
    }

    if (memory.importance === MemoryImportance.CRITICAL) {
      reasons.push("critical");
    }

    if (memory.accessCount > 10) {
      reasons.push("frequently-accessed");
    }

    return reasons.join(", ") || "text-match";
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    await this.store.dispose();
    this.initialized = false;
  }
}
