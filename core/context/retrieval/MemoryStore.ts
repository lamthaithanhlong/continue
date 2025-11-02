/**
 * Memory Store
 *
 * Persistent storage layer for memories using file-based storage.
 * Supports CRUD operations, search, and automatic cleanup.
 *
 * Part of Context Engine Enhancement - Memory Feature
 */

import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

import {
  Memory,
  MemoryImportance,
  MemoryScope,
  MemoryStats,
  MemoryStoreConfig,
  MemoryType,
} from "./types/MemoryTypes.js";

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MemoryStoreConfig> = {
  storagePath: path.join(process.env.HOME || "~", ".continue", "memory"),
  maxMemories: 10000,
  maxStorageSize: 100 * 1024 * 1024, // 100MB
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  enableEmbeddings: false,
  embeddingModel: "text-embedding-ada-002",
};

/**
 * Memory Store
 *
 * File-based storage for memories with indexing and search capabilities.
 */
export class MemoryStore {
  private config: Required<MemoryStoreConfig>;
  private memories: Map<string, Memory> = new Map();
  private cleanupTimer?: NodeJS.Timeout;
  private initialized = false;

  constructor(config: MemoryStoreConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the memory store
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.config.storagePath)) {
      fs.mkdirSync(this.config.storagePath, { recursive: true });
    }

    // Load existing memories
    await this.loadMemories();

    // Start auto-cleanup if enabled
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }

    this.initialized = true;
  }

  /**
   * Create a new memory
   */
  async create(
    memory: Omit<
      Memory,
      "id" | "createdAt" | "updatedAt" | "lastAccessedAt" | "accessCount"
    >,
  ): Promise<Memory> {
    const now = Date.now();
    const newMemory: Memory = {
      ...memory,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      accessCount: 0,
    };

    this.memories.set(newMemory.id, newMemory);
    await this.saveMemory(newMemory);

    // Check if cleanup is needed
    if (this.memories.size > this.config.maxMemories) {
      await this.cleanup();
    }

    return newMemory;
  }

  /**
   * Get a memory by ID
   */
  async get(id: string): Promise<Memory | undefined> {
    const memory = this.memories.get(id);
    if (memory) {
      // Update access tracking
      memory.lastAccessedAt = Date.now();
      memory.accessCount++;
      await this.saveMemory(memory);
    }
    return memory;
  }

  /**
   * Update a memory
   */
  async update(
    id: string,
    updates: Partial<Memory>,
  ): Promise<Memory | undefined> {
    const memory = this.memories.get(id);
    if (!memory) return undefined;

    const updatedMemory: Memory = {
      ...memory,
      ...updates,
      id: memory.id, // Preserve ID
      createdAt: memory.createdAt, // Preserve creation time
      updatedAt: Date.now(),
    };

    this.memories.set(id, updatedMemory);
    await this.saveMemory(updatedMemory);

    return updatedMemory;
  }

  /**
   * Delete a memory
   */
  async delete(id: string): Promise<boolean> {
    const memory = this.memories.get(id);
    if (!memory) return false;

    this.memories.delete(id);
    await this.deleteMemoryFile(id);

    return true;
  }

  /**
   * Search memories
   */
  async search(
    query: string,
    filters?: {
      types?: MemoryType[];
      importance?: MemoryImportance[];
      scopes?: MemoryScope[];
      workspacePath?: string;
      filePath?: string;
      tags?: string[];
      limit?: number;
    },
  ): Promise<Memory[]> {
    let results = Array.from(this.memories.values());

    // Apply filters
    if (filters?.types) {
      results = results.filter((m) => filters.types!.includes(m.type));
    }
    if (filters?.importance) {
      results = results.filter((m) =>
        filters.importance!.includes(m.importance),
      );
    }
    if (filters?.scopes) {
      results = results.filter((m) => filters.scopes!.includes(m.scope));
    }
    if (filters?.workspacePath) {
      results = results.filter(
        (m) => m.workspacePath === filters.workspacePath,
      );
    }
    if (filters?.filePath) {
      results = results.filter((m) => m.filePath === filters.filePath);
    }
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter((m) =>
        filters.tags!.some((tag) => m.tags.includes(tag)),
      );
    }

    // Text search (simple substring match)
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (m) =>
          m.content.toLowerCase().includes(lowerQuery) ||
          m.title?.toLowerCase().includes(lowerQuery) ||
          m.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
      );
    }

    // Sort by relevance (importance + recency + access count)
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a);
      const scoreB = this.calculateRelevanceScore(b);
      return scoreB - scoreA;
    });

    // Apply limit
    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    // Update access tracking
    results.forEach((memory) => {
      memory.lastAccessedAt = Date.now();
      memory.accessCount++;
    });

    return results;
  }

  /**
   * Get all memories
   */
  async getAll(): Promise<Memory[]> {
    return Array.from(this.memories.values());
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<MemoryStats> {
    const memories = Array.from(this.memories.values());

    const byType: Record<MemoryType, number> = {
      [MemoryType.CONVERSATION]: 0,
      [MemoryType.CODE]: 0,
      [MemoryType.PREFERENCE]: 0,
      [MemoryType.PROJECT]: 0,
      [MemoryType.FILE]: 0,
      [MemoryType.KNOWLEDGE]: 0,
    };

    const byImportance: Record<MemoryImportance, number> = {
      [MemoryImportance.CRITICAL]: 0,
      [MemoryImportance.HIGH]: 0,
      [MemoryImportance.MEDIUM]: 0,
      [MemoryImportance.LOW]: 0,
    };

    const byScope: Record<MemoryScope, number> = {
      [MemoryScope.GLOBAL]: 0,
      [MemoryScope.WORKSPACE]: 0,
      [MemoryScope.FILE]: 0,
      [MemoryScope.SESSION]: 0,
    };

    memories.forEach((memory) => {
      byType[memory.type]++;
      byImportance[memory.importance]++;
      byScope[memory.scope]++;
    });

    const mostAccessed = memories
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    const recentlyAdded = memories
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    return {
      total: memories.length,
      byType,
      byImportance,
      byScope,
      storageSize: this.calculateStorageSize(),
      mostAccessed,
      recentlyAdded,
    };
  }

  /**
   * Clear all memories
   */
  async clear(): Promise<void> {
    this.memories.clear();

    // Delete all memory files
    const files = fs.readdirSync(this.config.storagePath);
    for (const file of files) {
      if (file.endsWith(".json")) {
        fs.unlinkSync(path.join(this.config.storagePath, file));
      }
    }
  }

  /**
   * Cleanup old/unused memories
   */
  private async cleanup(): Promise<void> {
    const memories = Array.from(this.memories.values());

    // Sort by relevance (least relevant first)
    memories.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a);
      const scoreB = this.calculateRelevanceScore(b);
      return scoreA - scoreB;
    });

    // Remove least relevant memories until under limit
    const toRemove = memories.length - this.config.maxMemories;
    if (toRemove > 0) {
      for (let i = 0; i < toRemove; i++) {
        await this.delete(memories[i].id);
      }
    }
  }

  /**
   * Calculate relevance score for sorting
   */
  private calculateRelevanceScore(memory: Memory): number {
    const importanceScore = {
      [MemoryImportance.CRITICAL]: 1000,
      [MemoryImportance.HIGH]: 100,
      [MemoryImportance.MEDIUM]: 10,
      [MemoryImportance.LOW]: 1,
    }[memory.importance];

    const recencyScore =
      (Date.now() - memory.lastAccessedAt) / (1000 * 60 * 60 * 24); // Days since last access
    const accessScore = memory.accessCount;

    return importanceScore + accessScore - recencyScore;
  }

  /**
   * Calculate total storage size
   */
  private calculateStorageSize(): number {
    let totalSize = 0;
    const files = fs.readdirSync(this.config.storagePath);

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(this.config.storagePath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Load memories from disk
   */
  private async loadMemories(): Promise<void> {
    if (!fs.existsSync(this.config.storagePath)) {
      return;
    }

    const files = fs.readdirSync(this.config.storagePath);

    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const filePath = path.join(this.config.storagePath, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const memory: Memory = JSON.parse(content);
          this.memories.set(memory.id, memory);
        } catch (error) {
          console.error(`Failed to load memory from ${file}:`, error);
        }
      }
    }
  }

  /**
   * Save a memory to disk
   */
  private async saveMemory(memory: Memory): Promise<void> {
    const filePath = path.join(this.config.storagePath, `${memory.id}.json`);
    const content = JSON.stringify(memory, null, 2);
    fs.writeFileSync(filePath, content, "utf-8");
  }

  /**
   * Delete a memory file from disk
   */
  private async deleteMemoryFile(id: string): Promise<void> {
    const filePath = path.join(this.config.storagePath, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      void this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    this.stopAutoCleanup();
    this.memories.clear();
    this.initialized = false;
  }
}
