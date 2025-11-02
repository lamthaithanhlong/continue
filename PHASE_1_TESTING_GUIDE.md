# Phase 1 Testing Guide

Hướng dẫn test từng phase mà **KHÔNG CẦN compile extension**.

---

## 🧪 Phase 1.1: Enhanced Retrieval Pipeline Interface

### Quick Test (Recommended)

```bash
cd core
npx tsx context/retrieval/types/manual-test.ts
```

**Expected output:**
```
🎉 All tests passed! Phase 1.1 is working correctly! ✅
```

### What it tests:

✅ **Default Configurations**
- All 9 sources enabled by default
- Fusion options configured correctly
- Source weights sum to 1.0

✅ **Helper Functions**
- `getEnabledSources()` - with default and custom config
- `createEmptyRetrievalSources()` - creates new objects
- `countTotalChunks()` - counts correctly
- `mergeAllChunks()` - merges and preserves order

✅ **Type Compatibility**
- All interfaces work correctly
- No TypeScript errors
- All imports resolve

✅ **9 Context Sources**
- fts, embeddings, recentlyEdited, repoMap (existing)
- lspDefinitions, importAnalysis, recentlyVisitedRanges, staticContext, toolBasedSearch (new)

### Alternative: TypeScript Check Only

```bash
cd core
npm run tsc:check 2>&1 | grep -i "error" || echo "✅ No TypeScript errors"
```

### Alternative: Unit Tests (requires vitest)

```bash
cd core
npm install  # if not installed
npm run vitest -- context/retrieval/types/EnhancedRetrievalTypes.test.ts
```

---

## 🧪 Phase 1.2: Multi-Source Retrieval Manager

**Status**: Not yet implemented

**Planned test:**
```bash
cd core
npx tsx context/retrieval/MultiSourceRetrievalManager.test.ts
```

**What it will test:**
- Parallel retrieval from all sources
- Error handling for each source
- Performance tracking
- Graceful degradation

---

## 🧪 Phase 1.3: Dependency Graph Builder

**Status**: Not yet implemented

**Planned test:**
```bash
cd core
npx tsx context/retrieval/DependencyGraphBuilder.test.ts
```

**What it will test:**
- Import chain analysis
- BFS traversal
- Circular dependency detection
- Graph construction

---

## 🧪 Phase 1.4: Refactor BaseRetrievalPipeline

**Status**: Not yet implemented

**Planned test:**
```bash
cd core
npx tsx context/retrieval/pipelines/BaseRetrievalPipeline.test.ts
```

**What it will test:**
- Backward compatibility
- Integration with MultiSourceRetrievalManager
- All existing tests still pass
- New enhanced methods work

---

## 📊 Current Test Results

### Phase 1.1 ✅

```
============================================================
📊 Test Summary
============================================================
✅ Passed: 33
❌ Failed: 0
📈 Total:  33

🎉 All tests passed! Phase 1.1 is working correctly! ✅
```

**Breakdown:**
- ✅ Default Configurations: 5 tests
- ✅ Source Weights: 1 test
- ✅ getEnabledSources(): 4 tests
- ✅ createEmptyRetrievalSources(): 4 tests
- ✅ countTotalChunks(): 2 tests
- ✅ mergeAllChunks(): 4 tests
- ✅ Type Compatibility: 3 tests
- ✅ All 9 Sources Present: 10 tests

---

## 🚀 Quick Commands

### Test Phase 1.1
```bash
cd core && npx tsx context/retrieval/types/manual-test.ts
```

### Check TypeScript Errors
```bash
cd core && npm run tsc:check
```

### Check Diagnostics (VSCode)
Open files in VSCode and check for red squiggly lines.

### View Test Coverage
```bash
cd core && npm run test:coverage
```

---

## 🔍 Debugging Failed Tests

### If tests fail:

1. **Check TypeScript errors first:**
   ```bash
   cd core && npm run tsc:check
   ```

2. **Check imports:**
   ```bash
   cd core
   npx tsx -e "import * as types from './context/retrieval/types/EnhancedRetrievalTypes'; console.log(Object.keys(types))"
   ```

3. **Run specific test:**
   Edit `manual-test.ts` to comment out passing tests and focus on failing ones.

4. **Check file exists:**
   ```bash
   ls -la core/context/retrieval/types/
   ```

---

## 📝 Test Checklist for Each Phase

Before marking a phase as complete:

- [ ] Manual test script passes (33/33 tests)
- [ ] No TypeScript errors (`npm run tsc:check`)
- [ ] No linting errors (`npm run lint`)
- [ ] All files committed to git
- [ ] Documentation updated
- [ ] README.md created for new modules

---

## 🎯 Integration Testing (Later Phases)

### Phase 2+: Integration with Real Codebase

After Phase 1 is complete, we'll test with real retrieval:

```bash
# Start Continue extension in development mode
cd extensions/vscode
npm run dev

# Test in VSCode:
# 1. Open a large codebase
# 2. Ask a question in Continue chat
# 3. Check context retrieval works
# 4. Verify all 9 sources are used
```

### Performance Testing

```bash
# Benchmark retrieval speed
cd core
npx tsx benchmarks/retrieval-benchmark.ts

# Expected metrics:
# - Retrieval time < 500ms
# - All sources complete < 2s
# - Memory usage < 100MB
```

---

## 🐛 Common Issues

### Issue: `tsx: command not found`

**Solution:**
```bash
npm install -g tsx
# or use npx (slower but no install needed)
npx tsx <file>
```

### Issue: `Cannot find module`

**Solution:**
```bash
cd core
npm install
```

### Issue: TypeScript errors

**Solution:**
```bash
# Check which files have errors
cd core
npm run tsc:check

# Fix imports in EnhancedRetrievalTypes.ts
```

### Issue: Tests pass but extension doesn't work

**Solution:**
This is expected! Phase 1.1 only creates types.
The actual implementation comes in Phase 1.2-1.4.

---

## 📈 Progress Tracking

| Phase | Status | Tests | Files |
|-------|--------|-------|-------|
| 1.1 Enhanced Interface | ✅ COMPLETE | 33/33 | 3 files |
| 1.2 Multi-Source Manager | ⏳ TODO | 0/0 | 0 files |
| 1.3 Dependency Graph | ⏳ TODO | 0/0 | 0 files |
| 1.4 Refactor Pipeline | ⏳ TODO | 0/0 | 0 files |

**Overall Phase 1**: 25% complete (1/4 tasks)

---

## 🎉 Success Criteria

### Phase 1.1 ✅

- [x] All 33 tests pass
- [x] No TypeScript errors
- [x] 9 sources defined
- [x] Helper functions work
- [x] Documentation complete
- [x] Git committed

### Phase 1.2 (TODO)

- [ ] Parallel retrieval works
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Integration tests pass

### Phase 1.3 (TODO)

- [ ] Dependency graph builds correctly
- [ ] Import chains found
- [ ] Circular deps detected
- [ ] BFS algorithm works

### Phase 1.4 (TODO)

- [ ] Backward compatible
- [ ] All existing tests pass
- [ ] New methods work
- [ ] Integration complete

---

**Last updated**: 2025-11-02  
**Current phase**: Phase 1.1 ✅ COMPLETE

