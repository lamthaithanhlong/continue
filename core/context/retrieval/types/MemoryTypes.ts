/**
 * Memory System Type Definitions
 *
 * Provides persistent memory capabilities for Continue.dev to remember:
 * - Conversation history and context
 * - User preferences and coding style
 * - Project-specific information
 * - Code patterns and snippets
 *
 * Part of Context Engine Enhancement - Memory Feature
 */

/**
 * Memory types categorize different kinds of memories
 */
export enum MemoryType {
  /** Conversation history and chat context */
  CONVERSATION = "conversation",
  /** Code snippets, patterns, and examples */
  CODE = "code",
  /** User preferences, coding style, conventions */
  PREFERENCE = "preference",
  /** Project-specific information and context */
  PROJECT = "project",
  /** File-specific notes and context */
  FILE = "file",
  /** General knowledge and facts */
  KNOWLEDGE = "knowledge",
}

/**
 * Memory importance level for prioritization
 */
export enum MemoryImportance {
  /** Critical information that should always be retrieved */
  CRITICAL = "critical",
  /** High importance, frequently relevant */
  HIGH = "high",
  /** Medium importance, sometimes relevant */
  MEDIUM = "medium",
  /** Low importance, rarely relevant */
  LOW = "low",
}

/**
 * Memory scope defines where the memory is applicable
 */
export enum MemoryScope {
  /** Global across all projects */
  GLOBAL = "global",
  /** Specific to current workspace/project */
  WORKSPACE = "workspace",
  /** Specific to a file or directory */
  FILE = "file",
  /** Specific to current session only */
  SESSION = "session",
}

/**
 * Core memory entry structure
 */
export interface Memory {
  /** Unique identifier */
  id: string;

  /** Memory type */
  type: MemoryType;

  /** Memory content (text, code, etc.) */
  content: string;

  /** Optional title/summary */
  title?: string;

  /** Memory importance level */
  importance: MemoryImportance;

  /** Memory scope */
  scope: MemoryScope;

  /** Workspace/project path (for workspace-scoped memories) */
  workspacePath?: string;

  /** File path (for file-scoped memories) */
  filePath?: string;

  /** Tags for categorization and search */
  tags: string[];

  /** Metadata (key-value pairs) */
  metadata: Record<string, any>;

  /** Creation timestamp */
  createdAt: number;

  /** Last updated timestamp */
  updatedAt: number;

  /** Last accessed timestamp (for LRU eviction) */
  lastAccessedAt: number;

  /** Access count (for popularity tracking) */
  accessCount: number;

  /** Embedding vector (for semantic search) */
  embedding?: number[];
}

/**
 * Memory search query
 */
export interface MemoryQuery {
  /** Search text */
  query: string;

  /** Filter by memory types */
  types?: MemoryType[];

  /** Filter by importance levels */
  importance?: MemoryImportance[];

  /** Filter by scopes */
  scopes?: MemoryScope[];

  /** Filter by workspace path */
  workspacePath?: string;

  /** Filter by file path */
  filePath?: string;

  /** Filter by tags */
  tags?: string[];

  /** Maximum number of results */
  limit?: number;

  /** Minimum similarity score (0-1) */
  minScore?: number;

  /** Include session-scoped memories */
  includeSession?: boolean;
}

/**
 * Memory search result
 */
export interface MemorySearchResult {
  /** The memory entry */
  memory: Memory;

  /** Relevance score (0-1) */
  score: number;

  /** Reason for retrieval (for debugging) */
  reason?: string;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  /** Total number of memories */
  total: number;

  /** Count by type */
  byType: Record<MemoryType, number>;

  /** Count by importance */
  byImportance: Record<MemoryImportance, number>;

  /** Count by scope */
  byScope: Record<MemoryScope, number>;

  /** Total storage size (bytes) */
  storageSize: number;

  /** Most accessed memories */
  mostAccessed: Memory[];

  /** Recently added memories */
  recentlyAdded: Memory[];
}

/**
 * Memory store configuration
 */
export interface MemoryStoreConfig {
  /** Storage directory path */
  storagePath: string;

  /** Maximum number of memories to store */
  maxMemories?: number;

  /** Maximum storage size in bytes */
  maxStorageSize?: number;

  /** Enable automatic cleanup of old memories */
  autoCleanup?: boolean;

  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;

  /** Enable embeddings for semantic search */
  enableEmbeddings?: boolean;

  /** Embedding model to use */
  embeddingModel?: string;
}

/**
 * Memory manager configuration
 */
export interface MemoryManagerConfig {
  /** Memory store configuration */
  storeConfig: MemoryStoreConfig;

  /** Enable memory feature */
  enabled?: boolean;

  /** Default importance level for new memories */
  defaultImportance?: MemoryImportance;

  /** Default scope for new memories */
  defaultScope?: MemoryScope;

  /** Auto-save conversation history */
  autoSaveConversations?: boolean;

  /** Auto-save code snippets */
  autoSaveCode?: boolean;

  /** Maximum conversation history length */
  maxConversationHistory?: number;
}

/**
 * Memory creation options
 */
export interface CreateMemoryOptions {
  /** Memory content */
  content: string;

  /** Memory type */
  type: MemoryType;

  /** Optional title */
  title?: string;

  /** Importance level (defaults to config default) */
  importance?: MemoryImportance;

  /** Scope (defaults to config default) */
  scope?: MemoryScope;

  /** Workspace path (for workspace-scoped) */
  workspacePath?: string;

  /** File path (for file-scoped) */
  filePath?: string;

  /** Tags */
  tags?: string[];

  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Memory update options
 */
export interface UpdateMemoryOptions {
  /** Memory ID to update */
  id: string;

  /** New content (optional) */
  content?: string;

  /** New title (optional) */
  title?: string;

  /** New importance (optional) */
  importance?: MemoryImportance;

  /** New tags (optional) */
  tags?: string[];

  /** New metadata (optional, merged with existing) */
  metadata?: Record<string, any>;
}

/**
 * Memory export format
 */
export interface MemoryExport {
  /** Export version */
  version: string;

  /** Export timestamp */
  exportedAt: number;

  /** Workspace path (if applicable) */
  workspacePath?: string;

  /** Memories */
  memories: Memory[];

  /** Statistics */
  stats: MemoryStats;
}
