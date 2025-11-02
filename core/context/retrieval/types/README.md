# Enhanced Retrieval Types

This directory contains type definitions for the enhanced multi-source context retrieval pipeline.

## Overview

The enhanced retrieval pipeline extends Continue's context engine to support **10+ context sources** instead of the original 4, enabling more accurate and comprehensive code understanding.

## Files

- **`EnhancedRetrievalTypes.ts`** - Core type definitions and interfaces
- **`EnhancedRetrievalTypes.test.ts`** - Unit tests for types and helper functions
- **`README.md`** - This file

## Key Interfaces

### `EnhancedRetrievalSources`

Aggregates chunks from all available context sources:

```typescript
interface EnhancedRetrievalSources {
  // Existing sources (4)
  fts: Chunk[];                    // Full-Text Search
  embeddings: Chunk[];             // Vector Embeddings
  recentlyEdited: Chunk[];         // Recently Edited Files
  repoMap: Chunk[];                // Repository Map
  
  // New sources (5)
  lspDefinitions: Chunk[];         // LSP Definitions
  importAnalysis: Chunk[];         // Import Dependencies
  recentlyVisitedRanges: Chunk[];  // User Navigation
  staticContext: Chunk[];          // Pattern Matching
  toolBasedSearch: Chunk[];        // Intelligent Tools
}
```

### `IEnhancedRetrievalPipeline`

Main interface for the enhanced pipeline:

```typescript
interface IEnhancedRetrievalPipeline {
  // Backward compatible
  run(args): Promise<Chunk[]>;
  
  // New methods
  retrieveFromMultipleSources(args): Promise<EnhancedRetrievalResult>;
  fuseResults(sources, options?): Promise<Chunk[]>;
  runEnhanced(args): Promise<Chunk[]>;
}
```

### `RetrievalSourceConfig`

Configure which sources to enable:

```typescript
interface RetrievalSourceConfig {
  enableFts?: boolean;
  enableEmbeddings?: boolean;
  enableLspDefinitions?: boolean;
  // ... etc
}
```

### `FusionOptions`

Control how results are fused:

```typescript
interface FusionOptions {
  maxChunks: number;
  enableSemanticDedup?: boolean;
  enableCrossReference?: boolean;
  sourceWeights?: Partial<Record<keyof EnhancedRetrievalSources, number>>;
}
```

## Helper Functions

### `getEnabledSources(config?)`

Get which sources are enabled from config:

```typescript
const enabled = getEnabledSources(config);
// { fts: true, embeddings: true, ... }
```

### `createEmptyRetrievalSources()`

Create empty sources object:

```typescript
const sources = createEmptyRetrievalSources();
// { fts: [], embeddings: [], ... }
```

### `countTotalChunks(sources)`

Count total chunks across all sources:

```typescript
const total = countTotalChunks(sources);
// 42
```

### `mergeAllChunks(sources)`

Merge all chunks into single array:

```typescript
const allChunks = mergeAllChunks(sources);
// [chunk1, chunk2, ...]
```

## Usage Example

```typescript
import {
  IEnhancedRetrievalPipeline,
  EnhancedRetrievalPipelineRunArguments,
  DEFAULT_SOURCE_CONFIG,
  DEFAULT_FUSION_OPTIONS,
} from './types/EnhancedRetrievalTypes';

// Create pipeline (implementation in Phase 1.2)
const pipeline: IEnhancedRetrievalPipeline = new EnhancedRetrievalPipeline(options);

// Run enhanced retrieval
const args: EnhancedRetrievalPipelineRunArguments = {
  query: "How does authentication work?",
  tags: [{ directory: "/src", branch: "main" }],
  includeEmbeddings: true,
  sourceConfig: DEFAULT_SOURCE_CONFIG,
  fusionOptions: DEFAULT_FUSION_OPTIONS,
};

const chunks = await pipeline.runEnhanced(args);
```

## Default Configurations

### Source Weights

Default weights for fusion (sum to 1.0):

```typescript
{
  fts: 0.15,                    // 15%
  embeddings: 0.25,             // 25% (highest)
  recentlyEdited: 0.15,         // 15%
  repoMap: 0.10,                // 10%
  lspDefinitions: 0.15,         // 15%
  importAnalysis: 0.10,         // 10%
  recentlyVisitedRanges: 0.05,  // 5%
  staticContext: 0.03,          // 3%
  toolBasedSearch: 0.02,        // 2%
}
```

These weights are adaptive and will change based on query type in Phase 3.3.

## Testing

Run tests:

```bash
npm test core/context/retrieval/types/EnhancedRetrievalTypes.test.ts
```

## Roadmap

- ✅ **Phase 1.1** - Type definitions (this file)
- ⏳ **Phase 1.2** - Multi-Source Retrieval Manager
- ⏳ **Phase 1.3** - Dependency Graph Builder
- ⏳ **Phase 1.4** - Refactor BaseRetrievalPipeline

See `CONTEXT_ENGINE_IMPROVEMENT_ROADMAP.md` for full roadmap.

## Design Decisions

### Why 10 sources?

Each source provides unique context:
- **FTS**: Keyword matching
- **Embeddings**: Semantic similarity
- **LSP**: Type definitions, references
- **Imports**: Dependency relationships
- **Navigation**: User behavior patterns
- **Static**: Code patterns and idioms

### Why separate retrieval and fusion?

Separation allows:
1. Parallel retrieval from all sources
2. Custom fusion strategies
3. Debugging individual sources
4. Graceful degradation if sources fail

### Why backward compatibility?

Existing code uses `IRetrievalPipeline.run()`. We maintain this interface while adding enhanced methods.

## Contributing

When adding new source types:

1. Add to `EnhancedRetrievalSources` interface
2. Add enable flag to `RetrievalSourceConfig`
3. Update `DEFAULT_SOURCE_CONFIG`
4. Add weight to `DEFAULT_FUSION_OPTIONS`
5. Update helper functions
6. Add tests

## License

Same as Continue.dev (Apache 2.0)

